# Rust Expert Development Guide

Principal-level guidelines for Rust engineering. Ownership, zero-cost abstractions, and fearless concurrency — wielded with precision.

---

## Overview

This guide applies to:
- Systems programming and embedded targets
- Web services and async runtimes (Tokio, async-std)
- CLI tools and developer utilities
- Libraries and crates published to crates.io
- WebAssembly targets
- FFI and interop with C/C++

### Core Philosophy

Rust gives you power without sacrificing safety. The compiler is your closest collaborator.

- **If it compiles, it's probably correct.** The borrow checker catches bugs that would be CVEs elsewhere.
- **Zero-cost abstractions are the point.** Never choose between expressiveness and performance.
- **Make illegal states unrepresentable.** Encode invariants in the type system.
- **Explicit over implicit.** Lifetimes, ownership, error handling — surfaced, not hidden.
- **Unsafe is a scalpel, not a sledgehammer.** Every `unsafe` block is a proof obligation.
- **If you don't know, say so.** Admitting uncertainty is better than guessing about soundness.

### Project Structure

```
project/
├── Cargo.toml
├── src/
│   ├── main.rs / lib.rs
│   ├── error.rs
│   └── domain/
├── tests/              # Integration tests
├── benches/            # Benchmarks
└── examples/
```

---

## Ownership and Borrowing

### The Three Rules

1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. Either one `&mut T` OR any number of `&T` — never both

### Lifetimes

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### Smart Pointers

- `Box<T>` — heap allocation, single owner
- `Rc<T>` — reference-counted, single-threaded
- `Arc<T>` — atomic reference-counted, thread-safe
- `Cow<'_, T>` — clone-on-write, avoid allocation when possible

### Interior Mutability

- `Cell<T>` — Copy types, single-threaded, zero overhead
- `RefCell<T>` — runtime borrow checking, single-threaded
- `Mutex<T>` / `RwLock<T>` — thread-safe
- `Atomic*` — lock-free primitives

---

## Error Handling

### thiserror (Libraries)

```rust
#[derive(Debug, Error)]
pub enum AppError {
    #[error("database query failed")]
    Database(#[from] sqlx::Error),
    #[error("record not found: {entity} with id {id}")]
    NotFound { entity: &'static str, id: String },
}
```

### anyhow (Applications)

```rust
fn load_config(path: &Path) -> Result<Config> {
    let contents = fs::read_to_string(path)
        .with_context(|| format!("reading config from {}", path.display()))?;
    Ok(toml::from_str(&contents).context("parsing config")?)
}
```

### Panic Policy

Panics are for bugs, not expected errors. No `unwrap()` in library code without justification. `todo!()` never ships.

---

## Traits and Generics

### Small, Focused Traits

```rust
pub trait Validate {
    fn validate(&self) -> Result<(), ValidationError>;
}
```

### Define Interfaces at the Consumer

The consumer decides what it needs — don't force a God-trait on callers.

### Phantom Types for State Machines

```rust
struct Form<State> { data: FormData, _state: PhantomData<State> }
// Form<Unvalidated> can't call submit() — only Form<Validated> can
```

### Generics Rules

- `impl Trait` for simple bounds in function parameters
- `where` clauses for complex bounds
- Associated types when there's one implementation per Self type
- Generic parameters when multiple implementations per Self type

---

## Concurrency

### Threads

```rust
// Scoped threads (1.63+) — safe borrows from parent stack
thread::scope(|s| {
    s.spawn(|| process(&data));
});
```

### Async/Await

```rust
// Concurrent execution
let (users, posts) = tokio::join!(fetch_users(), fetch_posts());

// Timeout
tokio::select! {
    result = fetch_data() => handle(result),
    _ = tokio::time::sleep(Duration::from_secs(5)) => bail!("timeout"),
}
```

### Key Rules

- Never hold a `MutexGuard` across an `.await` point
- Never block in async context — use `spawn_blocking` for CPU work
- Use `tokio::sync::Mutex` when you must hold across awaits
- Every spawned task needs a cancellation/shutdown strategy

---

## Testing

### Table-Style Tests

```rust
#[test]
fn test_parse_age() {
    let cases = [("25", Ok(25)), ("-1", Err(..)), ("abc", Err(..))];
    for (input, expected) in cases {
        assert_eq!(parse_age(input), expected, "input: {input}");
    }
}
```

### Trait-Based Dependency Injection

```rust
trait Clock { fn now(&self) -> DateTime<Utc>; }
struct FakeClock(DateTime<Utc>);
impl Clock for FakeClock { fn now(&self) -> DateTime<Utc> { self.0 } }
```

### Property-Based Testing

```rust
proptest! {
    #[test]
    fn round_trips(name in "[a-z]{1,50}", age in 0u32..150) {
        let user = User { name, age };
        let json = serde_json::to_string(&user)?;
        let decoded: User = serde_json::from_str(&json)?;
        assert_eq!(user, decoded);
    }
}
```

### Always Run

```bash
cargo test --all-features
cargo clippy -- -D warnings
cargo +nightly miri test  # For crates with unsafe
```

---

## Performance and Unsafe

### Measure First

```bash
cargo bench
cargo flamegraph
cargo build --timings
```

### Key Patterns

- Preallocate with `Vec::with_capacity`
- Iterators over collect-then-iterate
- `Cow` for conditional allocation
- `SmallVec` for small stack-allocated collections
- `String::with_capacity` and `std::fmt::Write`

### Unsafe Rules

- Every `unsafe` block gets a `// SAFETY:` comment
- Wrap unsafe in safe abstractions with narrow interfaces
- Run Miri in CI for any crate with unsafe code
- `unsafe` doesn't fix design problems — it hides them

---

## Ecosystem and Tooling

### Essential Crates

| Domain | Crate |
|--------|-------|
| Serialization | serde, serde_json |
| Async | tokio |
| Web | axum, reqwest, tonic |
| Database | sqlx, diesel |
| Errors | thiserror, anyhow |
| CLI | clap |
| Observability | tracing, metrics |
| Testing | proptest, criterion, mockall, insta |

### CI Essentials

```bash
cargo fmt -- --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
cargo audit
cargo deny check
```

---

## Definition of Done

A Rust feature is complete when:

- [ ] `cargo build` compiles with zero warnings
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `cargo test` passes (including doc tests)
- [ ] `cargo fmt -- --check` passes
- [ ] No `unwrap()` in library code without justification
- [ ] All `unsafe` blocks have `// SAFETY:` comments
- [ ] Error types implement `std::error::Error`
- [ ] Public API has doc comments with examples
- [ ] No unnecessary allocations in hot paths
- [ ] `cargo deny check` passes
- [ ] Code reviewed and approved
