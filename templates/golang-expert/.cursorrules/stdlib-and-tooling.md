# Go Standard Library and Tooling

The standard library is Go's greatest asset. Know it deeply before reaching for third-party packages.

## Essential stdlib Packages

### net/http

```go
// The stdlib HTTP server is production-ready. You rarely need a framework.
mux := http.NewServeMux()

mux.HandleFunc("GET /users/{id}", getUser)
mux.HandleFunc("POST /users", createUser)
mux.HandleFunc("GET /healthz", healthCheck)

srv := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  10 * time.Second,
    WriteTimeout: 10 * time.Second,
    IdleTimeout:  120 * time.Second,
}

// Always set timeouts — an http.Server with no timeouts will leak goroutines
```

### Middleware Pattern

```go
// Middleware is just a function that wraps an http.Handler
func Logging(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            wrapped := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}

            next.ServeHTTP(wrapped, r)

            logger.Info("request",
                "method", r.Method,
                "path", r.URL.Path,
                "status", wrapped.statusCode,
                "duration", time.Since(start),
            )
        })
    }
}

type responseRecorder struct {
    http.ResponseWriter
    statusCode int
}

func (r *responseRecorder) WriteHeader(code int) {
    r.statusCode = code
    r.ResponseWriter.WriteHeader(code)
}

// Chain middleware
handler := Logging(logger)(Recovery()(Auth(secret)(mux)))
```

### encoding/json

```go
// Struct tags control serialization
type User struct {
    ID        string    `json:"id"`
    Email     string    `json:"email"`
    Name      string    `json:"name,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    password  string    // unexported — never serialized
}

// Use json.NewDecoder for streams, json.Unmarshal for []byte
func decodeBody(r *http.Request, v any) error {
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields() // Reject unexpected fields
    if err := dec.Decode(v); err != nil {
        return fmt.Errorf("decoding request body: %w", err)
    }
    return nil
}
```

### log/slog (Go 1.21+)

```go
// slog is the standard structured logger — use it
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))

logger.Info("server starting", "addr", addr, "version", version)
logger.Error("query failed", "error", err, "query", query)

// Add context to a sub-logger
reqLogger := logger.With("request_id", requestID, "user_id", userID)
reqLogger.Info("processing request")
```

### context

```go
// Context carries deadlines, cancellation signals, and request-scoped values
// across API boundaries and goroutines

// Timeouts
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

result, err := db.QueryContext(ctx, query)

// Values — sparingly, for request-scoped cross-cutting concerns only
type contextKey string
const requestIDKey contextKey = "request_id"

func WithRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, requestIDKey, id)
}

func RequestID(ctx context.Context) string {
    id, _ := ctx.Value(requestIDKey).(string)
    return id
}
```

### io and io/fs

```go
// io.Reader and io.Writer are the universal interfaces
// If your function accepts io.Reader, it works with:
// - files, HTTP bodies, buffers, strings, gzip streams, network connections...

func CountLines(r io.Reader) (int, error) {
    scanner := bufio.NewScanner(r)
    count := 0
    for scanner.Scan() {
        count++
    }
    return count, scanner.Err()
}

// Works with anything
CountLines(os.Stdin)
CountLines(strings.NewReader("hello\nworld"))
CountLines(resp.Body)

// io/fs for filesystem abstraction (Go 1.16+)
func LoadTemplates(fsys fs.FS) (*template.Template, error) {
    return template.ParseFS(fsys, "templates/*.html")
}

// Production: os.DirFS("./templates")
// Tests: fstest.MapFS{"templates/index.html": {Data: []byte("...")}}
```

### time

```go
// Always use time.Duration for durations, never raw int64
func Retry(attempts int, delay time.Duration, fn func() error) error { ... }

// Use time.NewTicker, not time.Tick (Tick leaks)
ticker := time.NewTicker(30 * time.Second)
defer ticker.Stop()

// Use monotonic clock for elapsed time (time.Since does this automatically)
start := time.Now()
doWork()
elapsed := time.Since(start) // Monotonic, not affected by clock adjustments

// Parse and format with the reference time: Mon Jan 2 15:04:05 MST 2006
t, err := time.Parse("2006-01-02", "2025-03-15")
s := t.Format(time.RFC3339)
```

## Toolchain

### Essential Commands

```bash
# Build and run
go build ./...          # Compile all packages
go run ./cmd/myapp      # Compile and execute
go install ./cmd/myapp  # Install binary to $GOBIN

# Testing
go test ./...           # Run all tests
go test -race ./...     # Run with race detector (always in CI)
go test -count=1 ./...  # Disable test caching
go test -short ./...    # Skip long-running tests
go test -cover ./...    # Show coverage percentage
go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out

# Vetting
go vet ./...            # Official static analysis

# Modules
go mod tidy             # Remove unused, add missing dependencies
go mod verify           # Verify dependency checksums
go mod why <module>     # Explain why a dependency is needed
```

### Linters

```yaml
# .golangci-lint.yml — recommended configuration
linters:
  enable:
    - errcheck          # Check that errors are handled
    - govet             # Official Go vet checks
    - staticcheck       # The gold standard static analyzer
    - unused            # Find unused code
    - gosimple          # Simplify code
    - ineffassign       # Detect ineffectual assignments
    - gocritic          # Opinionated style checks
    - revive            # Fast, configurable linter
    - misspell          # Find common spelling mistakes
    - prealloc          # Suggest preallocating slices
    - unconvert         # Remove unnecessary type conversions
    - errname           # Check error variable naming conventions
    - errorlint         # Check error handling idioms

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance
```

### Makefile

```makefile
.PHONY: build test lint vet check

build:
	go build ./...

test:
	go test -race -count=1 ./...

lint:
	golangci-lint run

vet:
	go vet ./...
	staticcheck ./...

check: vet lint test

cover:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
```

## When to Use Third-Party Packages

Use the stdlib unless:
- The stdlib genuinely lacks the capability (e.g., database drivers, protocol buffers)
- A well-maintained package provides significantly better ergonomics for a complex domain (e.g., `sqlc` for SQL, `chi` for routing in complex APIs)
- The package is from the Go team's extended ecosystem (`golang.org/x/...`)

Respected packages in the ecosystem:
- **Router**: `net/http` (Go 1.22+ patterns), `chi` for complex routing
- **SQL**: `sqlc`, `pgx`, `database/sql` with driver
- **Testing**: `go-cmp`, `testify` (use sparingly — stdlib is usually enough)
- **CLI**: `cobra`, `kong`
- **Config**: `envconfig`, `viper`
- **Observability**: `prometheus/client_golang`, `opentelemetry-go`
- **Concurrency**: `golang.org/x/sync/errgroup`, `golang.org/x/sync/semaphore`
