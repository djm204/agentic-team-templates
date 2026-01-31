# Rust Traits and Generics

Traits are Rust's mechanism for abstraction, polymorphism, and code reuse. Combined with generics, they enable zero-cost abstractions that rival hand-written specialized code.

## Trait Design

### Small, Focused Traits

```rust
// Good: Single-purpose traits
pub trait Validate {
    fn validate(&self) -> Result<(), ValidationError>;
}

pub trait Serialize {
    fn serialize(&self, writer: &mut dyn Write) -> Result<(), SerializeError>;
}

// Bad: God trait
pub trait Entity {
    fn validate(&self) -> Result<(), Error>;
    fn serialize(&self) -> Vec<u8>;
    fn save(&self, db: &Database) -> Result<(), Error>;
    fn render(&self) -> Html;
    // Too many responsibilities — split by concern
}
```

### Extension Traits

```rust
// Add methods to existing types via extension traits
pub trait StrExt {
    fn is_blank(&self) -> bool;
    fn truncate_to(&self, max_len: usize) -> &str;
}

impl StrExt for str {
    fn is_blank(&self) -> bool {
        self.trim().is_empty()
    }

    fn truncate_to(&self, max_len: usize) -> &str {
        if self.len() <= max_len {
            self
        } else {
            // Find a char boundary to avoid panic
            let mut end = max_len;
            while !self.is_char_boundary(end) {
                end -= 1;
            }
            &self[..end]
        }
    }
}
```

### Sealed Traits

```rust
// Prevent external implementations when your trait is part of an internal contract
mod private {
    pub trait Sealed {}
}

pub trait Backend: private::Sealed {
    fn execute(&self, query: &str) -> Result<Rows>;
}

// Only types in your crate can implement Sealed, so only they can implement Backend
impl private::Sealed for PostgresBackend {}
impl Backend for PostgresBackend { ... }
```

### The Newtype Pattern

```rust
// Implement foreign traits on foreign types via newtype
struct Meters(f64);
struct Seconds(f64);

impl fmt::Display for Meters {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.2}m", self.0)
    }
}

// Also prevents mixing units at compile time
fn speed(distance: Meters, time: Seconds) -> f64 {
    distance.0 / time.0
}
// speed(Seconds(1.0), Meters(5.0)) — compile error! Arguments are swapped.
```

## Generics

### Trait Bounds

```rust
// Prefer impl Trait for simple cases
fn print_all(items: &[impl Display]) {
    for item in items {
        println!("{item}");
    }
}

// Use where clauses for complex bounds
fn merge<T, U>(left: T, right: U) -> Merged
where
    T: IntoIterator<Item = Record>,
    U: IntoIterator<Item = Record>,
    T::IntoIter: ExactSizeIterator,
{
    // ...
}

// Use explicit generic parameters when the caller needs to specify the type
fn parse<T: FromStr>(input: &str) -> Result<T, T::Err> {
    input.parse()
}
let n: i32 = parse("42")?;
let f: f64 = parse("3.14")?;
```

### Associated Types vs Generic Parameters

```rust
// Associated types: one implementation per type
trait Iterator {
    type Item; // Each iterator has exactly one Item type
    fn next(&mut self) -> Option<Self::Item>;
}

// Generic parameters: multiple implementations per type
trait Convert<T> {
    fn convert(&self) -> T;
}
// A single type can implement Convert<String>, Convert<i32>, etc.

// Rule of thumb: If there should be only one implementation
// for a given Self type, use an associated type.
```

### Phantom Types

```rust
use std::marker::PhantomData;

// Type-state pattern: encode state in the type system
struct Validated;
struct Unvalidated;

struct Form<State> {
    data: FormData,
    _state: PhantomData<State>,
}

impl Form<Unvalidated> {
    fn new(data: FormData) -> Self {
        Form { data, _state: PhantomData }
    }

    fn validate(self) -> Result<Form<Validated>, ValidationError> {
        // validation logic...
        Ok(Form { data: self.data, _state: PhantomData })
    }
}

impl Form<Validated> {
    fn submit(self) -> Result<(), SubmitError> {
        // Only validated forms can be submitted
        send(self.data)
    }
}

// Form::new(data).submit() — compile error! Must validate first.
```

## Dynamic Dispatch

```rust
// Static dispatch (monomorphization) — zero cost, larger binary
fn process(handler: impl Handler) { handler.handle(); }

// Dynamic dispatch (trait objects) — vtable indirection, smaller binary
fn process(handler: &dyn Handler) { handler.handle(); }

// Use trait objects when:
// - You need a heterogeneous collection
// - You want to reduce binary size (e.g., embedded)
// - The type is determined at runtime

// Trait object safety: a trait is object-safe if:
// - No methods return Self
// - No methods have generic type parameters
// - No associated functions (no &self receiver)
```

## Derive and Common Traits

```rust
// Derive what you can — it's correct and free
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId(String);

// Standard trait hierarchy to consider:
// Debug         — always derive, essential for diagnostics
// Clone         — when values need to be duplicated
// PartialEq/Eq  — when values need comparison
// Hash          — when used as map keys (requires Eq)
// Default       — when a meaningful zero value exists
// Display       — for user-facing output (implement manually)
// Serialize/Deserialize — for serde (derive with feature flag)

// Don't derive Copy unless the type is truly trivially copyable
// and you want implicit copies. Copy types can't have Drop.
```

## Anti-Patterns

```rust
// Never: Trait objects everywhere when generics would work
// Box<dyn Fn()> is fine for callbacks stored in structs
// impl Fn() is better for function parameters

// Never: Overusing generics for types that will only ever have one concrete type
fn process<T: Into<String>>(name: T) { } // Just take String or &str

// Never: Unused type parameters
struct Wrapper<T> { // T is not used — won't compile without PhantomData
    data: Vec<u8>,
}

// Never: Implementing traits for types you don't own without a newtype
// Orphan rule prevents this anyway — respect it
```
