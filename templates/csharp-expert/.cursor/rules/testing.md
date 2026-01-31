# C# Testing

Test behavior, not implementation. Every test should answer: "what does this code do?"

## Framework Stack

| Tool | Purpose |
|------|---------|
| xUnit | Test framework (preferred for .NET) |
| NSubstitute | Mocking (clean syntax, less ceremony than Moq) |
| FluentAssertions | Readable assertions |
| Bogus | Test data generation |
| Testcontainers | Real databases/services in integration tests |
| Verify | Snapshot testing |
| ArchUnitNET | Architecture tests |

## Unit Test Structure

```csharp
public class OrderServiceTests
{
    private readonly IOrderRepository _repository = Substitute.For<IOrderRepository>();
    private readonly IInventoryService _inventory = Substitute.For<IInventoryService>();
    private readonly OrderService _sut;

    public OrderServiceTests()
    {
        _sut = new OrderService(_repository, _inventory);
    }

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
        result.Value.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task CreateOrder_WithInsufficientInventory_ReturnsError()
    {
        // Arrange
        var request = new CreateOrderRequest("customer-1", [new("sku-1", 100)]);
        _inventory.CheckAvailabilityAsync("sku-1", 100, Arg.Any<CancellationToken>())
            .Returns(false);

        // Act
        var result = await _sut.CreateAsync(request, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error!.Code.Should().Be("INSUFFICIENT_INVENTORY");
    }
}
```

## Test Naming

```csharp
// Pattern: Method_Scenario_ExpectedBehavior
[Fact]
public async Task GetByEmail_WhenUserExists_ReturnsUser() { }

[Fact]
public async Task GetByEmail_WhenUserNotFound_ReturnsNull() { }

[Fact]
public async Task Register_WithDuplicateEmail_ReturnsConflictError() { }

// Or descriptive phrases
[Fact]
public async Task Newly_created_order_has_pending_status() { }
```

## Theory (Parameterized Tests)

```csharp
[Theory]
[InlineData("", false)]
[InlineData("a", false)]
[InlineData("ab", false)]
[InlineData("abc", true)]
[InlineData("valid@email.com", true)]
public void Validate_Password_MinLength(string input, bool expectedValid)
{
    var result = PasswordValidator.IsValid(input);
    result.Should().Be(expectedValid);
}

// Complex data with MemberData
[Theory]
[MemberData(nameof(InvalidOrderTestCases))]
public async Task CreateOrder_WithInvalidData_ReturnsValidationError(
    CreateOrderRequest request, string expectedErrorCode)
{
    var result = await _sut.CreateAsync(request, CancellationToken.None);

    result.IsSuccess.Should().BeFalse();
    result.Error!.Code.Should().Be(expectedErrorCode);
}

public static IEnumerable<object[]> InvalidOrderTestCases()
{
    yield return [new CreateOrderRequest("", []), "VALIDATION"];
    yield return [new CreateOrderRequest("c1", []), "VALIDATION"];
}
```

## Integration Tests with WebApplicationFactory

```csharp
public class OrderEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrderEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real services with test doubles
                services.RemoveAll<IOrderRepository>();
                services.AddScoped<IOrderRepository, InMemoryOrderRepository>();
            });
        }).CreateClient();
    }

    [Fact]
    public async Task POST_orders_returns_created_for_valid_request()
    {
        // Arrange
        var request = new CreateOrderRequest("customer-1", [new("sku-1", 1)]);

        // Act
        var response = await _client.PostAsJsonAsync("/orders", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();
        order!.CustomerId.Should().Be("customer-1");
    }

    [Fact]
    public async Task GET_orders_id_returns_not_found_for_missing_order()
    {
        var response = await _client.GetAsync("/orders/nonexistent");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
```

## Integration Tests with Testcontainers

```csharp
public class PostgresOrderRepositoryTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    private AppDbContext _dbContext = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        _dbContext = new AppDbContext(options);
        await _dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task SaveAndRetrieve_RoundTrips_Correctly()
    {
        var repo = new OrderRepository(_dbContext);
        var order = Order.Create("customer-1", [new OrderItem("sku-1", 2, 9.99m)]);

        await repo.SaveAsync(order, CancellationToken.None);
        var retrieved = await repo.GetByIdAsync(order.Id, CancellationToken.None);

        retrieved.Should().NotBeNull();
        retrieved!.CustomerId.Should().Be("customer-1");
        retrieved.Items.Should().HaveCount(1);
    }
}
```

## Architecture Tests

```csharp
public class ArchitectureTests
{
    private static readonly Architecture Architecture =
        new ArchLoader().LoadAssemblies(
            typeof(Order).Assembly,       // Domain
            typeof(OrderService).Assembly, // Application
            typeof(OrderRepository).Assembly // Infrastructure
        ).Build();

    [Fact]
    public void Domain_should_not_depend_on_infrastructure()
    {
        Types().That().ResideInNamespace("MyApp.Domain")
            .Should().NotDependOnAny("MyApp.Infrastructure")
            .Check(Architecture);
    }

    [Fact]
    public void Application_should_not_depend_on_aspnetcore()
    {
        Types().That().ResideInNamespace("MyApp.Application")
            .Should().NotDependOnAny("Microsoft.AspNetCore")
            .Check(Architecture);
    }
}
```

## Test Data Builders

```csharp
// Bogus for realistic fake data
public static class TestData
{
    private static readonly Faker<CreateOrderRequest> OrderFaker = new Faker<CreateOrderRequest>()
        .CustomInstantiator(f => new CreateOrderRequest(
            CustomerId: f.Random.Guid().ToString(),
            Items: f.Make(f.Random.Int(1, 5), () =>
                new OrderItemRequest(f.Commerce.Ean13(), f.Random.Int(1, 10)))));

    public static CreateOrderRequest ValidOrder() => OrderFaker.Generate();

    // Builder pattern for specific scenarios
    public static CreateOrderRequest OrderWithItems(int count) =>
        OrderFaker.Generate() with
        {
            Items = Enumerable.Range(0, count)
                .Select(i => new OrderItemRequest($"sku-{i}", 1))
                .ToList()
        };
}
```

## Anti-Patterns

```csharp
// Never: testing implementation details
_repository.Received(1).SaveAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>());
// Test the outcome instead: verify the order was actually persisted

// Never: shared mutable state between tests
private static List<Order> _orders = []; // Tests pollute each other
// Use fresh state in constructor or Setup

// Never: Thread.Sleep in tests
await Task.Delay(5000); // Flaky and slow
// Use polling with timeout, or Polly retry, or proper async synchronization

// Never: testing trivial code
[Fact]
public void Name_getter_returns_name() // Waste of time
{
    var user = new User { Name = "Alice" };
    user.Name.Should().Be("Alice");
}
```
