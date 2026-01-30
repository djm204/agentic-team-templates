# Java Error Handling

Exceptions for exceptional conditions. Validation at boundaries. Never swallow errors.

## Exception Hierarchy

```java
// Application exception base — unchecked
public abstract class ApplicationException extends RuntimeException {
    private final String errorCode;

    protected ApplicationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    protected ApplicationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

// Specific exceptions
public class NotFoundException extends ApplicationException {
    public NotFoundException(String entity, Object id) {
        super("NOT_FOUND", "%s with id '%s' not found".formatted(entity, id));
    }
}

public class ConflictException extends ApplicationException {
    public ConflictException(String message) {
        super("CONFLICT", message);
    }
}

public class ValidationException extends ApplicationException {
    private final Map<String, String> fieldErrors;

    public ValidationException(Map<String, String> fieldErrors) {
        super("VALIDATION_FAILED", "Validation failed");
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public Map<String, String> getFieldErrors() { return fieldErrors; }
}
```

## Checked vs Unchecked

```java
// Checked exceptions: recoverable conditions at system boundaries
// - IOException: file not found, network error — caller can retry or use fallback
// - SQLException: database error — caller can retry with backoff

// Unchecked exceptions: programming errors and business rule violations
// - IllegalArgumentException: bad input
// - NullPointerException: null where not expected
// - NotFoundException: domain-level "not found"
// - ValidationException: business rule violation

// Rule: if the caller CAN and SHOULD handle it → checked
//        if it's a bug or unrecoverable → unchecked
```

## Validation

```java
// Jakarta Bean Validation on DTOs
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 200, message = "Name must be 2-200 characters")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotNull(message = "Role is required")
    UserRole role
) {}

// Custom validator
@Constraint(validatedBy = UniqueEmailValidator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface UniqueEmail {
    String message() default "Email already registered";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {
    private final UserRepository userRepository;

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return email == null || !userRepository.existsByEmail(email);
    }
}
```

## Guard Clauses

```java
public class OrderService {

    public Order create(String customerId, List<OrderItem> items) {
        // Fail fast with meaningful messages
        Objects.requireNonNull(customerId, "customerId must not be null");
        if (customerId.isBlank()) {
            throw new IllegalArgumentException("customerId must not be blank");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item");
        }
        if (items.size() > MAX_ITEMS) {
            throw new ValidationException(Map.of(
                "items", "Maximum %d items allowed".formatted(MAX_ITEMS)));
        }

        // Business logic follows clean preconditions
        return Order.create(customerId, items);
    }
}
```

## Result Pattern (Alternative to Exceptions)

```java
// For operations where failure is expected, not exceptional
public sealed interface Result<T> permits Result.Success, Result.Failure {

    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String code, String message) implements Result<T> {}

    static <T> Result<T> success(T value) { return new Success<>(value); }
    static <T> Result<T> failure(String code, String message) { return new Failure<>(code, message); }

    default <U> U match(Function<T, U> onSuccess, BiFunction<String, String, U> onFailure) {
        return switch (this) {
            case Success<T> s -> onSuccess.apply(s.value());
            case Failure<T> f -> onFailure.apply(f.code(), f.message());
        };
    }
}

// Usage
public Result<User> register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
        return Result.failure("CONFLICT", "Email already registered");
    }
    var user = User.create(request.name(), request.email());
    userRepository.save(user);
    return Result.success(user);
}
```

## Logging Exceptions

```java
// Log with context, not just the exception
try {
    return paymentService.charge(orderId, amount);
} catch (PaymentException ex) {
    log.error("Payment failed for order {} amount {}: {}",
        orderId, amount, ex.getMessage(), ex);
    throw new OrderProcessingException("Payment failed for order " + orderId, ex);
}

// Rules:
// - Log at the point of handling, not at every rethrow
// - Include business context (IDs, amounts, actions)
// - Use structured logging parameters, not string concatenation
// - Include the exception as the LAST parameter (for stack trace)
// - Don't log AND throw at the same level (choose one)
```

## Anti-Patterns

```java
// Never: catching Exception or Throwable broadly
try { doWork(); }
catch (Exception e) { log.error("Error", e); }
// Catches InterruptedException, NPE, and everything else — too broad

// Never: empty catch blocks
try { connection.close(); }
catch (Exception e) { /* ignore */ }
// At minimum: log.debug("Error closing connection", e);

// Never: using exceptions for control flow
try { return Integer.parseInt(input); }
catch (NumberFormatException e) { return defaultValue; }
// Use: input.matches("\\d+") or a tryParse utility

// Never: wrapping without adding context
catch (SQLException e) { throw new RuntimeException(e); }
// Add context: throw new PersistenceException("Failed to save order " + orderId, e);

// Never: losing the original exception
catch (Exception e) { throw new RuntimeException("Something failed"); }
// Always chain: throw new RuntimeException("Something failed", e);
```
