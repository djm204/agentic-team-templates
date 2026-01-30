# C# Error Handling

Exceptions for exceptional conditions. Result types for expected failures. Never swallow errors.

## The Two Categories

1. **Exceptions** — Programming errors, infrastructure failures, genuinely unexpected conditions
2. **Result patterns** — Validation failures, business rule violations, "not found" scenarios

## Exception Best Practices

```csharp
// Catch specific exceptions, never bare catch
try
{
    await _httpClient.PostAsync(url, content, ct);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.TooManyRequests)
{
    _logger.LogWarning(ex, "Rate limited by {Url}", url);
    await Task.Delay(retryDelay, ct);
}
catch (TaskCanceledException) when (ct.IsCancellationRequested)
{
    _logger.LogInformation("Request cancelled");
    throw; // Let cancellation propagate
}
catch (HttpRequestException ex)
{
    _logger.LogError(ex, "HTTP request to {Url} failed", url);
    throw; // Re-throw — don't swallow
}

// Exception filters (when clause) — use them for conditional catch
catch (SqlException ex) when (ex.Number == 2627) // Unique constraint violation
{
    throw new DuplicateEntityException("User with this email already exists", ex);
}
```

### Guard Clauses

```csharp
public class OrderService
{
    public async Task<Order> CreateAsync(CreateOrderRequest request, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.CustomerId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(request.Items.Count);

        // Business logic follows clean preconditions
        var customer = await _customers.GetByIdAsync(request.CustomerId, ct)
            ?? throw new NotFoundException($"Customer '{request.CustomerId}' not found");

        return Order.Create(customer, request.Items);
    }
}
```

## Result Pattern

```csharp
// A generic Result type for operations that can fail predictably
public readonly record struct Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess => Error is null;

    private Result(T value) { Value = value; Error = null; }
    private Result(Error error) { Value = default; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);

    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<Error, TResult> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

public record Error(string Code, string Message)
{
    public static Error NotFound(string entity, object id)
        => new("NOT_FOUND", $"{entity} with id '{id}' was not found");

    public static Error Validation(string message)
        => new("VALIDATION", message);

    public static Error Conflict(string message)
        => new("CONFLICT", message);
}
```

### Using the Result Pattern

```csharp
public class UserService
{
    public async Task<Result<User>> RegisterAsync(
        RegisterRequest request, CancellationToken ct)
    {
        // Validation
        if (!EmailValidator.IsValid(request.Email))
            return Result<User>.Failure(Error.Validation("Invalid email format"));

        // Business rule check
        var existing = await _users.GetByEmailAsync(request.Email, ct);
        if (existing is not null)
            return Result<User>.Failure(Error.Conflict("Email already registered"));

        // Happy path
        var user = User.Create(request.Name, request.Email);
        await _users.CreateAsync(user, ct);
        return Result<User>.Success(user);
    }
}

// In the endpoint
app.MapPost("/users", async (RegisterRequest request, UserService service, CancellationToken ct) =>
{
    var result = await service.RegisterAsync(request, ct);
    return result.Match(
        user => Results.Created($"/users/{user.Id}", user),
        error => error.Code switch
        {
            "VALIDATION" => Results.BadRequest(error),
            "CONFLICT" => Results.Conflict(error),
            _ => Results.Problem(error.Message)
        });
});
```

## Problem Details (RFC 9457)

```csharp
// ASP.NET Core's built-in Problem Details support
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Extensions["traceId"] =
            context.HttpContext.TraceIdentifier;
    };
});

// Global exception handler middleware
app.UseExceptionHandler(exceptionApp =>
{
    exceptionApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var problemDetails = exception switch
        {
            NotFoundException ex => new ProblemDetails
            {
                Status = 404,
                Title = "Not Found",
                Detail = ex.Message
            },
            ValidationException ex => new ProblemDetails
            {
                Status = 400,
                Title = "Validation Error",
                Detail = ex.Message
            },
            _ => new ProblemDetails
            {
                Status = 500,
                Title = "Internal Server Error",
                Detail = "An unexpected error occurred"
            }
        };

        context.Response.StatusCode = problemDetails.Status ?? 500;
        await context.Response.WriteAsJsonAsync(problemDetails);
    });
});
```

## FluentValidation

```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .WithMessage("Customer ID is required");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Order must contain at least one item");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Quantity)
                .GreaterThan(0)
                .WithMessage("Quantity must be positive");

            item.RuleFor(i => i.Price)
                .GreaterThan(0)
                .WithMessage("Price must be positive");
        });
    }
}
```

## Anti-Patterns

```csharp
// Never: catch-all that swallows exceptions
try { DoWork(); }
catch (Exception) { } // Silent failure — a bug hiding a bug

// Never: catch and throw new (loses stack trace)
catch (Exception ex) { throw new Exception("Failed", ex); }
// Use: throw; (preserves stack trace)
// Or: throw new SpecificException("context", ex); (wraps with context)

// Never: exceptions for control flow
try { return dict[key]; }
catch (KeyNotFoundException) { return default; }
// Use: dict.TryGetValue(key, out var value)

// Never: log and throw (produces duplicate log entries)
catch (Exception ex)
{
    _logger.LogError(ex, "Failed");
    throw; // Now it's logged twice — here and in global handler
}
// Choose one: log OR throw, not both
```
