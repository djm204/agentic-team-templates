# Rust Ecosystem and Tooling

The Rust ecosystem is mature and opinionated. The toolchain is best-in-class. Know the tools and the community-standard crates.

## Cargo

### Cargo.toml Best Practices

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"
rust-version = "1.75"        # Minimum supported Rust version (MSRV)
description = "A brief description"
license = "MIT OR Apache-2.0"
repository = "https://github.com/user/repo"

[dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
proptest = "1"
tempfile = "3"

[profile.release]
lto = true          # Link-time optimization
codegen-units = 1   # Slower compile, better optimization
strip = true        # Strip debug symbols from binary

[profile.dev]
opt-level = 0       # Fast compile for development

# Feature flags must be additive
[features]
default = []
metrics = ["prometheus"]
tracing = ["tracing-subscriber", "tracing-opentelemetry"]
```

### Workspace Management

```toml
# Root Cargo.toml
[workspace]
members = ["crates/*"]
resolver = "2"

# Share dependencies across workspace
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1"

# In member Cargo.toml:
[dependencies]
serde = { workspace = true }
tokio = { workspace = true }
```

### Essential Cargo Commands

```bash
cargo build --release          # Optimized build
cargo test -- --nocapture      # Show println! output in tests
cargo doc --open               # Build and open docs
cargo tree                     # Dependency tree
cargo tree -d                  # Show duplicate dependencies
cargo update                   # Update Cargo.lock to latest compatible
cargo audit                    # Check for known vulnerabilities
cargo deny check               # License and advisory checks
cargo expand                   # Show macro expansion
cargo outdated                 # Show outdated dependencies
```

## Linting and Formatting

### Clippy Configuration

```toml
# clippy.toml or .clippy.toml
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 7
type-complexity-threshold = 250
```

```rust
// In lib.rs or main.rs — project-wide lint configuration
#![warn(clippy::all, clippy::pedantic)]
#![allow(clippy::module_name_repetitions)] // Allow if your API style needs it
#![deny(clippy::unwrap_used)]             // No unwrap in library code
#![deny(unsafe_code)]                      // Deny unsafe unless explicitly needed

// Per-module overrides when justified
#[allow(clippy::cast_possible_truncation)]
// Justification: value is guaranteed < 256 by the protocol spec
fn protocol_byte(value: u32) -> u8 {
    value as u8
}
```

### rustfmt

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

## Essential Crates

### Serialization
- **serde** + **serde_json** — the serialization framework, period
- **toml** — config files
- **bincode** — compact binary format

### Async Runtime
- **tokio** — the dominant async runtime (multi-threaded, work-stealing)
- **async-std** — alternative, closer to std API

### Web
- **axum** — ergonomic web framework built on Tower and Hyper
- **reqwest** — HTTP client
- **tonic** — gRPC

### Database
- **sqlx** — compile-time checked SQL queries
- **diesel** — ORM with type-safe query builder
- **sea-orm** — async ORM built on sqlx

### Error Handling
- **thiserror** — derive Error for library error types
- **anyhow** — flexible error handling for applications

### CLI
- **clap** — argument parsing (derive or builder API)

### Observability
- **tracing** — structured, async-aware instrumentation
- **metrics** — application metrics
- **opentelemetry** — distributed tracing

### Testing
- **proptest** — property-based testing
- **criterion** — statistical benchmarking
- **mockall** — mocking framework
- **wiremock** — HTTP mocking for integration tests
- **tempfile** — temporary files and directories for tests
- **insta** — snapshot testing

## CI/CD

### GitHub Actions

```yaml
name: CI

on: [push, pull_request]

env:
  CARGO_TERM_COLOR: always
  RUSTFLAGS: "-Dwarnings"

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy
      - uses: Swatinem/rust-cache@v2

      - run: cargo fmt -- --check
      - run: cargo clippy --all-targets --all-features
      - run: cargo test --all-features
      - run: cargo doc --no-deps --all-features

  # Miri for crates with unsafe code
  miri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
        with:
          components: miri
      - run: cargo +nightly miri test

  # Security audit
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustsec/audit-check@v2
```

### Makefile

```makefile
.PHONY: check test lint fmt doc

check: fmt lint test

fmt:
	cargo fmt -- --check

lint:
	cargo clippy --all-targets --all-features -- -D warnings

test:
	cargo test --all-features

doc:
	cargo doc --no-deps --all-features --open

audit:
	cargo audit
	cargo deny check

bench:
	cargo bench

coverage:
	cargo tarpaulin --out Html --output-dir target/coverage
```

## Documentation

```rust
//! # My Crate
//!
//! `my_crate` provides utilities for processing data efficiently.
//!
//! ## Quick Start
//!
//! ```rust
//! use my_crate::process;
//!
//! let result = process("input data")?;
//! println!("{result}");
//! # Ok::<(), my_crate::Error>(())
//! ```

/// Processes the input data and returns a formatted result.
///
/// # Arguments
///
/// * `input` - A string slice containing the raw data
///
/// # Errors
///
/// Returns [`Error::InvalidInput`] if the input is malformed.
///
/// # Examples
///
/// ```
/// use my_crate::process;
///
/// let output = process("valid input").unwrap();
/// assert_eq!(output, "processed: valid input");
/// ```
pub fn process(input: &str) -> Result<String, Error> {
    // ...
}

// Document panic conditions
/// # Panics
///
/// Panics if `divisor` is zero.
pub fn divide(a: i64, divisor: i64) -> i64 {
    assert_ne!(divisor, 0, "divisor must be non-zero");
    a / divisor
}

// Document safety requirements for unsafe functions
/// # Safety
///
/// - `ptr` must be valid for reads of `len` bytes
/// - `ptr` must be properly aligned for `T`
/// - The memory referenced must not be mutated during the lifetime of the returned slice
pub unsafe fn from_raw_parts<'a, T>(ptr: *const T, len: usize) -> &'a [T] {
    std::slice::from_raw_parts(ptr, len)
}
```

## Dependency Hygiene

- **Audit regularly**: `cargo audit` for security advisories
- **Check licenses**: `cargo deny check licenses`
- **Minimize dependencies**: Every dependency is attack surface and compile time
- **Pin workspace deps**: Use `[workspace.dependencies]` for consistency
- **Review before adding**: Check maintenance status, download counts, and bus factor
- **Feature flags**: Only enable features you actually use
