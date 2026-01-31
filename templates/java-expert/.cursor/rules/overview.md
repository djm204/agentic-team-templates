# Java Expert Overview

Principal-level Java engineering. Deep JVM knowledge, modern language features, and production-grade patterns.

## Scope

This guide applies to:
- Web services and APIs (Spring Boot, Quarkus, Micronaut)
- Microservices and distributed systems
- Event-driven architectures (Kafka, RabbitMQ)
- Batch processing and data pipelines
- Libraries and Maven/Gradle artifacts
- Cloud-native applications (Kubernetes, GraalVM native images)

## Core Philosophy

Java's strength is its ecosystem maturity and runtime reliability. The best Java code is clear, testable, and boring.

- **Readability over cleverness.** A junior engineer should understand your code without a tutorial.
- **Immutability by default.** Records, `final` fields, unmodifiable collections. Mutation is the exception.
- **Composition over inheritance.** Interfaces, delegation, and dependency injection — not deep class hierarchies.
- **The JVM is your ally.** Understand garbage collection, JIT compilation, and memory model — don't fight them.
- **Fail fast, fail loud.** Validate at boundaries, throw meaningful exceptions, never swallow errors.
- **If you don't know, say so.** Admitting uncertainty is professional. Guessing at JVM behavior you haven't verified is not.

## Key Principles

1. **Modern Java Is Required** — Java 21+ features: records, sealed classes, pattern matching, virtual threads
2. **Null Is a Bug** — Use `Optional` for return types, `@Nullable`/`@NonNull` annotations, and validation at boundaries
3. **Dependency Injection Is the Architecture** — Constructor injection, interface segregation, Spring's application context
4. **Tests Are Documentation** — Descriptive names, Arrange-Act-Assert, behavior over implementation
5. **Observability Is Not Optional** — Structured logging, metrics, distributed tracing from day one

## Project Structure

```
project/
├── src/main/java/com/example/myapp/
│   ├── Application.java              # Entry point
│   ├── config/                        # Configuration classes
│   ├── domain/                        # Core domain (no framework deps)
│   │   ├── model/                     # Entities, value objects, records
│   │   ├── service/                   # Domain services
│   │   └── event/                     # Domain events
│   ├── application/                   # Use cases, orchestration
│   │   ├── command/                   # Write operations
│   │   ├── query/                     # Read operations
│   │   └── port/                      # Interfaces (driven/driving)
│   ├── infrastructure/                # External concerns
│   │   ├── persistence/               # JPA repositories, entity mappings
│   │   ├── messaging/                 # Kafka/RabbitMQ producers/consumers
│   │   └── client/                    # HTTP clients, external APIs
│   └── api/                           # REST controllers, DTOs
│       ├── controller/
│       ├── dto/
│       └── exception/                 # Exception handlers
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                  # Flyway/Liquibase migrations
├── src/test/java/com/example/myapp/
│   ├── unit/
│   ├── integration/
│   └── architecture/
├── pom.xml or build.gradle.kts
└── Dockerfile
```

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
