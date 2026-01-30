# C# Expert Development Guide

Principal-level guidelines for C# engineering. Deep .NET runtime knowledge, modern language features, and production-grade patterns.

---

## Overview

This guide applies to:
- Web APIs and services (ASP.NET Core, Minimal APIs)
- Desktop and cross-platform applications (WPF, MAUI, Avalonia)
- Cloud-native services (Azure Functions, Worker Services)
- Libraries and NuGet packages
- Real-time systems (SignalR, gRPC)
- Background processing (Hosted Services, message consumers)

### Core Philosophy

C# is a language of deliberate design. Every feature exists for a reason — use the right tool for the job.

- **Type safety is your first line of defense.** Nullable reference types enabled, warnings as errors.
- **Composition over inheritance.** Interfaces, extension methods, and dependency injection — not deep class hierarchies.
- **Async all the way down.** Never block on async code. Never use `.Result` or `.Wait()` in application code.
- **The framework does the heavy lifting.** ASP.NET Core's middleware pipeline, DI container, and configuration system are battle-tested — use them.
- **Measure before you optimize.** BenchmarkDotNet and dotnet-counters before rewriting anything.
- **If you don't know, say so.** Admitting uncertainty is professional. Guessing at runtime behavior you haven't verified is not.

### Key Principles

1. **Nullable Reference Types Are Non-Negotiable** — `<Nullable>enable</Nullable>` in every project
2. **Prefer Records for Data** — Immutable by default, value semantics, concise syntax
3. **Dependency Injection Is the Architecture** — Constructor injection, interface segregation, composition root
4. **Errors Are Explicit** — Result patterns for expected failures, exceptions for exceptional conditions
5. **Tests Describe Behavior** — Not implementation details

### Project Structure

```
Solution/
├── src/
│   ├── MyApp.Api/              # ASP.NET Core host (thin — wiring only)
│   │   ├── Program.cs
│   │   ├── Endpoints/
│   │   └── Middleware/
│   ├── MyApp.Application/      # Use cases (no framework deps)
│   │   ├── Commands/
│   │   ├── Queries/
│   │   └── Interfaces/
│   ├── MyApp.Domain/           # Core domain (zero dependencies)
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   └── Events/
│   └── MyApp.Infrastructure/   # External concerns (DB, HTTP)
│       ├── Persistence/
│       └── Services/
├── tests/
│   ├── MyApp.UnitTests/
│   ├── MyApp.IntegrationTests/
│   └── MyApp.ArchitectureTests/
├── Directory.Build.props
├── .editorconfig
└── MyApp.sln
```

---

## Language Features

### Nullable Reference Types

```csharp
public async Task<User?> FindByEmailAsync(string email)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(email);
    return await _repository.FindByEmailAsync(email);
}
```

- Never disable nullable warnings project-wide
- `string` means non-null. `string?` means nullable
- Use `ArgumentNullException.ThrowIfNull()` at public API boundaries

### Records

```csharp
// Immutable data with value semantics
public record CreateUserRequest(string Name, string Email);
public readonly record struct Coordinate(double Latitude, double Longitude);

// Non-destructive mutation
var updated = original with { Email = "new@example.com" };
```

### Pattern Matching

```csharp
public static decimal CalculateDiscount(Order order) => order switch
{
    { Total: > 1000, Customer.IsPremium: true } => order.Total * 0.15m,
    { Total: > 500 } => order.Total * 0.10m,
    { Customer.IsPremium: true } => order.Total * 0.05m,
    _ => 0m
};
```

### Spans and Memory

```csharp
public static bool StartsWithDigit(ReadOnlySpan<char> input)
    => !input.IsEmpty && char.IsDigit(input[0]);
```

---

## Async Patterns

### The Golden Rules

1. Async all the way down — never mix sync and async
2. Never block on async — no `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`
3. Always pass `CancellationToken`
4. `ConfigureAwait(false)` in library code only
5. Return `Task`, not `void` — `async void` is only for event handlers

### CancellationToken

```csharp
public async Task<OrderResult> ProcessOrderAsync(
    CreateOrderRequest request, CancellationToken cancellationToken)
{
    var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);
    cancellationToken.ThrowIfCancellationRequested();
    var order = Order.Create(user, request.Items);
    await _repository.SaveAsync(order, cancellationToken);
    return new OrderResult(order.Id);
}
```

### Concurrent Operations

```csharp
var userTask = _userService.GetByIdAsync(userId, ct);
var ordersTask = _orderService.GetRecentAsync(userId, ct);
await Task.WhenAll(userTask, ordersTask);
```

### Channels

```csharp
private readonly Channel<DomainEvent> _channel =
    Channel.CreateBounded<DomainEvent>(new BoundedChannelOptions(1000)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true
    });
```

---

## Dependency Injection

### Service Lifetimes

- **Transient**: New instance every time. Lightweight, stateless services.
- **Scoped**: One per request. DbContext, Unit of Work.
- **Singleton**: One for app lifetime. Caches, config, HTTP clients.

### The Captive Dependency Problem

A singleton must NEVER depend on a scoped or transient service.

```csharp
// WRONG: singleton captures scoped DbContext
// RIGHT: use IServiceScopeFactory to create scopes on demand
```

### Options Pattern

```csharp
builder.Services
    .AddOptions<SmtpOptions>()
    .BindConfiguration(SmtpOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

---

## Error Handling

### Two Categories

1. **Exceptions** — Programming errors, infrastructure failures
2. **Result patterns** — Validation failures, business rule violations

### Guard Clauses

```csharp
ArgumentNullException.ThrowIfNull(request);
ArgumentException.ThrowIfNullOrWhiteSpace(request.Email);
ArgumentOutOfRangeException.ThrowIfNegativeOrZero(request.Quantity);
```

### Result Pattern

```csharp
var result = await service.RegisterAsync(request, ct);
return result.Match(
    user => Results.Created($"/users/{user.Id}", user),
    error => error.Code switch
    {
        "VALIDATION" => Results.BadRequest(error),
        "CONFLICT" => Results.Conflict(error),
        _ => Results.Problem(error.Message)
    });
```

---

## Testing

### Framework Stack

| Tool | Purpose |
|------|---------|
| xUnit | Test framework |
| NSubstitute | Mocking |
| FluentAssertions | Readable assertions |
| Bogus | Test data generation |
| Testcontainers | Real databases in tests |
| ArchUnitNET | Architecture tests |

### Unit Test Structure

```csharp
[Fact]
public async Task CreateOrder_WithValidItems_ReturnsOrder()
{
    // Arrange
    var request = new CreateOrderRequest("customer-1", [new("sku-1", 2)]);
    _inventory.CheckAvailabilityAsync("sku-1", 2, Arg.Any<CancellationToken>())
        .Returns(true);

    // Act
    var result = await _sut.CreateAsync(request, CancellationToken.None);

    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value!.CustomerId.Should().Be("customer-1");
}
```

### Integration Tests

```csharp
public class OrderEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task POST_orders_returns_created_for_valid_request()
    {
        var response = await _client.PostAsJsonAsync("/orders", request);
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
```

---

## Performance

### Profile First

```bash
dotnet-counters monitor --process-id <pid>
dotnet-trace collect --process-id <pid>
```

### Key Patterns

- `AsNoTracking()` for read-only EF Core queries
- `ArrayPool<T>.Shared` for buffer reuse
- `FrozenDictionary` for read-heavy, write-once lookups
- `ObjectPool<T>` for expensive-to-create objects
- Compiled EF Core queries for hot paths
- Project to DTOs in LINQ — don't load full entities
- Use `struct` for small, immutable value types (< 16 bytes guideline)

---

## ASP.NET Core

### Minimal APIs

```csharp
var group = app.MapGroup("/orders").RequireAuthorization();
group.MapGet("/{id:int}", GetOrderById);
group.MapPost("/", CreateOrder);
```

### Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddRedis(connectionString, "redis");

app.MapHealthChecks("/healthz");
```

### Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
    options.AddFixedWindowLimiter("api", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
    }));
```

---

## Tooling

### Essential Stack

| Tool | Purpose |
|------|---------|
| dotnet CLI | Build, test, publish |
| dotnet format | Code style enforcement |
| Roslyn analyzers | Static analysis |
| BenchmarkDotNet | Performance benchmarks |
| Serilog | Structured logging |
| Central Package Management | Version consistency |

### CI Essentials

```bash
dotnet restore
dotnet build --warnaserror
dotnet format --verify-no-changes
dotnet test --collect:"XPlat Code Coverage"
```

---

## Definition of Done

A C# feature is complete when:

- [ ] `dotnet build --warnaserror` passes with zero warnings
- [ ] `dotnet test` passes with no failures
- [ ] Nullable reference types produce no warnings
- [ ] No `#pragma warning disable` without inline justification
- [ ] Async methods don't block (no `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`)
- [ ] All public APIs have XML documentation comments
- [ ] Error paths are tested
- [ ] DI registrations verified (no missing services at runtime)
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
