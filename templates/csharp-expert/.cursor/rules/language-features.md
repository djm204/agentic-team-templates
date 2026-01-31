# Modern C# Language Features

Deep knowledge of C# language evolution. Use modern features deliberately, not just because they exist.

## Nullable Reference Types

The single most impactful feature for code correctness. Non-negotiable.

```csharp
// The compiler is your partner — listen to it
public class UserService
{
    // Non-nullable: guaranteed to have a value
    private readonly IUserRepository _repository;

    // Nullable: explicitly communicates "might not exist"
    public async Task<User?> FindByEmailAsync(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        return await _repository.FindByEmailAsync(email);
    }

    // Null-forgiving operator (!) — document WHY
    // Only when you genuinely know better than the compiler
    var user = users.FirstOrDefault(u => u.Id == id)!; // Validated above
}
```

### Rules

- Never disable nullable warnings project-wide
- `string` means non-null. `string?` means nullable. Respect the distinction
- Use `ArgumentNullException.ThrowIfNull()` at public API boundaries
- Avoid the null-forgiving operator (`!`) — if you need it, the design may be wrong

## Records

```csharp
// Immutable data with value semantics — the default for DTOs and value objects
public record CreateUserRequest(string Name, string Email);

// Record structs for high-performance value types
public readonly record struct Coordinate(double Latitude, double Longitude);

// Records with validation
public record Money
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);
        ArgumentException.ThrowIfNullOrWhiteSpace(currency);
        Amount = amount;
        Currency = currency.ToUpperInvariant();
    }
}

// Non-destructive mutation
var updated = original with { Email = "new@example.com" };
```

## Pattern Matching

```csharp
// Switch expressions — exhaustive, concise
public static string FormatStatus(OrderStatus status) => status switch
{
    OrderStatus.Pending => "Awaiting processing",
    OrderStatus.Shipped => "On its way",
    OrderStatus.Delivered => "Delivered",
    OrderStatus.Cancelled => "Cancelled",
    _ => throw new ArgumentOutOfRangeException(nameof(status))
};

// Property patterns
public static decimal CalculateDiscount(Order order) => order switch
{
    { Total: > 1000, Customer.IsPremium: true } => order.Total * 0.15m,
    { Total: > 500 } => order.Total * 0.10m,
    { Customer.IsPremium: true } => order.Total * 0.05m,
    _ => 0m
};

// Type patterns with guards
public static string Describe(object value) => value switch
{
    int n when n < 0 => "negative integer",
    int n => $"positive integer: {n}",
    string { Length: 0 } => "empty string",
    string s => $"string: {s}",
    null => "null",
    _ => $"unknown: {value.GetType().Name}"
};

// List patterns (C# 11+)
public static bool IsValidSequence(int[] values) => values switch
{
    [1, 2, 3] => true,
    [1, .., 3] => true,  // Starts with 1, ends with 3
    [_, _, ..] => true,   // At least 2 elements
    _ => false
};
```

## LINQ — Use It Well

```csharp
// Good: clear, composable, declarative
var activeUsers = users
    .Where(u => u.IsActive)
    .OrderBy(u => u.LastLogin)
    .Select(u => new UserSummary(u.Id, u.Name, u.Email))
    .ToList();

// Bad: LINQ for side effects
users.ForEach(u => u.Deactivate()); // Use a foreach loop instead

// Bad: multiple enumerations of IEnumerable
var count = users.Count();        // Enumerates
var first = users.FirstOrDefault(); // Enumerates again!
// Fix: materialize first with .ToList()

// Performance: use the right method
users.Any(u => u.IsAdmin)         // Good: short-circuits
users.Count(u => u.IsAdmin) > 0   // Bad: counts everything
users.Where(u => u.IsAdmin).Any() // Acceptable but unnecessary
```

## Spans and Memory

```csharp
// Span<T> for zero-allocation slicing
public static bool StartsWithDigit(ReadOnlySpan<char> input)
    => !input.IsEmpty && char.IsDigit(input[0]);

// String parsing without allocation
public static (string Key, string Value) ParseHeader(ReadOnlySpan<char> header)
{
    var separatorIndex = header.IndexOf(':');
    if (separatorIndex < 0)
        throw new FormatException("Invalid header format");

    var key = header[..separatorIndex].Trim().ToString();
    var value = header[(separatorIndex + 1)..].Trim().ToString();
    return (key, value);
}

// stackalloc for small buffers
Span<byte> buffer = stackalloc byte[256];
var bytesWritten = Encoding.UTF8.GetBytes(input, buffer);
```

## Collection Expressions (C# 12+)

```csharp
// Concise collection initialization
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob"];
Dictionary<string, int> scores = new() { ["Alice"] = 95, ["Bob"] = 87 };

// Spread operator
int[] combined = [..firstHalf, ..secondHalf];
```

## Primary Constructors (C# 12+)

```csharp
// For services — captures parameters as fields
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)
{
    public async Task<Order> GetByIdAsync(int id)
    {
        logger.LogInformation("Fetching order {OrderId}", id);
        return await repository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Order {id} not found");
    }
}

// Caution: primary constructor parameters are mutable and capturable
// For DTOs, prefer records instead
```

## Anti-Patterns

```csharp
// Never: stringly-typed code
void Process(string type, string data) { } // What types? What format?
// Use enums, records, or discriminated unions

// Never: throwing exceptions for control flow
try { return users.First(u => u.Id == id); }
catch (InvalidOperationException) { return null; }
// Use FirstOrDefault or TryGetValue patterns

// Never: mutable static state
static List<User> _cache = new(); // Thread-unsafe, untestable
// Use IMemoryCache or a proper caching abstraction

// Never: deep inheritance hierarchies
class SpecialPremiumInternationalCustomerOrder : PremiumCustomerOrder { }
// Use composition and interfaces
```
