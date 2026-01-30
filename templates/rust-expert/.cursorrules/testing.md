# Rust Testing

Rust has testing built into the language and toolchain. `cargo test` runs unit tests, integration tests, and doc tests in one command.

## Unit Tests

### Module-Level Tests

```rust
// Tests live in the same file as the code they test
pub fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn freezing_point() {
        assert!((celsius_to_fahrenheit(0.0) - 32.0).abs() < f64::EPSILON);
    }

    #[test]
    fn boiling_point() {
        assert!((celsius_to_fahrenheit(100.0) - 212.0).abs() < f64::EPSILON);
    }

    #[test]
    fn negative_temperature() {
        assert!((celsius_to_fahrenheit(-40.0) - -40.0).abs() < f64::EPSILON);
    }
}
```

### Testing Error Cases

```rust
#[test]
fn parse_invalid_input_returns_error() {
    let result = parse_config("not valid toml");
    assert!(result.is_err());

    let err = result.unwrap_err();
    assert!(err.to_string().contains("expected"));
}

#[test]
fn empty_name_fails_validation() {
    let input = CreateUserInput { name: "".into(), email: "a@b.com".into() };
    let result = validate_user(&input);

    assert!(matches!(result, Err(ValidationError::EmptyField { field }) if field == "name"));
}

// Testing that something panics
#[test]
#[should_panic(expected = "index out of bounds")]
fn panics_on_out_of_bounds() {
    let v = vec![1, 2, 3];
    let _ = v[10];
}
```

### Test Organization

```rust
// #[cfg(test)] ensures test code is never compiled into release builds
#[cfg(test)]
mod tests {
    use super::*;

    // Shared test fixtures
    fn sample_user() -> User {
        User {
            id: UserId::new("test-123"),
            name: "Alice".into(),
            email: "alice@example.com".into(),
        }
    }

    // Group related tests with nested modules
    mod validation {
        use super::*;

        #[test]
        fn rejects_empty_name() { ... }

        #[test]
        fn rejects_invalid_email() { ... }
    }

    mod serialization {
        use super::*;

        #[test]
        fn round_trips_through_json() { ... }
    }
}
```

## Integration Tests

```rust
// tests/api_test.rs — separate compilation unit, tests public API only
use my_crate::{Config, Server};

#[test]
fn server_responds_to_health_check() {
    let config = Config::default();
    let server = Server::new(config);

    let response = server.handle_request("/healthz");

    assert_eq!(response.status(), 200);
    assert_eq!(response.body(), r#"{"status":"ok"}"#);
}
```

## Async Tests

```rust
#[tokio::test]
async fn fetches_user_by_id() {
    let db = setup_test_db().await;
    let repo = UserRepo::new(db);

    let user = repo.find_by_id("123").await.unwrap();

    assert_eq!(user.name, "Alice");
}

// With custom runtime config
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
async fn concurrent_operations() {
    // ...
}
```

## Property-Based Testing

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn parse_never_panics(s in "\\PC*") {
        // Whatever string we throw at parse, it must not panic
        let _ = parse_input(&s);
    }

    #[test]
    fn serialization_round_trips(
        name in "[a-zA-Z]{1,50}",
        age in 0u32..150,
    ) {
        let user = User { name, age };
        let json = serde_json::to_string(&user).unwrap();
        let decoded: User = serde_json::from_str(&json).unwrap();
        assert_eq!(user, decoded);
    }
}
```

## Doc Tests

```rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// use my_crate::add;
///
/// assert_eq!(add(2, 3), 5);
/// assert_eq!(add(-1, 1), 0);
/// ```
///
/// # Panics
///
/// Panics if the result overflows.
///
/// ```should_panic
/// use my_crate::add;
///
/// add(i64::MAX, 1); // Overflow!
/// ```
pub fn add(a: i64, b: i64) -> i64 {
    a.checked_add(b).expect("overflow")
}

// Doc tests are compiled and run — they're both documentation AND tests.
// They verify your examples actually work.
```

## Mocking and Test Doubles

```rust
// Prefer trait-based dependency injection over mocking frameworks

// Define trait at the consumer
trait Clock {
    fn now(&self) -> DateTime<Utc>;
}

// Production implementation
struct SystemClock;
impl Clock for SystemClock {
    fn now(&self) -> DateTime<Utc> { Utc::now() }
}

// Test implementation — deterministic
struct FakeClock(DateTime<Utc>);
impl Clock for FakeClock {
    fn now(&self) -> DateTime<Utc> { self.0 }
}

#[test]
fn token_expires_after_one_hour() {
    let fixed_time = Utc.with_ymd_and_hms(2025, 1, 1, 12, 0, 0).unwrap();
    let clock = FakeClock(fixed_time);
    let token = generate_token(&clock);

    let check_time = fixed_time + Duration::hours(2);
    assert!(token.is_expired_at(check_time));
}

// When you do need a mocking library: mockall
#[automock]
trait Database {
    fn get(&self, key: &str) -> Option<String>;
}

#[test]
fn returns_cached_value() {
    let mut mock = MockDatabase::new();
    mock.expect_get()
        .with(eq("user:123"))
        .returning(|_| Some("Alice".into()));

    let service = Service::new(mock);
    assert_eq!(service.get_user("123"), Some("Alice".into()));
}
```

## Benchmarks

```rust
// Using criterion (de facto standard)
// benches/my_benchmark.rs
use criterion::{criterion_group, criterion_main, Criterion, black_box};

fn bench_parse(c: &mut Criterion) {
    let input = include_str!("../testdata/large_input.txt");

    c.bench_function("parse_large_input", |b| {
        b.iter(|| parse(black_box(input)))
    });
}

fn bench_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("serialization");
    let data = generate_test_data();

    group.bench_function("json", |b| {
        b.iter(|| serde_json::to_vec(black_box(&data)))
    });

    group.bench_function("bincode", |b| {
        b.iter(|| bincode::serialize(black_box(&data)))
    });

    group.finish();
}

criterion_group!(benches, bench_parse, bench_comparison);
criterion_main!(benches);
```

## Test Anti-Patterns

```rust
// Never: Tests that depend on execution order
// Each test runs in its own thread — no shared mutable state

// Never: Ignoring tests instead of fixing them
#[ignore] // Why? For how long? File an issue.

// Never: Testing private internals through hacks
// If you can't test it through the public API, the design needs work

// Never: Assertions without messages in complex tests
assert!(result.is_ok()); // What was the input? What was the error?
// Better:
assert!(result.is_ok(), "expected Ok for input {input:?}, got {result:?}");

// Never: Flaky tests
// Flaky = broken. Fix the race condition or the timing dependency.
// Use deterministic clocks, seeded RNGs, and proper synchronization.
```
