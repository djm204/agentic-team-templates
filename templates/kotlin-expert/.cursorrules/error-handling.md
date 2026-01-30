# Kotlin Error Handling

Sealed types for expected failures. Exceptions for exceptional conditions. Never swallow errors.

## Sealed Result Types

```kotlin
// Model expected outcomes explicitly
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val error: AppError) : Result<Nothing>
}

sealed interface AppError {
    data class NotFound(val entity: String, val id: String) : AppError
    data class Validation(val errors: Map<String, String>) : AppError
    data class Conflict(val message: String) : AppError
    data class Unauthorized(val reason: String) : AppError
}

// Usage in services
class UserService(private val userRepo: UserRepository) {
    suspend fun register(request: CreateUserRequest): Result<User> {
        val errors = validate(request)
        if (errors.isNotEmpty()) {
            return Result.Failure(AppError.Validation(errors))
        }

        val existing = userRepo.findByEmail(request.email)
        if (existing != null) {
            return Result.Failure(AppError.Conflict("Email already registered"))
        }

        val user = userRepo.create(request)
        return Result.Success(user)
    }
}

// Handling in routes/controllers
when (val result = userService.register(request)) {
    is Result.Success -> call.respond(HttpStatusCode.Created, result.value)
    is Result.Failure -> when (result.error) {
        is AppError.Validation -> call.respond(HttpStatusCode.BadRequest, result.error)
        is AppError.Conflict -> call.respond(HttpStatusCode.Conflict, result.error)
        is AppError.NotFound -> call.respond(HttpStatusCode.NotFound, result.error)
        is AppError.Unauthorized -> call.respond(HttpStatusCode.Unauthorized, result.error)
    }
}
```

## kotlin.Result and runCatching

```kotlin
// For wrapping operations that might throw
val result: kotlin.Result<User> = runCatching {
    userRepository.findById(id)
}

result
    .onSuccess { user -> logger.info("Found user: ${user.id}") }
    .onFailure { error -> logger.error("Failed to find user", error) }

val user = result.getOrNull()
val userOrDefault = result.getOrDefault(User.anonymous())
val userOrElse = result.getOrElse { error ->
    logger.warn("Falling back to anonymous", error)
    User.anonymous()
}

// Chaining
val displayName = runCatching { fetchUser(id) }
    .map { it.displayName }
    .getOrDefault("Unknown User")
```

## Validation

```kotlin
// require — preconditions (throws IllegalArgumentException)
fun createOrder(customerId: String, items: List<OrderItem>) {
    require(customerId.isNotBlank()) { "customerId must not be blank" }
    require(items.isNotEmpty()) { "Order must have at least one item" }
    require(items.size <= MAX_ITEMS) { "Maximum $MAX_ITEMS items allowed" }
}

// check — state invariants (throws IllegalStateException)
fun ship(order: Order) {
    check(order.status == OrderStatus.PAID) { "Can only ship paid orders" }
    check(order.items.isNotEmpty()) { "Cannot ship empty order" }
}

// requireNotNull / checkNotNull
val user = requireNotNull(userRepo.findById(id)) {
    "User $id must exist after authentication"
}
```

## Exception Best Practices

```kotlin
// Custom exceptions for domain boundaries
class OrderProcessingException(
    val orderId: OrderId,
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

// Catch specific exceptions
try {
    paymentService.charge(order)
} catch (e: PaymentDeclinedException) {
    logger.warn("Payment declined for order ${order.id}", e)
    return Result.Failure(AppError.PaymentDeclined(e.reason))
} catch (e: PaymentTimeoutException) {
    logger.error("Payment timeout for order ${order.id}", e)
    throw OrderProcessingException(order.id, "Payment timed out", e)
}

// Never catch Exception broadly without rethrowing CancellationException
try {
    suspendingOperation()
} catch (e: CancellationException) {
    throw e // Always rethrow — coroutine cancellation must propagate
} catch (e: Exception) {
    logger.error("Operation failed", e)
}
```

## Anti-Patterns

```kotlin
// Never: empty catch blocks
try { riskyOperation() }
catch (e: Exception) { } // Silently swallowed

// Never: catch Throwable (catches OutOfMemoryError, StackOverflowError)
try { work() }
catch (e: Throwable) { } // Too broad
// Use: catch (e: Exception) at most

// Never: using exceptions for control flow
try { return items.first { it.isActive } }
catch (e: NoSuchElementException) { return null }
// Use: items.firstOrNull { it.isActive }

// Never: wrapping without context
catch (e: Exception) { throw RuntimeException(e) }
// Add context: throw OrderProcessingException(orderId, "Failed to process", e)
```
