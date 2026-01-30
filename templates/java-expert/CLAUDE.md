# Java Expert Development Guide

Principal-level guidelines for Java engineering. Deep JVM knowledge, modern language features, and production-grade patterns.

---

## Overview

This guide applies to:
- Web services and APIs (Spring Boot, Quarkus, Micronaut)
- Microservices and distributed systems
- Event-driven architectures (Kafka, RabbitMQ)
- Batch processing and data pipelines
- Libraries and Maven/Gradle artifacts
- Cloud-native applications (Kubernetes, GraalVM native images)

### Core Philosophy

Java's strength is its ecosystem maturity and runtime reliability. The best Java code is clear, testable, and boring.

- **Readability over cleverness.** A junior engineer should understand your code without a tutorial.
- **Immutability by default.** Records, `final` fields, unmodifiable collections. Mutation is the exception.
- **Composition over inheritance.** Interfaces, delegation, and dependency injection — not deep class hierarchies.
- **The JVM is your ally.** Understand garbage collection, JIT compilation, and memory model — don't fight them.
- **Fail fast, fail loud.** Validate at boundaries, throw meaningful exceptions, never swallow errors.
- **If you don't know, say so.** Admitting uncertainty is professional. Guessing at JVM behavior you haven't verified is not.

### Key Principles

1. **Modern Java Is Required** — Java 21+ features: records, sealed classes, pattern matching, virtual threads
2. **Null Is a Bug** — Use `Optional` for return types, `@Nullable`/`@NonNull` annotations, and validation at boundaries
3. **Dependency Injection Is the Architecture** — Constructor injection, interface segregation, Spring's application context
4. **Tests Are Documentation** — Descriptive names, Arrange-Act-Assert, behavior over implementation
5. **Observability Is Not Optional** — Structured logging, metrics, distributed tracing from day one

### Project Structure

```
project/
├── src/main/java/com/example/myapp/
│   ├── Application.java
│   ├── config/
│   ├── domain/
│   │   ├── model/
│   │   ├── service/
│   │   └── event/
│   ├── application/
│   │   ├── command/
│   │   ├── query/
│   │   └── port/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── messaging/
│   │   └── client/
│   └── api/
│       ├── controller/
│       ├── dto/
│       └── exception/
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
├── src/test/java/
├── pom.xml or build.gradle.kts
└── Dockerfile
```

---

## Modern Java

### Records

```java
public record CreateUserRequest(@NotBlank String name, @Email String email) {}
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("Amount cannot be negative");
    }
}
```

### Sealed Classes

```java
public sealed interface PaymentResult
    permits PaymentSuccess, PaymentFailure, PaymentPending {}

public String describe(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess s -> "Paid: " + s.transactionId();
        case PaymentFailure f -> "Failed: " + f.message();
        case PaymentPending p -> "Pending: " + p.referenceId();
    };
}
```

### Virtual Threads (Java 21+)

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var futures = tasks.stream()
        .map(task -> executor.submit(() -> process(task)))
        .toList();
}
// Don't pool them. Don't use synchronized for I/O. Use ReentrantLock instead.
```

---

## Spring Boot

### Service Layer

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        var order = Order.create(request);
        orderRepository.save(order);
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));
        return OrderResponse.from(order);
    }
}
```

### Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```

### Configuration

```java
@Validated
@ConfigurationProperties(prefix = "app.orders")
public record OrderProperties(
    @NotNull Duration processingTimeout,
    @Min(1) int maxItemsPerOrder
) {}
```

---

## Concurrency

### Rules

- Don't start threads you can't stop
- Prefer virtual threads for I/O, platform threads for CPU
- Use `ReentrantLock` over `synchronized` with virtual threads
- Always restore interrupt status in catch blocks
- Immutable objects are inherently thread-safe

### CompletableFuture

```java
var userFuture = CompletableFuture.supplyAsync(() -> userService.findById(userId));
var ordersFuture = CompletableFuture.supplyAsync(() -> orderService.recent(userId));
CompletableFuture.allOf(userFuture, ordersFuture)
    .thenApply(v -> new Dashboard(userFuture.join(), ordersFuture.join()));
```

---

## Persistence

### JPA Best Practices

- Factory methods on entities, protected no-arg constructors for JPA
- `@Version` for optimistic locking
- JOIN FETCH or `@EntityGraph` to prevent N+1 queries
- DTO projections for read-only queries
- `spring.jpa.open-in-view=false` — always

### Transactions

```java
@Transactional(readOnly = true) // On the class for reads
public Optional<Order> findById(UUID id) { ... }

@Transactional // Override for writes
public Order create(CreateOrderRequest request) { ... }
```

### Migrations

Flyway or Liquibase. Every schema change is a versioned migration. No Hibernate auto-DDL in production.

---

## Error Handling

### Two Approaches

1. **Exceptions** — Infrastructure failures, programming errors
2. **Result types** — Expected business failures (validation, conflicts)

### Guard Clauses

```java
Objects.requireNonNull(customerId, "customerId must not be null");
if (items.isEmpty()) throw new IllegalArgumentException("Order must have items");
```

### Logging

```java
log.error("Payment failed orderId={} amount={}: {}", orderId, amount, ex.getMessage(), ex);
// Parameters for structured logging. Exception as last arg for stack trace.
```

---

## Testing

### Framework Stack

| Tool | Purpose |
|------|---------|
| JUnit 5 | Test framework |
| AssertJ | Fluent assertions |
| Mockito | Mocking |
| Testcontainers | Real databases/services |
| WireMock | HTTP API mocking |
| ArchUnit | Architecture tests |

### Test Structure

```java
@Test
void create_withValidRequest_savesAndReturnsOrder() {
    // Arrange
    var request = new CreateOrderRequest("customer-1", List.of(item));
    when(inventory.check("SKU-001", 2)).thenReturn(true);
    // Act
    var result = sut.create(request);
    // Assert
    assertThat(result.customerId()).isEqualTo("customer-1");
}
```

### Integration Tests

```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class OrderControllerIT {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
}
```

---

## Performance

### Profile First

```bash
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s -jar app.jar
```

### Key Patterns

- Pre-size collections when capacity is known
- Use primitive streams to avoid autoboxing
- `StringBuilder` for complex string concatenation
- HikariCP pool sizing: `core_count * 2` connections
- Caffeine for in-process caching with eviction
- ZGC for ultra-low-latency requirements

---

## Tooling

### Essential Stack

| Tool | Purpose |
|------|---------|
| Maven/Gradle | Build system |
| SpotBugs | Bug detection |
| ErrorProne | Compile-time bug detection |
| Checkstyle | Code style enforcement |
| JFR + JMC | Production profiling |
| JMH | Micro-benchmarks |
| SLF4J + Logback | Logging |

### CI Essentials

```bash
mvn clean verify -B         # Full build with tests
mvn spotbugs:check           # Static analysis
mvn checkstyle:check         # Code style
```

---

## Definition of Done

A Java feature is complete when:

- [ ] Code compiles with zero warnings (`-Xlint:all -Werror`)
- [ ] All tests pass (`mvn verify` or `gradle check`)
- [ ] No SpotBugs/ErrorProne findings
- [ ] No SonarQube code smells or security hotspots
- [ ] Null safety enforced (no raw `null` returns from public APIs)
- [ ] Javadoc on all public classes and methods
- [ ] Error paths are tested
- [ ] Thread safety verified for shared mutable state
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
