# Rust Error Handling

Rust has no exceptions. `Result<T, E>` and `Option<T>` are the error handling primitives. The `?` operator propagates errors ergonomically, but every error path is still an explicit decision.

## Custom Error Types

### Using thiserror (Libraries)

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("configuration error: {message}")]
    Config { message: String },

    #[error("database query failed")]
    Database(#[from] sqlx::Error),

    #[error("request to {url} failed")]
    Http {
        url: String,
        #[source]
        source: reqwest::Error,
    },

    #[error("record not found: {entity} with id {id}")]
    NotFound { entity: &'static str, id: String },

    #[error("validation failed: {0}")]
    Validation(String),
}
```

### Using anyhow (Applications)

```rust
use anyhow::{Context, Result, bail, ensure};

fn load_config(path: &Path) -> Result<Config> {
    let contents = fs::read_to_string(path)
        .with_context(|| format!("reading config from {}", path.display()))?;

    let config: Config = toml::from_str(&contents)
        .context("parsing config TOML")?;

    ensure!(!config.database_url.is_empty(), "database_url must not be empty");

    if config.port == 0 {
        bail!("port must be non-zero");
    }

    Ok(config)
}
```

### When to Use Which

- **thiserror** — libraries, reusable crates, when callers need to match on error variants
- **anyhow** — applications, binaries, when you just need to propagate context up to main
- **Manual impl** — when you need full control or minimal dependencies

### Manual Error Implementation

```rust
#[derive(Debug)]
pub enum StorageError {
    Io(std::io::Error),
    Serialization(serde_json::Error),
    NotFound { key: String },
}

impl fmt::Display for StorageError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(e) => write!(f, "storage I/O error: {e}"),
            Self::Serialization(e) => write!(f, "serialization error: {e}"),
            Self::NotFound { key } => write!(f, "key not found: {key}"),
        }
    }
}

impl std::error::Error for StorageError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::Io(e) => Some(e),
            Self::Serialization(e) => Some(e),
            Self::NotFound { .. } => None,
        }
    }
}

impl From<std::io::Error> for StorageError {
    fn from(e: std::io::Error) -> Self {
        Self::Io(e)
    }
}
```

## The ? Operator

```rust
// ? is sugar for early return on Err/None
// It calls From::from() on the error, enabling automatic conversion

fn process(path: &Path) -> Result<Data, AppError> {
    let raw = fs::read(path)?;           // io::Error -> AppError via From
    let parsed = serde_json::from_slice(&raw)?;  // serde::Error -> AppError via From
    Ok(parsed)
}

// ? works with Option too
fn first_word(s: &str) -> Option<&str> {
    let end = s.find(' ')?; // Returns None if no space
    Some(&s[..end])
}
```

## Option Patterns

```rust
// Prefer combinators over match when they're clearer
let name = user.name.as_deref().unwrap_or("anonymous");

let parsed = input
    .strip_prefix("v")
    .and_then(|s| s.parse::<u32>().ok());

// Use match when you need complex logic per variant
match config.log_level {
    Some(level) => logger.set_level(level),
    None => logger.set_level(Level::Info),
}

// Use if let for single-variant checks
if let Some(token) = headers.get("Authorization") {
    authenticate(token)?;
}
```

## Panic Policy

```rust
// Panics are for bugs, not for expected error conditions.

// Acceptable: debug assertions
debug_assert!(index < len, "index {index} out of bounds for length {len}");

// Acceptable: unreachable code paths that truly can't happen
match state {
    State::Ready => process(),
    State::Done => return,
    // If we've exhaustively handled all variants and the compiler
    // still wants a branch, use unreachable!() — but only when
    // you can prove it's unreachable.
}

// Acceptable: unwrap() in tests
#[cfg(test)]
fn setup() -> TestDb {
    TestDb::new().unwrap() // Fine in tests
}

// Never acceptable: unwrap() in library code without a VERY good reason
// Never acceptable: panic!() for user input validation
// Never acceptable: todo!() in shipped code
```

## Anti-Patterns

```rust
// Never: Silencing errors
let _ = write!(f, "data"); // The write might fail — handle it or explain why not

// Never: unwrap() with no context
let config = load_config().unwrap(); // What failed? Where? Why?
// At minimum:
let config = load_config().expect("loading config from default path");

// Never: Stringly-typed errors
fn process() -> Result<(), String> { // Don't use String as an error type
    Err("something went wrong".into())
}

// Never: Catching panics as error handling
let result = std::panic::catch_unwind(|| dangerous_code()); // This is not error handling

// Never: .ok() to discard error information without justification
let maybe = fallible_operation().ok(); // Why is the error not important?
```
