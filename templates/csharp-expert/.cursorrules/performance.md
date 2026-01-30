# C# Performance

Measure first. Optimize second. BenchmarkDotNet is your truth.

## Profile Before Optimizing

```csharp
// BenchmarkDotNet for micro-benchmarks
[MemoryDiagnoser]
[SimpleJob(RuntimeMoniker.Net90)]
public class StringConcatBenchmark
{
    private readonly string[] _items = Enumerable.Range(0, 1000)
        .Select(i => i.ToString()).ToArray();

    [Benchmark(Baseline = true)]
    public string Concatenation()
    {
        var result = "";
        foreach (var item in _items)
            result += item;
        return result;
    }

    [Benchmark]
    public string StringBuilder()
    {
        var sb = new StringBuilder();
        foreach (var item in _items)
            sb.Append(item);
        return sb.ToString();
    }

    [Benchmark]
    public string StringJoin()
        => string.Join("", _items);
}
```

### Diagnostic Tools

| Tool | Purpose |
|------|---------|
| `dotnet-counters` | Live runtime metrics (GC, thread pool, exceptions) |
| `dotnet-trace` | Performance tracing |
| `dotnet-dump` | Memory dump analysis |
| `dotnet-gcdump` | GC heap analysis |
| BenchmarkDotNet | Micro-benchmarks with statistical rigor |

## Allocation Patterns

### Reduce Allocations

```csharp
// Bad: allocates on every call
public string FormatName(string first, string last)
    => $"{first} {last}"; // Allocates interpolated string

// Good: use string.Create or Span for hot paths
public string FormatName(ReadOnlySpan<char> first, ReadOnlySpan<char> last)
    => string.Create(first.Length + 1 + last.Length, (first.ToString(), last.ToString()),
        (span, state) =>
        {
            state.Item1.AsSpan().CopyTo(span);
            span[state.Item1.Length] = ' ';
            state.Item2.AsSpan().CopyTo(span[(state.Item1.Length + 1)..]);
        });

// Better for most cases: just use StringBuilder
// Premature optimization with Span is worse than readable code
```

### ArrayPool and MemoryPool

```csharp
// Rent buffers instead of allocating
public async Task<byte[]> CompressAsync(Stream input, CancellationToken ct)
{
    var buffer = ArrayPool<byte>.Shared.Rent(8192);
    try
    {
        using var output = new MemoryStream();
        using var compressor = new GZipStream(output, CompressionLevel.Optimal);

        int bytesRead;
        while ((bytesRead = await input.ReadAsync(buffer, ct)) > 0)
        {
            await compressor.WriteAsync(buffer.AsMemory(0, bytesRead), ct);
        }

        await compressor.FlushAsync(ct);
        return output.ToArray();
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);
    }
}
```

### Object Pooling

```csharp
// ObjectPool for expensive-to-create objects
builder.Services.AddSingleton<ObjectPool<StringBuilder>>(
    new DefaultObjectPoolProvider().CreateStringBuilderPool());

public class ReportGenerator(ObjectPool<StringBuilder> pool)
{
    public string Generate(ReportData data)
    {
        var sb = pool.Get();
        try
        {
            sb.AppendLine($"Report: {data.Title}");
            foreach (var item in data.Items)
                sb.AppendLine($"- {item.Name}: {item.Value}");
            return sb.ToString();
        }
        finally
        {
            pool.Return(sb);
        }
    }
}
```

## struct vs class

```csharp
// Use struct when:
// - Logically represents a single value
// - Instance size < 16 bytes (guideline, not rule)
// - Immutable
// - Won't be boxed frequently
public readonly record struct Coordinate(double Lat, double Lon);

// Use class when:
// - Reference semantics needed
// - Will be used polymorphically
// - Large (copying structs is expensive)
// - Needs to be nullable (struct? has overhead)
```

## Collection Performance

```csharp
// FrozenDictionary/FrozenSet for read-heavy, write-once scenarios (.NET 8+)
private static readonly FrozenDictionary<string, Handler> _handlers =
    new Dictionary<string, Handler>
    {
        ["GET"] = new GetHandler(),
        ["POST"] = new PostHandler(),
    }.ToFrozenDictionary();

// Use CollectionsMarshal for high-performance dictionary access
ref var value = ref CollectionsMarshal.GetValueRefOrAddDefault(
    dictionary, key, out bool exists);
if (!exists) value = ComputeExpensiveValue(key);

// Correct collection type for the job
// List<T>: random access, append
// HashSet<T>: uniqueness, O(1) Contains
// Dictionary<K,V>: O(1) lookup by key
// Queue<T>/Stack<T>: FIFO/LIFO
// LinkedList<T>: frequent insert/remove in middle (rare in practice)
// SortedSet<T>: ordered unique elements
```

## EF Core Performance

```csharp
// Always use AsNoTracking for read-only queries
var users = await _db.Users
    .AsNoTracking()
    .Where(u => u.IsActive)
    .Select(u => new UserDto(u.Id, u.Name, u.Email)) // Project to DTO
    .ToListAsync(ct);

// Avoid N+1 queries — use Include or projection
// Bad:
var orders = await _db.Orders.ToListAsync(ct);
foreach (var order in orders)
{
    var items = order.Items; // Lazy load = N+1 queries!
}

// Good:
var orders = await _db.Orders
    .Include(o => o.Items)
    .ToListAsync(ct);

// Even better: project to exactly what you need
var orderSummaries = await _db.Orders
    .Select(o => new OrderSummary(o.Id, o.Total, o.Items.Count))
    .ToListAsync(ct);

// Use compiled queries for hot paths
private static readonly Func<AppDbContext, int, Task<User?>> GetUserById =
    EF.CompileAsyncQuery((AppDbContext db, int id) =>
        db.Users.FirstOrDefault(u => u.Id == id));
```

## Caching

```csharp
// IMemoryCache for single-instance caching
public async Task<User?> GetUserAsync(int id, CancellationToken ct)
{
    return await _cache.GetOrCreateAsync($"user:{id}", async entry =>
    {
        entry.SetSlidingExpiration(TimeSpan.FromMinutes(5));
        entry.SetAbsoluteExpiration(TimeSpan.FromHours(1));
        entry.SetSize(1); // For bounded caches
        return await _repository.GetByIdAsync(id, ct);
    });
}

// IDistributedCache for multi-instance (Redis, SQL Server)
// HybridCache (.NET 9+) for stampede protection
public async Task<User?> GetUserAsync(int id, CancellationToken ct)
{
    return await _hybridCache.GetOrCreateAsync(
        $"user:{id}",
        async token => await _repository.GetByIdAsync(id, token),
        cancellationToken: ct);
}
```

## Anti-Patterns

```csharp
// Never: premature optimization without measurement
// "I think StringBuilder is faster" — prove it with a benchmark

// Never: LINQ in hot loops when a simple for loop suffices
for (int i = 0; i < items.Length; i++) // Fine for hot paths
    Process(items[i]);

// Never: multiple enumeration of IEnumerable
var count = query.Count();    // Executes query
var list = query.ToList();    // Executes query AGAIN
// Materialize once: var list = query.ToList(); var count = list.Count;

// Never: blocking async in constructors
public MyService()
{
    _data = LoadDataAsync().Result; // Deadlock risk
}
// Use async factory method or lazy initialization
```
