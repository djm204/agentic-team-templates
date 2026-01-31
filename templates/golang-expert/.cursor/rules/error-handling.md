# Go Error Handling

Errors in Go are values. They are the primary control flow mechanism for failure cases. Treat them with the same rigor as your business logic.

## Fundamental Rules

### Always Handle Errors

```go
// Good: Every error is handled
f, err := os.Open(filename)
if err != nil {
    return fmt.Errorf("opening config file: %w", err)
}
defer f.Close()

// Bad: Silently discarding errors
f, _ := os.Open(filename) // What happens when this fails?

// Bad: Logging and continuing as if nothing happened
f, err := os.Open(filename)
if err != nil {
    log.Println(err) // Then what? f is nil. You'll panic below.
}
```

### Wrap With Context Using %w

```go
// Good: Each layer adds context about what it was doing
func (s *UserService) GetByEmail(ctx context.Context, email string) (*User, error) {
    user, err := s.repo.FindByEmail(ctx, email)
    if err != nil {
        return nil, fmt.Errorf("getting user by email %q: %w", email, err)
    }
    return user, nil
}

// The error chain reads like a stack trace:
// "getting user by email "bob@example.com": querying users table: sql: connection refused"

// Bad: Wrapping without adding useful context
if err != nil {
    return fmt.Errorf("error: %w", err) // "error:" adds nothing
}

// Bad: Wrapping with redundant "failed to" prefix
if err != nil {
    return fmt.Errorf("failed to get user: %w", err) // "failed to" is implied — it's an error
}
```

### Sentinel Errors and Custom Types

```go
// Use sentinel errors for conditions callers need to check
var (
    ErrNotFound      = errors.New("not found")
    ErrAlreadyExists = errors.New("already exists")
    ErrUnauthorized  = errors.New("unauthorized")
)

// Check with errors.Is
if errors.Is(err, ErrNotFound) {
    http.Error(w, "not found", http.StatusNotFound)
    return
}

// Use custom error types when you need to carry structured data
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}

// Check with errors.As
var ve *ValidationError
if errors.As(err, &ve) {
    // Access ve.Field, ve.Message
}
```

### When to Use %w vs %v

```go
// Use %w when callers should be able to unwrap and inspect the cause
return fmt.Errorf("querying database: %w", err)

// Use %v when you want to break the error chain
// (hide implementation details across API boundaries)
return fmt.Errorf("internal error: %v", err)
```

## Error Handling Patterns

### Errors in Main

```go
func main() {
    if err := run(); err != nil {
        fmt.Fprintf(os.Stderr, "error: %v\n", err)
        os.Exit(1)
    }
}

func run() error {
    cfg, err := loadConfig()
    if err != nil {
        return fmt.Errorf("loading config: %w", err)
    }
    // ...
    return nil
}
```

### Errors in HTTP Handlers

```go
// Define an application handler that returns errors
type appHandler func(w http.ResponseWriter, r *http.Request) error

func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    if err := fn(w, r); err != nil {
        var ve *ValidationError
        switch {
        case errors.As(err, &ve):
            http.Error(w, ve.Message, http.StatusBadRequest)
        case errors.Is(err, ErrNotFound):
            http.Error(w, "not found", http.StatusNotFound)
        case errors.Is(err, ErrUnauthorized):
            http.Error(w, "unauthorized", http.StatusUnauthorized)
        default:
            // Log the full error, return generic message to client
            slog.Error("internal error", "error", err, "path", r.URL.Path)
            http.Error(w, "internal server error", http.StatusInternalServerError)
        }
    }
}
```

### Deferred Cleanup Errors

```go
// Capture close errors from deferred calls
func writeFile(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return fmt.Errorf("creating file: %w", err)
    }
    defer func() {
        if closeErr := f.Close(); closeErr != nil && err == nil {
            err = fmt.Errorf("closing file: %w", closeErr)
        }
    }()

    if _, err := f.Write(data); err != nil {
        return fmt.Errorf("writing data: %w", err)
    }
    return nil
}
```

### Multi-Error Collection

```go
// Collect multiple errors (Go 1.20+ with errors.Join)
func validateUser(u User) error {
    var errs []error
    if u.Name == "" {
        errs = append(errs, &ValidationError{Field: "name", Message: "required"})
    }
    if u.Email == "" {
        errs = append(errs, &ValidationError{Field: "email", Message: "required"})
    }
    return errors.Join(errs...)
}
```

## Anti-Patterns

```go
// Never: panic for expected error conditions
func MustParse(s string) Config {
    // Only acceptable in init() or test helpers, never in request paths
    panic("don't do this in production code paths")
}

// Never: Checking error strings
if err.Error() == "not found" { } // Fragile — use errors.Is or errors.As

// Never: Returning both a value and an error that are both valid
// If err != nil, the other return values should be zero values

// Never: Using naked returns in functions with error handling
// Named returns for error capture in defer is the one acceptable use
```
