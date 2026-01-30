# Rust Expert

Guidelines for principal-level Rust engineering. Ownership, zero-cost abstractions, and fearless concurrency — wielded with precision.

## Scope

This ruleset applies to:
- Systems programming and embedded targets
- Web services and async runtimes (Tokio, async-std)
- CLI tools and developer utilities
- Libraries and crates published to crates.io
- WebAssembly targets
- FFI and interop with C/C++
- Performance-critical applications

## Core Philosophy

Rust gives you power without sacrificing safety. The compiler is your closest collaborator — work with it, not against it.

- **If it compiles, it's probably correct.** The borrow checker isn't an obstacle — it's catching bugs that would have been CVEs in another language. Trust it.
- **Zero-cost abstractions are the point.** You should never have to choose between expressiveness and performance. If the abstraction has runtime cost, question whether it's the right abstraction.
- **Make illegal states unrepresentable.** Use the type system to encode invariants. If a state shouldn't exist, make it impossible to construct.
- **Explicit over implicit.** Lifetimes, ownership, error handling — Rust surfaces what other languages hide. This is a feature, not a flaw.
- **Unsafe is a scalpel, not a sledgehammer.** Every `unsafe` block is a proof obligation. If you can't explain exactly why it's sound, don't write it.
- **If you don't know, say so.** The Rust ecosystem is vast and evolving. Admitting uncertainty is better than guessing wrong about soundness.

## Key Principles

### 1. Ownership Is the Architecture

Ownership isn't just memory management — it's your design tool:
- Who owns this data? Who borrows it? For how long?
- These questions force you to design clear APIs with explicit lifetimes and responsibilities
- If you're fighting the borrow checker, the design likely needs rethinking — not an `unsafe` escape hatch

### 2. Types Encode Invariants

```rust
// Make illegal states unrepresentable
// Bad: bool flags that can be inconsistent
struct Connection {
    is_connected: bool,
    is_authenticated: bool, // Can this be true if is_connected is false?
}

// Good: State machine as an enum
enum Connection {
    Disconnected,
    Connected(TcpStream),
    Authenticated { stream: TcpStream, token: AuthToken },
}
// It's impossible to be Authenticated without a stream
```

### 3. Error Handling Is Explicit

```rust
// Rust has no exceptions. Result and Option are the tools.
// The ? operator is syntactic sugar, not an excuse to ignore errors.

fn load_config(path: &Path) -> Result<Config, ConfigError> {
    let contents = fs::read_to_string(path)
        .map_err(|e| ConfigError::ReadFailed { path: path.to_owned(), source: e })?;
    let config: Config = toml::from_str(&contents)
        .map_err(|e| ConfigError::ParseFailed { source: e })?;
    config.validate()?;
    Ok(config)
}
```

### 4. Clippy Is Non-Negotiable

```bash
# In CI, always:
cargo clippy -- -D warnings
# Clippy catches real bugs, not just style nits. Treat warnings as errors.
```

## Project Structure

```
my-project/
├── Cargo.toml              # Workspace or package manifest
├── Cargo.lock              # Committed for binaries, not for libraries
├── src/
│   ├── main.rs             # Binary entry point (or lib.rs for libraries)
│   ├── lib.rs              # Library root — public API surface
│   ├── config.rs           # Configuration loading and validation
│   ├── error.rs            # Error types for this crate
│   └── domain/             # Core business logic modules
│       ├── mod.rs
│       └── ...
├── tests/                  # Integration tests (separate compilation unit)
│   └── integration_test.rs
├── benches/                # Benchmarks
│   └── benchmark.rs
├── examples/               # Runnable examples
│   └── basic_usage.rs
└── build.rs                # Build script (if needed)
```

### Workspace Layout (Multi-Crate)

```
workspace/
├── Cargo.toml              # [workspace] members
├── crates/
│   ├── core/               # Domain logic — no IO, no async
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── api/                # HTTP handlers, routes
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── db/                 # Database access
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   └── cli/                # Binary entry point
│       ├── Cargo.toml
│       └── src/main.rs
```

### Layout Rules

- `lib.rs` defines the public API — only `pub` items here are your contract
- `mod.rs` or file-per-module — be consistent within a project
- Integration tests in `tests/` are separate compilation units — they test your public API
- `Cargo.lock` is committed for binaries and applications, not for libraries
- Feature flags in `Cargo.toml` must be additive — enabling a feature must not break existing code

## Definition of Done

A Rust feature is complete when:
- [ ] `cargo build` compiles with zero warnings
- [ ] `cargo clippy -- -D warnings` passes
- [ ] `cargo test` passes (including doc tests)
- [ ] `cargo fmt -- --check` passes
- [ ] No `unwrap()` or `expect()` in library code without justification
- [ ] All `unsafe` blocks have `// SAFETY:` comments explaining the invariants
- [ ] Error types are meaningful and implement `std::error::Error`
- [ ] Public API has doc comments with examples
- [ ] No unnecessary allocations in hot paths
- [ ] `cargo deny check` passes (license and advisory audit)
