# Go Expert Development Guide

Principal-level guidelines for Go engineering. Idiomatic Go, production systems, and deep runtime knowledge.

---

## Overview

This guide applies to:
- HTTP services and gRPC servers
- CLI tools and system utilities
- Libraries and shared packages
- Distributed systems and microservices
- Data pipelines and stream processing
- Infrastructure tooling and platform code

### Core Philosophy

Go is a language of restraint. The best Go code is boring Go code.

- **Simplicity is the highest virtue.** If a junior engineer can't read it, it's too clever.
- **The standard library is your first dependency.** Reach for third-party packages only when the stdlib genuinely falls short.
- **Errors are values, not exceptions.** Handle them explicitly at every call site.
- **Concurrency is a tool, not a default.** Don't use goroutines because you can — use them because the problem demands it.
- **Interfaces are discovered, not designed.** Accept interfaces, return structs.
- **If you don't know, say you don't know.** Guessing at behavior you haven't verified is worse than admitting uncertainty.

### Key Principles

1. **Effective Go Is the Baseline** — The official docs are the floor, not the ceiling
2. **Accept Interfaces, Return Structs** — Narrow inputs, concrete outputs
3. **Zero Values Are Useful** — Design types so the zero value is valid
4. **Error Handling Is Not Boilerplate** — Every check is a conscious decision
5. **Package Design Matters** — A package name IS the documentation

### Project Structure

```
project/
├── cmd/                    # Main applications (wiring only)
│   └── myapp/main.go
├── internal/               # Private application code
│   ├── domain/             # Core business types and logic
│   ├── service/            # Application services / use cases
│   ├── repository/         # Data access implementations
│   ├── handler/            # HTTP/gRPC handlers
│   └── platform/           # Infrastructure (logging, metrics, config)
├── pkg/                    # Public library code (use sparingly)
├── api/                    # API definitions (OpenAPI, protobuf)
├── migrations/             # Database migrations
├── testdata/               # Test fixtures
├── go.mod
└── Makefile
```

---

## Error Handling

Errors are the primary control flow for failure cases.

### Wrap With Context

```go
result, err := db.QueryContext(ctx, query, args...)
if err != nil {
    return fmt.Errorf("querying users by email %q: %w", email, err)
}
```

### Sentinel Errors and Custom Types

```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) {
    http.Error(w, "not found", http.StatusNotFound)
}

type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}
```

### The run() Pattern

```go
func main() {
    if err := run(); err != nil {
        fmt.Fprintf(os.Stderr, "error: %v\n", err)
        os.Exit(1)
    }
}
```

---

## Concurrency

### Rules

- Don't start a goroutine you can't stop
- The caller decides concurrency
- Share memory by communicating
- Always select on `ctx.Done()`

### errgroup

```go
g, ctx := errgroup.WithContext(ctx)
for i, url := range urls {
    g.Go(func() error {
        resp, err := fetch(ctx, url)
        if err != nil { return err }
        responses[i] = resp
        return nil
    })
}
if err := g.Wait(); err != nil { return nil, err }
```

### Bounded Concurrency

```go
sem := make(chan struct{}, maxConcurrent)
g, ctx := errgroup.WithContext(ctx)
for _, item := range items {
    g.Go(func() error {
        sem <- struct{}{}
        defer func() { <-sem }()
        return process(ctx, item)
    })
}
```

---

## Interfaces and Types

### Small Interfaces

```go
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
```

### Define Interfaces at the Consumer

```go
// In package "handler":
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}
```

### Functional Options

```go
type Option func(*Server)

func WithReadTimeout(d time.Duration) Option {
    return func(s *Server) { s.readTimeout = d }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{addr: addr, readTimeout: 30 * time.Second}
    for _, opt := range opts { opt(s) }
    return s
}
```

### Generics

```go
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s { result[i] = f(v) }
    return result
}
```

---

## Testing

### Table-Driven Tests

```go
func TestParseAge(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {name: "valid age", input: "25", want: 25},
        {name: "negative", input: "-1", wantErr: true},
        {name: "non-numeric", input: "abc", wantErr: true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAge(tt.input)
            if tt.wantErr {
                if err == nil { t.Errorf("expected error") }
                return
            }
            if err != nil { t.Fatalf("unexpected error: %v", err) }
            if got != tt.want { t.Errorf("got %d, want %d", got, tt.want) }
        })
    }
}
```

### Dependency Injection via Interfaces

```go
type fakeUserStore struct {
    users map[string]*User
    err   error
}
func (f *fakeUserStore) GetByID(_ context.Context, id string) (*User, error) {
    if f.err != nil { return nil, f.err }
    u, ok := f.users[id]
    if !ok { return nil, ErrNotFound }
    return u, nil
}
```

### HTTP Handler Tests

```go
req := httptest.NewRequest("GET", "/users/123", nil)
rec := httptest.NewRecorder()
srv.ServeHTTP(rec, req)
if rec.Code != http.StatusOK {
    t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
}
```

### Race Detection

Always run `go test -race ./...` in CI. Every report is a real bug.

---

## Standard Library and Tooling

### net/http (Production-Ready)

```go
mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", getUser)

srv := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
}
```

### log/slog

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.Info("request", "method", r.Method, "path", r.URL.Path, "duration", elapsed)
```

### Essential Commands

```bash
go test -race ./...     # Tests with race detection
go vet ./...            # Static analysis
golangci-lint run       # Comprehensive linting
go mod tidy             # Clean up dependencies
```

---

## Performance

### Profile First

```go
import _ "net/http/pprof"
// go tool pprof http://localhost:6060/debug/pprof/heap
```

### Key Patterns

- Preallocate slices when length is known
- Use `sync.Pool` for large, frequently allocated buffers
- Use `strings.Builder` for concatenation
- Use `sync.RWMutex` for read-heavy workloads
- Use `atomic` for hot counters
- Always set `http.Server` timeouts
- Always set database connection pool limits

---

## Production Patterns

### Graceful Shutdown

```go
ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer cancel()
// Start server, then <-ctx.Done(), then srv.Shutdown(shutdownCtx)
```

### Health Checks

```go
mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
    if err := db.PingContext(r.Context()); err != nil {
        http.Error(w, "unhealthy", http.StatusServiceUnavailable)
        return
    }
    w.Write([]byte(`{"status":"ok"}`))
})
```

### Retry with Backoff

Exponential backoff with jitter. Always respect context cancellation.

### Database Transactions

```go
func WithTransaction(ctx context.Context, db *sql.DB, fn TxFunc) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil { return err }
    if err := fn(ctx, tx); err != nil {
        tx.Rollback()
        return err
    }
    return tx.Commit()
}
```

---

## Definition of Done

A Go feature is complete when:

- [ ] `go vet ./...` reports zero issues
- [ ] `staticcheck ./...` reports zero issues
- [ ] `golangci-lint run` passes
- [ ] `go test -race ./...` passes with no race conditions
- [ ] Test coverage covers meaningful behavior
- [ ] Error paths are tested
- [ ] Documentation comments on all exported identifiers
- [ ] Context propagation is correct
- [ ] Resource cleanup verified (deferred closes, connection pools)
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
