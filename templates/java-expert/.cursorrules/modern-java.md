# Modern Java Language Features

Java 21+ features used deliberately. Every feature exists to make code clearer — not to show off.

## Records

```java
// Immutable data carriers — the default for DTOs, value objects, events
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email
) {}

public record Money(BigDecimal amount, Currency currency) {
    // Compact constructor for validation
    public Money {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
        Objects.requireNonNull(currency, "Currency is required");
    }
}

public record PageRequest(int page, int size) {
    public PageRequest {
        if (page < 0) throw new IllegalArgumentException("Page must be >= 0");
        if (size < 1 || size > 100) throw new IllegalArgumentException("Size must be 1-100");
    }

    public int offset() {
        return page * size;
    }
}
```

### When NOT to Use Records

- JPA entities (need mutable state, no-arg constructor)
- Spring beans (need proxying, lifecycle management)
- Classes with complex behavior beyond data carrying

## Sealed Classes

```java
// Exhaustive type hierarchies — the compiler enforces completeness
public sealed interface PaymentResult permits PaymentSuccess, PaymentFailure, PaymentPending {
}

public record PaymentSuccess(String transactionId, Instant processedAt) implements PaymentResult {}
public record PaymentFailure(String errorCode, String message) implements PaymentResult {}
public record PaymentPending(String referenceId, Duration estimatedWait) implements PaymentResult {}

// Exhaustive switch — compiler warns if a case is missing
public String describeResult(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess s -> "Paid: " + s.transactionId();
        case PaymentFailure f -> "Failed: " + f.message();
        case PaymentPending p -> "Pending: " + p.referenceId();
    };
}
```

## Pattern Matching

```java
// instanceof pattern matching — no more casting
public String format(Object value) {
    return switch (value) {
        case Integer i when i < 0 -> "negative: " + i;
        case Integer i -> "integer: " + i;
        case String s when s.isEmpty() -> "empty string";
        case String s -> "string: " + s;
        case null -> "null";
        default -> "unknown: " + value.getClass().getSimpleName();
    };
}

// Record patterns (Java 21+)
public double calculateArea(Shape shape) {
    return switch (shape) {
        case Circle(double radius) -> Math.PI * radius * radius;
        case Rectangle(double w, double h) -> w * h;
        case Triangle(double base, double height) -> 0.5 * base * height;
    };
}
```

## Text Blocks

```java
// Multi-line strings with proper indentation
String query = """
        SELECT u.id, u.name, u.email
        FROM users u
        WHERE u.active = true
          AND u.created_at > :since
        ORDER BY u.name
        """;

String json = """
        {
            "name": "%s",
            "email": "%s"
        }
        """.formatted(name, email);
```

## Optional

```java
// Return type for "might not exist" — never for fields or parameters
public Optional<User> findByEmail(String email) {
    return Optional.ofNullable(userRepository.findByEmail(email));
}

// Good: chain operations
public String getUserDisplayName(String email) {
    return findByEmail(email)
        .map(User::displayName)
        .orElse("Unknown User");
}

// Good: throw with context
public User getByEmail(String email) {
    return findByEmail(email)
        .orElseThrow(() -> new NotFoundException("User not found: " + email));
}

// Bad: Optional.get() without check — defeats the purpose
user.get().getName(); // NoSuchElementException risk

// Bad: Optional as method parameter
public void process(Optional<String> name) { } // Use @Nullable instead

// Bad: Optional as field
private Optional<String> middleName; // Use @Nullable instead
```

## Collections

```java
// Immutable collections — the default
var users = List.of("Alice", "Bob", "Charlie");
var scores = Map.of("Alice", 95, "Bob", 87);
var uniqueNames = Set.of("Alice", "Bob");

// List.copyOf, Set.copyOf, Map.copyOf for defensive copies
public List<User> getUsers() {
    return List.copyOf(mutableUserList); // Defensive copy
}

// Collectors and Stream API
var activeUsersByDepartment = users.stream()
    .filter(User::isActive)
    .collect(Collectors.groupingBy(
        User::department,
        Collectors.toUnmodifiableList()));

// toList() shorthand (Java 16+)
var names = users.stream()
    .map(User::name)
    .toList(); // Returns unmodifiable list
```

## Virtual Threads (Java 21+)

```java
// Virtual threads for I/O-bound concurrency — massive scalability
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Response>> futures = urls.stream()
        .map(url -> executor.submit(() -> httpClient.send(url)))
        .toList();

    List<Response> responses = futures.stream()
        .map(f -> {
            try { return f.get(); }
            catch (Exception e) { throw new RuntimeException(e); }
        })
        .toList();
}

// Spring Boot 3.2+: enable virtual threads
// spring.threads.virtual.enabled=true

// Rules for virtual threads:
// - Don't pool them (they're cheap to create)
// - Don't use synchronized blocks for I/O (use ReentrantLock)
// - Don't use ThreadLocal for request-scoped data (use ScopedValue)
// - Perfect for: HTTP handlers, database queries, external API calls
// - Not for: CPU-bound computation (use platform threads / ForkJoinPool)
```

## Anti-Patterns

```java
// Never: raw types
List list = new ArrayList(); // What's in it?
// Use: List<User> users = new ArrayList<>();

// Never: checked exceptions for control flow
try { return Integer.parseInt(input); }
catch (NumberFormatException e) { return -1; }
// Use validation before parsing

// Never: mutable public fields
public class Config {
    public String url; // Anyone can change this
}
// Use: records, or private fields with getters

// Never: null as a valid business value
public User findUser(String id) {
    return null; // Caller forgets null check → NPE
}
// Use: Optional<User> or throw NotFoundException
```
