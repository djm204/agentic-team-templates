# Go Performance

Go is fast by default. The garbage collector, runtime scheduler, and compiler do heavy lifting. Your job is to not get in the way — and to know how to profile when something is slow.

## Profile First

Never optimize without profiling data. Intuition about bottlenecks is wrong more often than it's right.

```go
// CPU profiling
import "runtime/pprof"

f, _ := os.Create("cpu.prof")
pprof.StartCPUProfile(f)
defer pprof.StopCPUProfile()

// Memory profiling
f, _ := os.Create("mem.prof")
pprof.WriteHeapProfile(f)

// In HTTP servers — import for side effects
import _ "net/http/pprof"
// Then: go tool pprof http://localhost:6060/debug/pprof/heap

// Analyze
// go tool pprof cpu.prof
// (pprof) top10
// (pprof) web    # Opens in browser
// (pprof) list FunctionName
```

## Memory Allocation

### Preallocate Slices

```go
// Good: Preallocate when length is known
users := make([]User, 0, len(ids))
for _, id := range ids {
    u, err := getUser(id)
    if err != nil {
        return nil, err
    }
    users = append(users, u)
}

// Bad: Growing slice dynamically
var users []User // Repeated reallocation as it grows
```

### Avoid Unnecessary Allocations

```go
// Good: Reuse buffers
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func process(data []byte) string {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufPool.Put(buf)
    }()

    buf.Write(data)
    // ... process ...
    return buf.String()
}

// Good: strings.Builder for string concatenation
var b strings.Builder
for _, s := range parts {
    b.WriteString(s)
}
result := b.String()

// Bad: String concatenation in a loop
result := ""
for _, s := range parts {
    result += s // Allocates a new string every iteration
}
```

### Pointer vs Value Semantics

```go
// Small structs (< ~64 bytes): pass by value — avoids heap allocation
type Point struct{ X, Y float64 }
func Distance(a, b Point) float64 { ... } // Copies are cheap, stays on stack

// Large structs or structs that must be shared: pass by pointer
type Config struct { /* many fields */ }
func NewServer(cfg *Config) *Server { ... }

// Slices, maps, and channels are already reference types — don't pass pointers to them
func Process(items []Item) { ... }     // Good
func Process(items *[]Item) { ... }    // Bad (unless you need to modify the slice header)
```

## Concurrency Performance

### Minimize Lock Contention

```go
// Use sync.RWMutex for read-heavy workloads
type Cache struct {
    mu   sync.RWMutex
    data map[string]Entry
}

func (c *Cache) Get(key string) (Entry, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    e, ok := c.data[key]
    return e, ok
}

func (c *Cache) Set(key string, entry Entry) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = entry
}

// For high-contention counters, use atomic operations
var requestCount atomic.Int64
requestCount.Add(1)
```

### Avoid Goroutine Leaks

```go
// Every goroutine must have a clear exit condition
// Use context cancellation to signal shutdown

func startWorkers(ctx context.Context, n int) {
    var wg sync.WaitGroup
    for range n {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for {
                select {
                case <-ctx.Done():
                    return
                default:
                    doWork()
                }
            }
        }()
    }
    wg.Wait()
}
```

## Compiler Optimizations

```go
// Inlining: Small functions are automatically inlined
// Check: go build -gcflags="-m" ./...

// Escape analysis: The compiler decides stack vs heap
// Check: go build -gcflags="-m" ./...
// "moved to heap" = allocation — consider if avoidable

// Bounds check elimination: The compiler removes bounds checks
// when it can prove safety
s := data[0:10]
for i := range s { // Compiler knows i is in bounds — no check needed
    process(s[i])
}
```

## Database Performance

```go
// Always use connection pooling
db, err := sql.Open("postgres", connString)
db.SetMaxOpenConns(25)           // Limit concurrent connections
db.SetMaxIdleConns(5)            // Keep some connections warm
db.SetConnMaxLifetime(5 * time.Minute) // Rotate connections

// Use prepared statements for repeated queries
stmt, err := db.PrepareContext(ctx, "SELECT * FROM users WHERE id = $1")
defer stmt.Close()

// Use batch operations for bulk inserts
// Use COPY protocol (pgx) for large data loads
```

## Benchmarking Best Practices

```go
func BenchmarkJSON(b *testing.B) {
    data := loadTestData()

    b.ResetTimer()        // Exclude setup time
    b.ReportAllocs()      // Report memory allocations

    for b.Loop() {
        var result MyStruct
        if err := json.Unmarshal(data, &result); err != nil {
            b.Fatal(err)
        }
    }
}

// Compare implementations
func BenchmarkJSON_StdLib(b *testing.B) { ... }
func BenchmarkJSON_Sonic(b *testing.B) { ... }

// Run: go test -bench=. -benchmem -count=5 ./...
// Use benchstat to compare: benchstat old.txt new.txt
```

## Anti-Patterns

```go
// Never: Premature optimization
// Profile first. The bottleneck is almost never where you think it is.

// Never: sync.Pool for small, short-lived objects
// The GC handles these efficiently. Pool is for large buffers.

// Never: Manual memory management tricks
// Go's GC is highly optimized. Fight the runtime and you'll lose.

// Never: Caching without bounds
cache := make(map[string]Result) // Grows forever — OOM eventually
// Use an LRU cache with a max size.

// Never: Blocking operations in hot paths without timeouts
resp, err := http.Get(url) // No timeout! Use http.Client with Timeout set.
```
