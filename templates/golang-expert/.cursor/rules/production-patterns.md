# Go Production Patterns

Patterns for building Go services that run reliably in production.

## Application Lifecycle

### The run() Pattern

```go
func main() {
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer cancel()

    if err := run(ctx, os.Stdout, os.Args[1:]); err != nil {
        fmt.Fprintf(os.Stderr, "error: %v\n", err)
        os.Exit(1)
    }
}

func run(ctx context.Context, stdout io.Writer, args []string) error {
    cfg, err := loadConfig()
    if err != nil {
        return fmt.Errorf("loading config: %w", err)
    }

    logger := slog.New(slog.NewJSONHandler(stdout, nil))
    db, err := connectDB(ctx, cfg.DatabaseURL)
    if err != nil {
        return fmt.Errorf("connecting to database: %w", err)
    }
    defer db.Close()

    srv := NewServer(logger, db)
    httpSrv := &http.Server{
        Addr:    cfg.Addr,
        Handler: srv,
    }

    // Start server in background
    go func() {
        logger.Info("server starting", "addr", cfg.Addr)
        if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            logger.Error("server error", "error", err)
        }
    }()

    // Wait for shutdown signal
    <-ctx.Done()
    logger.Info("shutting down")

    shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    return httpSrv.Shutdown(shutdownCtx)
}
```

### Dependency Injection

```go
// Wire dependencies explicitly in main/run — no magic, no frameworks
func run(ctx context.Context) error {
    // Infrastructure
    db := connectDB(cfg.DatabaseURL)
    cache := redis.New(cfg.RedisURL)

    // Repositories
    userRepo := postgres.NewUserRepo(db)
    orderRepo := postgres.NewOrderRepo(db)

    // Services
    userSvc := service.NewUserService(userRepo, cache)
    orderSvc := service.NewOrderService(orderRepo, userSvc)

    // Handlers
    handler := handler.New(userSvc, orderSvc)

    // Server
    srv := &http.Server{Handler: handler}
    return srv.ListenAndServe()
}
```

## Configuration

```go
// Validate all configuration at startup — fail fast
type Config struct {
    Addr        string        `env:"ADDR" default:":8080"`
    DatabaseURL string        `env:"DATABASE_URL,required"`
    LogLevel    slog.Level    `env:"LOG_LEVEL" default:"info"`
    Timeout     time.Duration `env:"TIMEOUT" default:"30s"`
}

func loadConfig() (*Config, error) {
    cfg := &Config{}
    // Parse from env...

    // Validate
    if cfg.DatabaseURL == "" {
        return nil, errors.New("DATABASE_URL is required")
    }
    if cfg.Timeout <= 0 {
        return nil, errors.New("TIMEOUT must be positive")
    }
    return cfg, nil
}
```

## Health Checks

```go
func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()

    checks := map[string]error{
        "database": s.db.PingContext(ctx),
        "cache":    s.cache.Ping(ctx),
    }

    status := http.StatusOK
    result := make(map[string]string, len(checks))
    for name, err := range checks {
        if err != nil {
            status = http.StatusServiceUnavailable
            result[name] = err.Error()
        } else {
            result[name] = "ok"
        }
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(result)
}
```

## Observability

### Structured Logging

```go
// Use slog with consistent field names
logger.Info("request completed",
    "method", r.Method,
    "path", r.URL.Path,
    "status", status,
    "duration_ms", time.Since(start).Milliseconds(),
    "request_id", middleware.RequestID(r.Context()),
)

// Log levels have meaning:
// Debug: Development-only information
// Info: Normal operations worth recording
// Warn: Something unexpected but handled
// Error: Something failed and needs attention

// Never log sensitive data (passwords, tokens, PII)
// Never log at Error level for expected conditions (404, validation failures)
```

### Metrics

```go
import "github.com/prometheus/client_golang/prometheus"

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    httpRequestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal, httpRequestDuration)
}
```

## Graceful Degradation

```go
// Circuit breaker for external dependencies
type CircuitBreaker struct {
    mu          sync.Mutex
    failures    int
    threshold   int
    resetAfter  time.Duration
    lastFailure time.Time
    state       string // "closed", "open", "half-open"
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    cb.mu.Lock()
    if cb.state == "open" {
        if time.Since(cb.lastFailure) > cb.resetAfter {
            cb.state = "half-open"
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }
    }
    cb.mu.Unlock()

    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()
    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        if cb.failures >= cb.threshold {
            cb.state = "open"
        }
        return err
    }

    cb.failures = 0
    cb.state = "closed"
    return nil
}
```

## Retry with Backoff

```go
func RetryWithBackoff(ctx context.Context, maxAttempts int, base time.Duration, fn func() error) error {
    var err error
    for attempt := range maxAttempts {
        err = fn()
        if err == nil {
            return nil
        }

        if attempt == maxAttempts-1 {
            break
        }

        // Exponential backoff with jitter
        backoff := base * time.Duration(1<<uint(attempt))
        jitter := time.Duration(rand.Int64N(int64(backoff) / 2))
        wait := backoff + jitter

        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(wait):
        }
    }
    return fmt.Errorf("after %d attempts: %w", maxAttempts, err)
}
```

## Database Patterns

```go
// Repository pattern with transactions
type TxFunc func(ctx context.Context, tx *sql.Tx) error

func WithTransaction(ctx context.Context, db *sql.DB, fn TxFunc) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("beginning transaction: %w", err)
    }

    if err := fn(ctx, tx); err != nil {
        if rbErr := tx.Rollback(); rbErr != nil {
            return fmt.Errorf("rolling back: %w (original: %v)", rbErr, err)
        }
        return err
    }

    if err := tx.Commit(); err != nil {
        return fmt.Errorf("committing transaction: %w", err)
    }
    return nil
}

// Usage
err := WithTransaction(ctx, db, func(ctx context.Context, tx *sql.Tx) error {
    if err := createOrder(ctx, tx, order); err != nil {
        return err
    }
    return updateInventory(ctx, tx, order.Items)
})
```

## Anti-Patterns

```go
// Never: Global mutable state
var db *sql.DB // Package-level mutable state makes testing impossible

// Never: init() for complex initialization
func init() {
    db, _ = sql.Open(...) // Errors swallowed, untestable, order-dependent
}

// Never: Shared context.Background() in request handlers
func handler(w http.ResponseWriter, r *http.Request) {
    db.QueryContext(context.Background(), ...) // Ignores request cancellation!
    // Use r.Context() instead
}

// Never: Unbounded work queues
ch := make(chan Job) // Unbuffered or unbounded — will block or OOM
// Use bounded channels and handle backpressure explicitly
```
