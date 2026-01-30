# Go Interfaces and Type Design

Go's type system is intentionally simple. Interfaces are implicit. Composition replaces inheritance. The goal is clarity, not cleverness.

## Interface Design

### Keep Interfaces Small

```go
// Good: Single-method interfaces are the most powerful abstraction in Go
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

// Compose small interfaces into larger ones when needed
type ReadWriter interface {
    Reader
    Writer
}

// Bad: Large interfaces that force implementers to satisfy methods they don't need
type Repository interface {
    Create(ctx context.Context, entity Entity) error
    GetByID(ctx context.Context, id string) (*Entity, error)
    Update(ctx context.Context, entity Entity) error
    Delete(ctx context.Context, id string) error
    List(ctx context.Context, filter Filter) ([]Entity, error)
    Count(ctx context.Context, filter Filter) (int, error)
    // 6 methods — any mock must implement all 6
}

// Better: Separate interfaces by consumer need
type EntityReader interface {
    GetByID(ctx context.Context, id string) (*Entity, error)
}

type EntityWriter interface {
    Create(ctx context.Context, entity Entity) error
    Update(ctx context.Context, entity Entity) error
}
```

### Define Interfaces at the Consumer, Not the Producer

```go
// Good: The consumer defines what it needs
// In package "handler":
type UserFinder interface {
    FindByID(ctx context.Context, id string) (*User, error)
}

type Handler struct {
    users UserFinder // Only needs one method
}

// In package "postgres":
// *UserRepo satisfies handler.UserFinder implicitly
type UserRepo struct { db *sql.DB }

func (r *UserRepo) FindByID(ctx context.Context, id string) (*User, error) { ... }
func (r *UserRepo) Create(ctx context.Context, u *User) error { ... }
func (r *UserRepo) Delete(ctx context.Context, id string) error { ... }

// Bad: Producer defines an interface and forces consumers to accept all of it
// package "postgres"
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, u *User) error
    Delete(ctx context.Context, id string) error
}
```

### Interface Naming

```go
// Single-method interfaces: method name + "er"
type Reader interface { Read(p []byte) (int, error) }
type Closer interface { Close() error }
type Stringer interface { String() string }
type Handler interface { ServeHTTP(ResponseWriter, *Request) }

// Multi-method interfaces: descriptive noun
type ReadCloser interface {
    Reader
    Closer
}
```

## Struct Design

### Functional Options

```go
// For constructors with many optional parameters
type Server struct {
    addr         string
    readTimeout  time.Duration
    writeTimeout time.Duration
    logger       *slog.Logger
}

type Option func(*Server)

func WithReadTimeout(d time.Duration) Option {
    return func(s *Server) { s.readTimeout = d }
}

func WithWriteTimeout(d time.Duration) Option {
    return func(s *Server) { s.writeTimeout = d }
}

func WithLogger(l *slog.Logger) Option {
    return func(s *Server) { s.logger = l }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{
        addr:         addr,
        readTimeout:  30 * time.Second, // Sensible defaults
        writeTimeout: 30 * time.Second,
        logger:       slog.Default(),
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
srv := NewServer(":8080",
    WithReadTimeout(10*time.Second),
    WithLogger(logger),
)
```

### Embedding for Composition

```go
// Good: Embed to compose behavior
type LoggingMiddleware struct {
    next   http.Handler
    logger *slog.Logger
}

// Good: Embed mutex to protect struct fields
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]string
}

// Bad: Embedding to "inherit" — Go doesn't have inheritance
type Animal struct { Name string }
type Dog struct {
    Animal // This is composition, not inheritance — don't treat it as inheritance
}
```

### Method Receivers

```go
// Use pointer receivers when:
// - The method mutates the receiver
// - The struct is large (avoid copying)
// - Consistency: if any method needs a pointer, use pointers for all
func (s *Server) Start() error { ... }

// Use value receivers when:
// - The struct is small and immutable (time.Time, etc.)
// - The method doesn't modify the receiver
func (p Point) Distance(other Point) float64 { ... }

// Never mix pointer and value receivers on the same type
// Pick one and be consistent
```

## Type Aliases and Definitions

```go
// Type definitions create a new, distinct type
type UserID string
type Celsius float64

// Prevents mixing incompatible values
func GetUser(id UserID) (*User, error) { ... }
// GetUser("raw-string") won't compile — must be UserID("raw-string")

// Type aliases are for migration, not abstraction
type OldName = NewName // Both are the same type — useful for gradual refactors
```

## Generics (Go 1.18+)

```go
// Use generics when the logic is identical across types
// and the type parameter adds real value

// Good: Generic data structures and algorithms
func Map[T, U any](s []T, f func(T) U) []U {
    result := make([]U, len(s))
    for i, v := range s {
        result[i] = f(v)
    }
    return result
}

func Filter[T any](s []T, predicate func(T) bool) []T {
    var result []T
    for _, v := range s {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

// Good: Type constraints for compile-time safety
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 |
    ~float32 | ~float64 | ~string
}

func Max[T Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}

// Bad: Generics for the sake of generics
// If there's only one concrete type, don't make it generic
// If an interface works, prefer the interface
```

## Anti-Patterns

```go
// Never: Empty interface (any) as a parameter when the type is known
func Process(data any) { ... } // What is data? No one knows without reading the implementation.

// Never: Interface pollution — defining interfaces you don't consume
// If only one type implements the interface, you probably don't need the interface

// Never: Returning interfaces from constructors (hides information)
func New() MyInterface { return &myImpl{} } // BAD — return *myImpl

// Never: Stuttering — the package name is part of the identifier
package user
type UserService struct{} // user.UserService stutters
type Service struct{}     // user.Service reads cleanly
```
