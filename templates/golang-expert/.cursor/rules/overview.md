# Go Expert

Guidelines for principal-level Go engineering. Idiomatic Go, production systems, and deep runtime knowledge.

## Scope

This ruleset applies to:
- HTTP services and gRPC servers
- CLI tools and system utilities
- Libraries and shared packages
- Distributed systems and microservices
- Data pipelines and stream processing
- Infrastructure tooling and platform code

## Core Philosophy

Go is a language of restraint. The best Go code is boring Go code.

- **Simplicity is the highest virtue.** If a junior engineer can't read it, it's too clever.
- **The standard library is your first dependency.** Reach for third-party packages only when the stdlib genuinely falls short.
- **Errors are values, not exceptions.** Handle them explicitly at every call site.
- **Concurrency is a tool, not a default.** Don't use goroutines because you can — use them because the problem demands it.
- **Interfaces are discovered, not designed.** Accept interfaces, return structs.
- **If you don't know, say you don't know.** Guessing at behavior you haven't verified is worse than admitting uncertainty.

## Key Principles

### 1. Effective Go Is the Baseline

The official [Effective Go](https://go.dev/doc/effective_go) document and the [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) wiki are not suggestions — they are the floor. Everything in this guide builds on top of those foundations.

### 2. Package Design

```go
// A package should have a single, clear purpose.
// The package name IS the documentation.

// Good: package names that describe what they do
package httputil   // HTTP utility functions
package authz      // Authorization logic
package sqlmigrate // SQL migration runner

// Bad: package names that describe nothing
package util       // Util of what?
package common     // Common to whom?
package helpers    // Helping with what?
package base       // Base of what?
```

### 3. Accept Interfaces, Return Structs

```go
// Good: Accept the narrowest interface that satisfies the need
func ProcessRecords(r io.Reader) error { ... }

// Good: Return concrete types — let callers decide abstraction
func NewServer(cfg Config) *Server { ... }

// Bad: Returning an interface hides information and prevents extension
func NewServer(cfg Config) ServerInterface { ... }

// Bad: Accepting a concrete type when only one method is needed
func ProcessRecords(f *os.File) error { ... }
```

### 4. Zero Values Are Useful

```go
// Design types so zero values are valid and usable
type Buffer struct {
    buf  []byte
    // No constructor needed — zero value is an empty, ready-to-use buffer
}

// sync.Mutex zero value is an unlocked mutex — no Init() needed
var mu sync.Mutex

// bytes.Buffer zero value is an empty buffer ready for writes
var buf bytes.Buffer
buf.WriteString("hello")
```

### 5. Error Handling Is Not Boilerplate

```go
// Every error check is a conscious decision about what happens next.
// If you find yourself writing the same error handling repeatedly,
// the API design needs work — not the error handling.

// Good: Add context at every level
result, err := db.QueryContext(ctx, query, args...)
if err != nil {
    return fmt.Errorf("querying users by email %q: %w", email, err)
}
```

## Project Structure

```
project/
├── cmd/                    # Main applications
│   └── myapp/
│       └── main.go         # Minimal — wiring only
├── internal/               # Private application code
│   ├── domain/             # Core business types and logic
│   ├── service/            # Application services / use cases
│   ├── repository/         # Data access implementations
│   ├── handler/            # HTTP/gRPC handlers
│   └── platform/           # Infrastructure concerns (logging, metrics, config)
├── pkg/                    # Public library code (use sparingly)
├── api/                    # API definitions (OpenAPI, protobuf)
├── migrations/             # Database migrations
├── testdata/               # Test fixtures
├── go.mod
├── go.sum
└── Makefile
```

### Layout Rules

- `cmd/` contains only `main.go` files that wire dependencies and call `run()`
- `internal/` is your private code — the compiler enforces this boundary
- `pkg/` is for genuinely reusable library code intended for other projects — most projects don't need it
- Never put business logic in `cmd/` or `handler/`
- Co-locate tests with the code they test: `foo.go` and `foo_test.go` in the same package

## Definition of Done

A Go feature is complete when:
- [ ] `go vet ./...` reports zero issues
- [ ] `staticcheck ./...` reports zero issues
- [ ] `golangci-lint run` passes with the project's config
- [ ] `go test -race ./...` passes with no race conditions
- [ ] Test coverage covers meaningful behavior (not just lines)
- [ ] Error paths are tested, not just happy paths
- [ ] Documentation comments on all exported identifiers
- [ ] No `TODO` or `FIXME` without an associated issue
- [ ] Context propagation is correct (no `context.Background()` in request paths)
- [ ] Resource cleanup verified (deferred closes, connection pools)
