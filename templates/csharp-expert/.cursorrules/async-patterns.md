# C# Async Patterns

async/await done right. Every pitfall known. Every pattern battle-tested.

## The Golden Rules

1. **Async all the way down.** Never mix sync and async.
2. **Never block on async.** No `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` in application code.
3. **Always pass CancellationToken.** Every async method that does I/O should accept and honor one.
4. **ConfigureAwait(false) in library code.** Not needed in ASP.NET Core app code (no SynchronizationContext).
5. **Return Task, not void.** `async void` is only for event handlers.

## Proper Async Methods

```csharp
// Good: accepts CancellationToken, returns Task<T>
public async Task<User?> GetUserAsync(int id, CancellationToken cancellationToken = default)
{
    return await _dbContext.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
}

// Good: elide async/await when just forwarding
public Task<User?> GetUserAsync(int id, CancellationToken ct = default)
    => _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
// But: don't elide if there's a using/try-catch — the await ensures proper lifetime

// Bad: blocking on async
public User GetUser(int id)
{
    return GetUserAsync(id).Result; // DEADLOCK RISK
}
```

## CancellationToken

```csharp
// Thread it through every layer
public async Task<OrderResult> ProcessOrderAsync(
    CreateOrderRequest request,
    CancellationToken cancellationToken)
{
    var user = await _userService.GetByIdAsync(request.UserId, cancellationToken);
    var inventory = await _inventoryService.CheckAsync(request.Items, cancellationToken);

    // Check cancellation before expensive operations
    cancellationToken.ThrowIfCancellationRequested();

    var order = Order.Create(user, inventory);
    await _repository.SaveAsync(order, cancellationToken);

    return new OrderResult(order.Id);
}

// Link cancellation tokens
using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
    cancellationToken,
    _applicationLifetime.ApplicationStopping);

// Timeout with cancellation
using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
    cancellationToken, timeoutCts.Token);
```

## Concurrent Operations

```csharp
// Good: parallel independent operations with Task.WhenAll
public async Task<DashboardData> GetDashboardAsync(int userId, CancellationToken ct)
{
    var userTask = _userService.GetByIdAsync(userId, ct);
    var ordersTask = _orderService.GetRecentAsync(userId, ct);
    var notificationsTask = _notificationService.GetUnreadAsync(userId, ct);

    await Task.WhenAll(userTask, ordersTask, notificationsTask);

    return new DashboardData(
        User: await userTask,
        Orders: await ordersTask,
        Notifications: await notificationsTask);
}

// Good: bounded concurrency with SemaphoreSlim
public async Task ProcessBatchAsync(
    IReadOnlyList<Item> items, CancellationToken ct)
{
    using var semaphore = new SemaphoreSlim(maxConcurrency: 10);
    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(ct);
        try
        {
            await ProcessItemAsync(item, ct);
        }
        finally
        {
            semaphore.Release();
        }
    });

    await Task.WhenAll(tasks);
}
```

## Channels

```csharp
// Producer-consumer with bounded channels
public class EventProcessor
{
    private readonly Channel<DomainEvent> _channel =
        Channel.CreateBounded<DomainEvent>(new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });

    public async ValueTask PublishAsync(DomainEvent @event, CancellationToken ct)
    {
        await _channel.Writer.WriteAsync(@event, ct);
    }

    public async Task ProcessAsync(CancellationToken ct)
    {
        await foreach (var @event in _channel.Reader.ReadAllAsync(ct))
        {
            await HandleEventAsync(@event, ct);
        }
    }
}
```

## ValueTask

```csharp
// Use ValueTask when the result is often synchronous (cached, pooled)
public ValueTask<User?> GetCachedUserAsync(int id, CancellationToken ct)
{
    if (_cache.TryGetValue(id, out var user))
        return ValueTask.FromResult<User?>(user); // No allocation

    return GetAndCacheUserAsync(id, ct); // Async path
}

private async ValueTask<User?> GetAndCacheUserAsync(int id, CancellationToken ct)
{
    var user = await _repository.GetByIdAsync(id, ct);
    if (user is not null) _cache.Set(id, user);
    return user;
}

// Rules for ValueTask:
// - Never await a ValueTask more than once
// - Never use .Result or .GetAwaiter().GetResult() on an incomplete ValueTask
// - Never use Task.WhenAll with ValueTask (convert with .AsTask() first)
```

## IAsyncEnumerable

```csharp
// Streaming results without buffering
public async IAsyncEnumerable<LogEntry> StreamLogsAsync(
    string filter,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    await foreach (var line in _logSource.ReadLinesAsync(ct))
    {
        if (line.Contains(filter, StringComparison.OrdinalIgnoreCase))
        {
            yield return ParseLogEntry(line);
        }
    }
}

// Consuming
await foreach (var entry in StreamLogsAsync("ERROR", ct))
{
    await ProcessEntryAsync(entry, ct);
}
```

## Anti-Patterns

```csharp
// Never: async void (unobservable exceptions)
async void OnButtonClick() { await DoWorkAsync(); }
// Use: async Task OnButtonClickAsync() { ... }

// Never: fire-and-forget without error handling
_ = DoWorkAsync(); // Exception silently swallowed
// Use: _ = Task.Run(async () => { try { ... } catch { _logger.LogError(...); } });

// Never: unnecessary async/await wrapper
async Task<int> GetValueAsync() { return await Task.FromResult(42); }
// Just: Task<int> GetValueAsync() => Task.FromResult(42);

// Never: Task.Run for I/O-bound work
await Task.Run(() => httpClient.GetAsync(url)); // Wastes a thread pool thread
// Just: await httpClient.GetAsync(url);

// Never: capturing loop variable in pre-C#5 style (modern C# handles this, but be aware)
// Never: using async lambdas with void-returning delegates (Action)
```
