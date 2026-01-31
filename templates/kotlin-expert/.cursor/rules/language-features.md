# Kotlin Language Features

Modern Kotlin used deliberately. Every feature exists for safety, clarity, or expressiveness.

## Null Safety

```kotlin
// The type system enforces null safety — respect it
fun findUser(email: String): User? {
    return userRepository.findByEmail(email)
}

// Safe call chain
val cityName = user?.address?.city?.name

// Elvis operator for defaults
val displayName = user?.name ?: "Anonymous"

// Elvis with throw for required values
val userId = request.userId ?: throw IllegalArgumentException("userId is required")

// Smart casts — the compiler narrows for you
fun process(value: Any) {
    if (value is String) {
        println(value.length) // Smart cast to String
    }
}

// Safe cast
val number = value as? Int // null if not Int, no ClassCastException

// NEVER: !! without proof
user!!.name // If user is null → NPE. Only use when you've verified externally.
// Prefer: requireNotNull(user) { "User must exist after authentication" }
```

### Rules

- `!!` is a code smell. Every usage needs a comment explaining why it's safe
- Prefer `requireNotNull()` or `checkNotNull()` — they provide meaningful error messages
- Use `?.let { }` for nullable transformations
- Return nullable types from functions that legitimately might not find a result

## Data Classes

```kotlin
// Immutable data carriers — the default for DTOs, events, value objects
data class CreateUserRequest(
    val name: String,
    val email: String,
    val role: UserRole = UserRole.USER
)

// Defensive copying for collections
data class Order(
    val id: OrderId,
    val customerId: CustomerId,
    val items: List<OrderItem>, // Immutable List, not MutableList
    val status: OrderStatus,
    val createdAt: Instant
)

// Non-destructive updates
val updatedOrder = order.copy(status = OrderStatus.SHIPPED)

// Value objects with validation
@JvmInline
value class Email(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email: $value" }
    }
}

@JvmInline
value class UserId(val value: String) {
    init {
        require(value.isNotBlank()) { "UserId must not be blank" }
    }
}
```

## Sealed Types

```kotlin
// Exhaustive state modeling — the compiler enforces completeness
sealed interface PaymentResult {
    data class Success(val transactionId: String, val processedAt: Instant) : PaymentResult
    data class Failure(val errorCode: String, val message: String) : PaymentResult
    data class Pending(val referenceId: String, val estimatedWait: Duration) : PaymentResult
}

// Exhaustive when — add a new subtype, get a compile error everywhere
fun describe(result: PaymentResult): String = when (result) {
    is PaymentResult.Success -> "Paid: ${result.transactionId}"
    is PaymentResult.Failure -> "Failed: ${result.message}"
    is PaymentResult.Pending -> "Pending: ${result.referenceId}"
}

// Result modeling
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val error: AppError) : Result<Nothing>
}

sealed interface AppError {
    data class NotFound(val entity: String, val id: String) : AppError
    data class Validation(val errors: Map<String, String>) : AppError
    data class Conflict(val message: String) : AppError
}
```

## Extension Functions

```kotlin
// Add behavior to types without inheritance
fun String.toSlug(): String =
    this.lowercase()
        .replace(Regex("[^a-z0-9\\s-]"), "")
        .replace(Regex("\\s+"), "-")
        .trim('-')

// Scoped extensions for domain logic
fun List<Order>.totalRevenue(): BigDecimal =
    this.filter { it.status == OrderStatus.COMPLETED }
        .sumOf { it.total }

// Extension properties
val String.isValidEmail: Boolean
    get() = this.matches(Regex("^[^@]+@[^@]+\\.[^@]+$"))

// Generic extensions
fun <T> T.also(block: (T) -> Unit): T {
    block(this)
    return this
}
```

## Scope Functions

```kotlin
// let — transform nullable, scoped operations
val length = name?.let { it.trim().length }

// apply — configure objects
val connection = HttpClient().apply {
    timeout = Duration.ofSeconds(30)
    retries = 3
}

// run — execute block with receiver
val result = StringBuilder().run {
    append("Hello")
    append(" ")
    append("World")
    toString()
}

// also — side effects without changing the value
val user = createUser(request).also { logger.info("Created user: ${it.id}") }

// with — operate on an object
val summary = with(report) {
    "$title: $total items, $revenue revenue"
}

// Rules:
// - let: nullable chains, scoped transformations
// - apply: object configuration
// - run: compute a result from a receiver
// - also: side effects (logging, validation)
// - with: multiple operations on same object (avoid for nullable)
```

## Collection Operations

```kotlin
// Kotlin collections are immutable by default
val users: List<User> = fetchUsers() // Immutable
val mutableUsers: MutableList<User> = mutableListOf() // Explicit mutation

// Functional chains
val activeAdminEmails = users
    .filter { it.isActive }
    .filter { it.role == Role.ADMIN }
    .map { it.email }
    .sorted()

// groupBy, associateBy, partition
val (active, inactive) = users.partition { it.isActive }
val byDepartment = users.groupBy { it.department }
val byId = users.associateBy { it.id }

// Sequences for large collections (lazy evaluation)
val result = users.asSequence()
    .filter { it.isActive }
    .map { it.name }
    .take(10)
    .toList()

// buildList, buildMap, buildSet
val items = buildList {
    add("first")
    addAll(existingItems)
    if (includeExtra) add("extra")
}
```

## Anti-Patterns

```kotlin
// Never: !! without justification
user!!.name // NPE waiting to happen

// Never: var when val works
var name = "Alice" // Will it change? If not, use val

// Never: MutableList in public APIs
fun getUsers(): MutableList<User> // Caller can mutate your internal state
// Use: fun getUsers(): List<User>

// Never: Java-style static utilities
object StringUtils { fun format(s: String): String = ... }
// Use: extension functions — fun String.format(): String = ...

// Never: when without exhaustive matching on sealed types
when (result) {
    is Success -> handle(result)
    else -> {} // Silently ignores new subtypes
}
// Remove else — let the compiler catch missing cases
```
