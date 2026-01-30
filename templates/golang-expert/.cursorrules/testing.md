# Go Testing

Go has testing built into the language and toolchain. No excuses. Tests are written in `_test.go` files, run with `go test`, and that's it.

## Fundamentals

### Table-Driven Tests

The standard pattern. Use it for any function with multiple input/output cases.

```go
func TestParseAge(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    int
        wantErr bool
    }{
        {name: "valid age", input: "25", want: 25},
        {name: "zero", input: "0", want: 0},
        {name: "negative", input: "-1", wantErr: true},
        {name: "non-numeric", input: "abc", wantErr: true},
        {name: "empty string", input: "", wantErr: true},
        {name: "max int boundary", input: "150", wantErr: true},
        {name: "leading zeros", input: "025", want: 25},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseAge(tt.input)
            if tt.wantErr {
                if err == nil {
                    t.Errorf("ParseAge(%q) expected error, got %d", tt.input, got)
                }
                return
            }
            if err != nil {
                t.Fatalf("ParseAge(%q) unexpected error: %v", tt.input, err)
            }
            if got != tt.want {
                t.Errorf("ParseAge(%q) = %d, want %d", tt.input, got, tt.want)
            }
        })
    }
}
```

### Test Naming

```go
// Test function: Test<FunctionName> or Test<Type>_<Method>
func TestUserService_Create(t *testing.T) { ... }

// Subtests: describe the scenario, not the expected result
t.Run("duplicate email returns ErrAlreadyExists", func(t *testing.T) { ... })
t.Run("empty name returns validation error", func(t *testing.T) { ... })

// Not:
t.Run("test1", func(t *testing.T) { ... })
t.Run("success", func(t *testing.T) { ... })
```

### Test Helpers

```go
// Use t.Helper() to mark helper functions
// so failure messages point to the caller, not the helper
func assertNoError(t *testing.T, err error) {
    t.Helper()
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
}

// Return cleanup functions for setup helpers
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db, err := sql.Open("sqlite", ":memory:")
    if err != nil {
        t.Fatalf("opening test db: %v", err)
    }
    t.Cleanup(func() { db.Close() })
    return db
}
```

### Golden Files

```go
// Use testdata/ directory for fixture files
func TestRender(t *testing.T) {
    input := readTestdata(t, "input.html")
    want := readTestdata(t, "expected_output.html")

    got, err := Render(input)
    if err != nil {
        t.Fatalf("Render: %v", err)
    }

    if diff := cmp.Diff(want, got); diff != "" {
        t.Errorf("Render mismatch (-want +got):\n%s", diff)
    }
}

func readTestdata(t *testing.T, name string) string {
    t.Helper()
    data, err := os.ReadFile(filepath.Join("testdata", name))
    if err != nil {
        t.Fatalf("reading testdata/%s: %v", name, err)
    }
    return string(data)
}
```

## Testing Patterns

### Dependency Injection via Interfaces

```go
// Define the interface at the consumer
type UserStore interface {
    GetByID(ctx context.Context, id string) (*User, error)
}

// Production implementation
type PostgresUserStore struct { db *sql.DB }

// Test implementation — simple and explicit
type fakeUserStore struct {
    users map[string]*User
    err   error
}

func (f *fakeUserStore) GetByID(_ context.Context, id string) (*User, error) {
    if f.err != nil {
        return nil, f.err
    }
    u, ok := f.users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return u, nil
}

func TestHandler_GetUser(t *testing.T) {
    store := &fakeUserStore{
        users: map[string]*User{
            "123": {ID: "123", Name: "Alice"},
        },
    }
    h := NewHandler(store)

    req := httptest.NewRequest("GET", "/users/123", nil)
    rec := httptest.NewRecorder()
    h.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Errorf("status = %d, want %d", rec.Code, http.StatusOK)
    }
}
```

### HTTP Handler Tests

```go
func TestHealthEndpoint(t *testing.T) {
    srv := NewServer(Config{})

    req := httptest.NewRequest("GET", "/healthz", nil)
    rec := httptest.NewRecorder()

    srv.ServeHTTP(rec, req)

    if rec.Code != http.StatusOK {
        t.Errorf("GET /healthz status = %d, want %d", rec.Code, http.StatusOK)
    }

    var body map[string]string
    if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
        t.Fatalf("decoding response body: %v", err)
    }
    if body["status"] != "ok" {
        t.Errorf("status = %q, want %q", body["status"], "ok")
    }
}
```

### Integration Tests with Build Tags

```go
//go:build integration

package repository_test

func TestPostgresUserRepo_Create(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test in short mode")
    }

    db := setupTestPostgres(t)
    repo := NewUserRepo(db)

    user := &User{Name: "Alice", Email: "alice@example.com"}
    err := repo.Create(context.Background(), user)
    if err != nil {
        t.Fatalf("Create: %v", err)
    }

    got, err := repo.GetByID(context.Background(), user.ID)
    if err != nil {
        t.Fatalf("GetByID: %v", err)
    }
    if got.Email != user.Email {
        t.Errorf("email = %q, want %q", got.Email, user.Email)
    }
}
```

### Testing Error Cases

```go
func TestService_Create_ValidationErrors(t *testing.T) {
    svc := NewService(newFakeRepo())

    tests := []struct {
        name  string
        input CreateInput
        want  error
    }{
        {
            name:  "empty name",
            input: CreateInput{Name: "", Email: "a@b.com"},
            want:  ErrNameRequired,
        },
        {
            name:  "invalid email",
            input: CreateInput{Name: "Alice", Email: "not-an-email"},
            want:  ErrInvalidEmail,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            _, err := svc.Create(context.Background(), tt.input)
            if !errors.Is(err, tt.want) {
                t.Errorf("Create() error = %v, want %v", err, tt.want)
            }
        })
    }
}
```

## go-cmp for Comparisons

```go
import "github.com/google/go-cmp/cmp"

func TestTransform(t *testing.T) {
    got := Transform(input)
    want := Expected{
        Name:  "Alice",
        Items: []string{"a", "b", "c"},
    }

    if diff := cmp.Diff(want, got); diff != "" {
        t.Errorf("Transform() mismatch (-want +got):\n%s", diff)
    }
}

// Ignore unexported fields or specific fields
if diff := cmp.Diff(want, got, cmpopts.IgnoreFields(User{}, "CreatedAt")); diff != "" {
    t.Errorf("mismatch (-want +got):\n%s", diff)
}
```

## Benchmarks

```go
func BenchmarkProcess(b *testing.B) {
    input := generateInput(1000)

    b.ResetTimer()
    for b.Loop() {
        Process(input)
    }
}

// Run: go test -bench=BenchmarkProcess -benchmem ./...
// Output: BenchmarkProcess-8  15234  78432 ns/op  4096 B/op  12 allocs/op
```

## Race Detection

```go
// Always run tests with race detector in CI
// go test -race ./...

// The race detector finds data races at runtime.
// It has zero false positives — every report is a real bug.
// It does NOT find all races — absence of reports doesn't prove safety.
```

## Test Anti-Patterns

```go
// Never: Tests that depend on execution order
// Each test must be independently runnable

// Never: Sleeping for synchronization
time.Sleep(500 * time.Millisecond) // Flaky — use channels, WaitGroups, or polling

// Never: Testing unexported functions directly
// Test through the public API — if you can't, the API design needs work

// Never: Excessive mocking
// If you're mocking more than one or two dependencies, the unit is too large

// Never: Ignoring the -race flag
// A test suite without -race is incomplete

// Never: t.Error when you should t.Fatal
// If subsequent code will panic on the error condition, use t.Fatal
if err != nil {
    t.Fatalf("setup failed: %v", err) // Not t.Errorf — continuing will panic
}
```
