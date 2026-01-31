# Go Concurrency

Concurrency is Go's defining feature. It is also the easiest way to write bugs that are impossible to reproduce. Use it deliberately, not by default.

## Fundamental Rules

### 1. Don't Start a Goroutine You Can't Stop

```go
// Good: Goroutine respects context cancellation
func (w *Worker) Run(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case job := <-w.jobs:
            if err := w.process(ctx, job); err != nil {
                return fmt.Errorf("processing job: %w", err)
            }
        }
    }
}

// Bad: Goroutine runs forever with no way to stop it
go func() {
    for {
        doWork() // No context, no signal, no way out
    }
}()
```

### 2. The Caller Decides Concurrency

```go
// Good: Synchronous function — caller decides whether to use goroutine
func FetchUser(ctx context.Context, id string) (*User, error) {
    // ...
}

// Caller makes it concurrent when needed
go func() {
    user, err := FetchUser(ctx, id)
    results <- result{user, err}
}()

// Bad: Function that forces concurrency on the caller
func FetchUserAsync(id string) <-chan *User {
    ch := make(chan *User)
    go func() {
        // Caller can't pass context, can't handle errors properly
    }()
    return ch
}
```

### 3. Share Memory by Communicating

```go
// Good: Channels for ownership transfer
func generator(ctx context.Context) <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)
        for i := 0; ; i++ {
            select {
            case <-ctx.Done():
                return
            case ch <- i:
            }
        }
    }()
    return ch
}

// Good: Mutex when protecting shared state with simple access patterns
type SafeCounter struct {
    mu sync.Mutex
    v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.v[key]++
}
```

## Channel Patterns

### Pipeline

```go
func pipeline(ctx context.Context, input <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for v := range input {
            select {
            case <-ctx.Done():
                return
            case out <- v * 2:
            }
        }
    }()
    return out
}
```

### Fan-Out, Fan-In

```go
func fanOut(ctx context.Context, input <-chan Job, workers int) <-chan Result {
    results := make(chan Result)
    var wg sync.WaitGroup

    for range workers {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range input {
                select {
                case <-ctx.Done():
                    return
                case results <- process(job):
                }
            }
        }()
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}
```

### Bounded Concurrency with Semaphore

```go
func processAll(ctx context.Context, items []Item, maxConcurrent int) error {
    sem := make(chan struct{}, maxConcurrent)
    g, ctx := errgroup.WithContext(ctx)

    for _, item := range items {
        g.Go(func() error {
            select {
            case sem <- struct{}{}:
                defer func() { <-sem }()
            case <-ctx.Done():
                return ctx.Err()
            }
            return process(ctx, item)
        })
    }

    return g.Wait()
}
```

## sync Package

### sync.WaitGroup

```go
// Always Add before launching the goroutine
var wg sync.WaitGroup
for _, item := range items {
    wg.Add(1)
    go func() {
        defer wg.Done()
        process(item)
    }()
}
wg.Wait()
```

### sync.Once

```go
// For lazy, thread-safe initialization
type Client struct {
    initOnce sync.Once
    conn     *grpc.ClientConn
}

func (c *Client) getConn() *grpc.ClientConn {
    c.initOnce.Do(func() {
        c.conn = dial() // Only called once, even from many goroutines
    })
    return c.conn
}
```

### sync.Map

```go
// Use sync.Map ONLY when:
// 1. Keys are stable (write-once, read-many)
// 2. Disjoint goroutines access disjoint key sets
// Otherwise, a regular map with sync.Mutex is simpler and often faster.
```

## errgroup

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) ([]Response, error) {
    g, ctx := errgroup.WithContext(ctx)
    responses := make([]Response, len(urls))

    for i, url := range urls {
        g.Go(func() error {
            resp, err := fetch(ctx, url)
            if err != nil {
                return fmt.Errorf("fetching %s: %w", url, err)
            }
            responses[i] = resp // Safe: each goroutine writes to its own index
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return responses, nil
}
```

## Context

```go
// Context is the first parameter, always
func DoWork(ctx context.Context, id string) error { ... }

// Never store context in a struct
// Bad:
type Server struct {
    ctx context.Context // Don't do this
}

// Derive child contexts for scoped deadlines
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel() // Always defer cancel to avoid leaks

// Use context values sparingly — only for request-scoped data
// that transits process boundaries (trace IDs, auth tokens)
// Never use context for passing optional parameters
```

## Race Condition Prevention

```go
// Always run tests with -race
// go test -race ./...

// Common race: closing over loop variable (fixed in Go 1.22+)
// Pre-1.22, you needed:
for _, item := range items {
    item := item // Shadow the loop variable
    go process(item)
}
// Go 1.22+ loop variables are per-iteration — no shadowing needed

// Common race: reading and writing a map concurrently
// Maps are NOT safe for concurrent use — use sync.Mutex or sync.Map
```

## Anti-Patterns

```go
// Never: Goroutine without ownership
go doSomething() // Who waits for this? Who handles the error?

// Never: time.Sleep for synchronization
time.Sleep(100 * time.Millisecond) // Hoping goroutine finishes — use sync primitives

// Never: Unbounded goroutine spawning
for _, item := range millionItems {
    go process(item) // OOM or file descriptor exhaustion
}

// Never: Closing a channel from the receiver side
// Only the sender closes. Receivers check with range or ok idiom.

// Never: Sending on a closed channel (panics)
// Design your channel lifecycle so ownership is clear
```
