# Kotlin Expert Development Guide

Principal-level guidelines for Kotlin engineering. Deep language mastery, coroutines, multiplatform, and idiomatic patterns.

---

## Overview

This guide applies to:
- Backend services (Ktor, Spring Boot, Quarkus)
- Android applications (Jetpack Compose, Architecture Components)
- Kotlin Multiplatform (KMP) — shared code across platforms
- CLI tools and scripting
- Libraries and Maven/Gradle artifacts
- Data processing and streaming

### Core Philosophy

Kotlin is a pragmatic language. It gives you safety, expressiveness, and interoperability — use all three.

- **Null safety is the foundation.** The type system distinguishes nullable from non-nullable. No `!!` without proof.
- **Immutability by default.** `val` over `var`, immutable collections, data classes.
- **Conciseness without cleverness.** Less code doesn't mean unreadable code.
- **Coroutines are structured.** Every coroutine has a scope, every scope has a lifecycle.
- **Interop is a feature.** Use Java libraries freely, but write Kotlin idiomatically.
- **If you don't know, say so.** Admitting uncertainty is professional.

### Key Principles

1. **Null Safety Is Non-Negotiable** — No `!!` without justification. Safe calls, elvis, smart casts
2. **Immutability by Default** — `val`, `List` (not `MutableList`), data classes, `copy()`
3. **Structured Concurrency** — Every coroutine in a scope. No `GlobalScope`
4. **Extension Functions Over Utility Classes** — Extend types at the call site
5. **Sealed Types for State Modeling** — Exhaustive `when`, impossible states are compile errors

### Project Structure

```
project/
├── src/main/kotlin/com/example/myapp/
│   ├── Application.kt
│   ├── config/
│   ├── domain/
│   │   ├── model/
│   │   ├── service/
│   │   └── event/
│   ├── application/
│   ├── infrastructure/
│   └── api/
├── src/test/kotlin/
├── build.gradle.kts
└── Dockerfile
```

---

## Language Features

### Null Safety

```kotlin
val displayName = user?.name ?: "Anonymous"
val userId = request.userId ?: throw IllegalArgumentException("userId required")
// Never: user!!.name — use requireNotNull() with a message
```

### Data Classes and Value Classes

```kotlin
data class Order(val id: OrderId, val items: List<OrderItem>, val status: OrderStatus)
val updated = order.copy(status = OrderStatus.SHIPPED)

@JvmInline
value class UserId(val value: String) // Zero-overhead type safety
```

### Sealed Types

```kotlin
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val error: AppError) : Result<Nothing>
}

fun describe(result: Result<User>): String = when (result) {
    is Result.Success -> "User: ${result.value.name}"
    is Result.Failure -> "Error: ${result.error}"
    // Exhaustive — compiler enforces all cases
}
```

### Extension Functions and Scope Functions

```kotlin
fun String.toSlug(): String = lowercase().replace(Regex("[^a-z0-9\\s-]"), "").replace(Regex("\\s+"), "-")

val connection = HttpClient().apply { timeout = 30.seconds; retries = 3 }
val user = createUser(request).also { logger.info("Created: ${it.id}") }
```

---

## Coroutines

### Structured Concurrency

```kotlin
suspend fun loadDashboard(userId: UserId): Dashboard = coroutineScope {
    val user = async { userService.findById(userId) }
    val orders = async { orderService.findRecent(userId) }
    Dashboard(user = user.await(), orders = orders.await())
}
// If any async fails, ALL are cancelled
```

### Flow

```kotlin
val state: StateFlow<UiState> = _state.asStateFlow()

fun observeUsers(): Flow<List<User>> = flow {
    while (true) {
        emit(userRepository.findAll())
        delay(5.seconds)
    }
}
```

### Rules

- No `GlobalScope` — use lifecycle-bound scopes
- No `runBlocking` in production (except `main()` and tests)
- No `Thread.sleep()` — use `delay()`
- Always rethrow `CancellationException`
- Use `supervisorScope` when child failures should be independent

---

## Error Handling

### Sealed Result Types

```kotlin
when (val result = userService.register(request)) {
    is Result.Success -> call.respond(HttpStatusCode.Created, result.value)
    is Result.Failure -> when (result.error) {
        is AppError.Validation -> call.respond(HttpStatusCode.BadRequest, result.error)
        is AppError.Conflict -> call.respond(HttpStatusCode.Conflict, result.error)
        is AppError.NotFound -> call.respond(HttpStatusCode.NotFound, result.error)
    }
}
```

### Validation

```kotlin
require(customerId.isNotBlank()) { "customerId must not be blank" }
check(order.status == OrderStatus.PAID) { "Can only ship paid orders" }
val user = requireNotNull(userRepo.findById(id)) { "User $id must exist" }
```

---

## Frameworks

### Ktor

```kotlin
fun Route.userRoutes() {
    route("/users") {
        get("/{id}") {
            val id = UserId(call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest))
            // ...
        }
        post { val request = call.receive<CreateUserRequest>(); /* ... */ }
    }
}
```

### Spring Boot

```kotlin
@RestController
@RequestMapping("/api/v1/orders")
class OrderController(private val orderService: OrderService) {
    @GetMapping("/{id}")
    suspend fun getById(@PathVariable id: UUID): ResponseEntity<OrderResponse> { /* ... */ }
}
```

### Exposed (SQL)

```kotlin
object Users : Table("users") {
    val id = uuid("id").autoGenerate()
    val name = varchar("name", 200)
    val email = varchar("email", 255).uniqueIndex()
}
```

---

## Testing

### Framework Stack

| Tool | Purpose |
|------|---------|
| JUnit 5 / Kotest | Test framework |
| MockK | Kotlin-native mocking |
| kotlinx-coroutines-test | Coroutine testing |
| Testcontainers | Real databases/services |
| Ktor Test | HTTP endpoint testing |

### Test Structure

```kotlin
@Test
fun `create with valid items returns success`() = runTest {
    coEvery { inventoryClient.checkAvailability("SKU-001", 2) } returns true
    val result = sut.create(request)
    assertThat(result).isInstanceOf(Result.Success::class.java)
}
```

---

## Performance

### Key Patterns

- `inline` functions for higher-order function hot paths
- `value class` for zero-overhead type wrappers
- Sequences for large collection chains (lazy evaluation)
- Pre-size collections with `HashMap(expectedSize)`
- `buildList`/`buildString` for single-allocation construction
- Buffered channels for coroutine throughput

---

## Tooling

### Essential Stack

| Tool | Purpose |
|------|---------|
| Gradle (Kotlin DSL) | Build system |
| Detekt | Static analysis |
| ktlint | Code formatting |
| kotlinx.serialization | Compile-time serialization |
| kotlin-logging | Structured logging |
| Koin | Dependency injection |

### CI Essentials

```bash
./gradlew check      # Build + test + analysis
./gradlew detekt     # Static analysis
```

---

## Definition of Done

A Kotlin feature is complete when:

- [ ] Compiles with zero warnings (`allWarningsAsErrors = true`)
- [ ] All tests pass
- [ ] No `!!` without documented justification
- [ ] No `var` where `val` suffices
- [ ] No `MutableList`/`MutableMap` exposed in public APIs
- [ ] Coroutines use structured concurrency (no `GlobalScope`)
- [ ] Nullable types handled explicitly
- [ ] Detekt reports zero findings
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
