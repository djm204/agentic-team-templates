# ASP.NET Core Patterns

Modern ASP.NET Core web development. Minimal APIs, middleware, and production-grade service patterns.

## Minimal APIs

```csharp
var builder = WebApplication.CreateBuilder(args);

// Service registration
builder.Services.AddOrderServices();
builder.Services.AddOpenApi();

var app = builder.Build();

// Middleware pipeline — order matters
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseAuthentication();
app.UseAuthorization();

// Endpoint mapping
app.MapOrderEndpoints();
app.MapOpenApi();

app.Run();
```

### Endpoint Organization

```csharp
public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders")
            .WithTags("Orders")
            .RequireAuthorization();

        group.MapGet("/", GetAllOrders)
            .WithName("GetOrders")
            .Produces<IReadOnlyList<OrderResponse>>();

        group.MapGet("/{id:int}", GetOrderById)
            .WithName("GetOrder")
            .Produces<OrderResponse>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateOrder)
            .WithName("CreateOrder")
            .Produces<OrderResponse>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        group.MapDelete("/{id:int}", DeleteOrder)
            .RequireAuthorization("AdminOnly");
    }

    private static async Task<IResult> GetOrderById(
        int id, IOrderService service, CancellationToken ct)
    {
        var order = await service.GetByIdAsync(id, ct);
        return order is not null
            ? Results.Ok(order)
            : Results.Problem(statusCode: 404, title: "Order not found");
    }

    private static async Task<IResult> CreateOrder(
        CreateOrderRequest request,
        IValidator<CreateOrderRequest> validator,
        IOrderService service,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var result = await service.CreateAsync(request, ct);
        return result.Match(
            order => Results.Created($"/orders/{order.Id}", order),
            error => Results.Problem(error.Message, statusCode: 400));
    }
}
```

## Middleware

```csharp
// Request timing middleware
public class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            stopwatch.Stop();
            logger.LogInformation(
                "HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}

// Registration
app.UseMiddleware<RequestTimingMiddleware>();
```

## Configuration

```csharp
// Strongly typed with validation
public class DatabaseOptions
{
    public const string SectionName = "Database";

    [Required]
    public required string ConnectionString { get; init; }

    [Range(1, 100)]
    public int MaxPoolSize { get; init; } = 20;

    [Range(1, 300)]
    public int CommandTimeoutSeconds { get; init; } = 30;
}

// Registration with validation at startup
builder.Services
    .AddOptions<DatabaseOptions>()
    .BindConfiguration(DatabaseOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

## Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("database")
    .AddRedis(connectionString, "redis")
    .AddCheck<ExternalApiHealthCheck>("external-api");

app.MapHealthChecks("/healthz", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

// Liveness vs readiness
app.MapHealthChecks("/healthz/live", new HealthCheckOptions
{
    Predicate = _ => false // Just checks if the app is running
});

app.MapHealthChecks("/healthz/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
```

## Authentication & Authorization

```csharp
// JWT Bearer
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.Audience = builder.Configuration["Auth:Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// Policy-based authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim("role", "admin"));

    options.AddPolicy("CanManageOrders", policy =>
        policy.Requirements.Add(new OrderManagementRequirement()));
});
```

## Output Caching (.NET 7+)

```csharp
builder.Services.AddOutputCache(options =>
{
    options.AddBasePolicy(builder => builder.Expire(TimeSpan.FromMinutes(5)));
    options.AddPolicy("Products", builder =>
        builder.Tag("products").Expire(TimeSpan.FromMinutes(30)));
});

app.MapGet("/products", GetProducts)
    .CacheOutput("Products");

// Invalidation
app.MapPost("/products", async (
    CreateProductRequest request,
    IOutputCacheStore store,
    CancellationToken ct) =>
{
    // ... create product ...
    await store.EvictByTagAsync("products", ct);
});
```

## Rate Limiting

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", config =>
    {
        config.PermitLimit = 100;
        config.Window = TimeSpan.FromMinutes(1);
        config.QueueLimit = 0;
    });

    options.AddTokenBucketLimiter("uploads", config =>
    {
        config.TokenLimit = 10;
        config.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        config.TokensPerPeriod = 2;
    });

    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new ProblemDetails { Title = "Too many requests" }, ct);
    };
});

app.UseRateLimiter();
app.MapGet("/api/data", GetData).RequireRateLimiting("api");
```

## Background Services

```csharp
public class OrderProcessorService(
    IServiceScopeFactory scopeFactory,
    ILogger<OrderProcessorService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Order processor starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var processor = scope.ServiceProvider
                    .GetRequiredService<IOrderProcessor>();

                await processor.ProcessPendingOrdersAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error processing orders");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
```

## Anti-Patterns

```csharp
// Never: business logic in endpoints
app.MapPost("/orders", async (CreateOrderRequest req, AppDbContext db) =>
{
    // Validation, business rules, persistence all in one place
    if (req.Items.Count == 0) return Results.BadRequest();
    var order = new Order { /* ... */ };
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Ok(order);
});
// Use services, keep endpoints thin

// Never: exposing entities directly
app.MapGet("/users/{id}", async (int id, AppDbContext db) =>
    await db.Users.FindAsync(id)); // Exposes internal schema, password hashes, etc.
// Map to DTOs/response records

// Never: synchronous I/O in middleware
public void Configure(IApplicationBuilder app)
{
    app.Use((context, next) =>
    {
        var data = File.ReadAllText("config.json"); // Blocks thread pool thread!
        return next();
    });
}
```
