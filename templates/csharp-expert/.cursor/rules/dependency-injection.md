# C# Dependency Injection

The built-in Microsoft.Extensions.DependencyInjection container is the standard. Use it correctly.

## Service Lifetimes

```csharp
// Transient: new instance every time. Use for lightweight, stateless services.
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();

// Scoped: one instance per request/scope. Use for DbContext, Unit of Work.
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddDbContext<AppDbContext>();

// Singleton: one instance for app lifetime. Use for caches, config, HTTP clients.
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(configuration.GetConnectionString("Redis")!));
```

### The Captive Dependency Problem

A singleton must NEVER depend on a scoped or transient service — it captures a stale instance.

```csharp
// WRONG: singleton captures scoped DbContext
public class CachedUserService  // Registered as Singleton
{
    private readonly AppDbContext _db; // Scoped! This instance lives forever now.
    public CachedUserService(AppDbContext db) => _db = db;
}

// RIGHT: use IServiceScopeFactory to create scopes
public class CachedUserService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public CachedUserService(IServiceScopeFactory scopeFactory)
        => _scopeFactory = scopeFactory;

    public async Task<User?> GetUserAsync(int id)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Users.FindAsync(id);
    }
}
```

## Registration Patterns

```csharp
// Extension methods for clean composition root
public static class OrderServiceExtensions
{
    public static IServiceCollection AddOrderServices(this IServiceCollection services)
    {
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IInventoryChecker, InventoryChecker>();
        return services;
    }
}

// Program.cs stays clean
builder.Services.AddOrderServices();
builder.Services.AddNotificationServices();
builder.Services.AddAuthenticationServices(builder.Configuration);
```

## Options Pattern

```csharp
// Strongly typed configuration
public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public required string Host { get; init; }
    public int Port { get; init; } = 587;
    public required string Username { get; init; }
    public required string Password { get; init; }
    public bool UseSsl { get; init; } = true;
}

// Registration with validation
builder.Services
    .AddOptions<SmtpOptions>()
    .BindConfiguration(SmtpOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Injection — use IOptions<T> for static config, IOptionsMonitor<T> for reloadable
public class EmailSender(IOptions<SmtpOptions> options)
{
    private readonly SmtpOptions _smtp = options.Value;
}
```

## Keyed Services (.NET 8+)

```csharp
// Register multiple implementations of the same interface
builder.Services.AddKeyedSingleton<INotifier, EmailNotifier>("email");
builder.Services.AddKeyedSingleton<INotifier, SmsNotifier>("sms");
builder.Services.AddKeyedSingleton<INotifier, SlackNotifier>("slack");

// Inject by key
public class NotificationService([FromKeyedServices("email")] INotifier emailNotifier)
{
    public Task NotifyAsync(string message)
        => emailNotifier.SendAsync(message);
}
```

## Interface Segregation

```csharp
// Bad: fat interface
public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
    Task<IReadOnlyList<User>> GetAllAsync(CancellationToken ct);
    Task CreateAsync(User user, CancellationToken ct);
    Task UpdateAsync(User user, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
    Task<int> GetCountAsync(CancellationToken ct);
    Task<bool> ExistsAsync(string email, CancellationToken ct);
}

// Good: segregated interfaces
public interface IUserReader
{
    Task<User?> GetByIdAsync(int id, CancellationToken ct);
    Task<User?> GetByEmailAsync(string email, CancellationToken ct);
}

public interface IUserWriter
{
    Task CreateAsync(User user, CancellationToken ct);
    Task UpdateAsync(User user, CancellationToken ct);
}

// Consumers only depend on what they use
public class LoginService(IUserReader users) { }
public class RegistrationService(IUserReader users, IUserWriter writer) { }
```

## Decorator Pattern

```csharp
// Scrutor or manual registration for decorators
public class CachedUserRepository : IUserReader
{
    private readonly IUserReader _inner;
    private readonly IMemoryCache _cache;

    public CachedUserRepository(IUserReader inner, IMemoryCache cache)
    {
        _inner = inner;
        _cache = cache;
    }

    public async Task<User?> GetByIdAsync(int id, CancellationToken ct)
    {
        return await _cache.GetOrCreateAsync($"user:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await _inner.GetByIdAsync(id, ct);
        });
    }
}

// Registration
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<IUserReader>(sp =>
    new CachedUserRepository(
        sp.GetRequiredService<UserRepository>(),
        sp.GetRequiredService<IMemoryCache>()));
```

## Anti-Patterns

```csharp
// Never: service locator pattern
public class OrderService
{
    private readonly IServiceProvider _sp;
    public OrderService(IServiceProvider sp) => _sp = sp;
    public void Process()
    {
        var repo = _sp.GetRequiredService<IOrderRepository>(); // Hidden dependency
    }
}
// Use constructor injection instead

// Never: registering concrete types without interfaces (for testability)
builder.Services.AddScoped<OrderService>(); // Can't mock in tests
// Register with interface: AddScoped<IOrderService, OrderService>();

// Never: static service accessors
public static class ServiceLocator
{
    public static IServiceProvider Provider { get; set; } = null!; // Global mutable state
}
```
