# Rust Ownership and Borrowing

Ownership is Rust's defining feature. It's not a constraint — it's a design tool that eliminates entire classes of bugs at compile time. Every memory safety guarantee flows from these rules.

## The Three Rules

1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. You can have either one mutable reference OR any number of shared references — never both

## Ownership Patterns

### Move Semantics

```rust
// Values are moved by default — this is the foundation
let s = String::from("hello");
let t = s; // s is MOVED into t
// println!("{s}"); // Compile error: s has been moved

// Functions take ownership unless they borrow
fn consume(s: String) { /* s is dropped at end of function */ }
fn borrow(s: &str) { /* s is borrowed — caller keeps ownership */ }

// Return values transfer ownership back
fn create() -> String {
    String::from("created") // Ownership moves to caller
}
```

### Borrowing

```rust
// Shared references: &T — read-only, multiple allowed
fn len(s: &str) -> usize {
    s.len()
}

// Mutable references: &mut T — exclusive access
fn push_greeting(s: &mut String) {
    s.push_str(", world!");
}

// The borrow checker enforces at compile time:
let mut s = String::from("hello");
let r1 = &s;      // Fine: shared borrow
let r2 = &s;      // Fine: multiple shared borrows
println!("{r1} {r2}");
// r1 and r2 are no longer used after this point (NLL)
let r3 = &mut s;  // Fine: no shared borrows are active
r3.push_str("!");
```

### Lifetimes

```rust
// Lifetimes tell the compiler how long references are valid
// Most of the time, elision handles this automatically

// When the compiler needs help:
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// Meaning: the returned reference lives at least as long as
// the shorter of x and y

// Structs that hold references need lifetime annotations
struct Excerpt<'a> {
    text: &'a str,
}

// If your struct has many lifetime parameters, consider
// owning the data instead — complexity isn't always worth it
struct Article {
    title: String,    // Owned — simpler, no lifetime tracking
    body: String,
}
```

### Interior Mutability

```rust
// When you need mutation behind a shared reference

// Cell<T> — for Copy types, single-threaded
use std::cell::Cell;
let counter = Cell::new(0);
counter.set(counter.get() + 1); // Mutation through shared reference

// RefCell<T> — runtime borrow checking, single-threaded
use std::cell::RefCell;
let data = RefCell::new(vec![1, 2, 3]);
data.borrow_mut().push(4); // Panics if already borrowed

// Mutex<T> / RwLock<T> — thread-safe interior mutability
use std::sync::Mutex;
let shared = Mutex::new(Vec::new());
shared.lock().unwrap().push(42);

// Choose the right tool:
// Cell       — Copy types, no overhead, single-threaded
// RefCell    — any type, runtime cost, single-threaded, panics on violation
// Mutex      — any type, blocking, multi-threaded
// RwLock     — any type, read-heavy workloads, multi-threaded
// Atomic*    — primitives, lock-free, multi-threaded
```

## Smart Pointers

```rust
// Box<T> — heap allocation with single ownership
let boxed: Box<dyn Error> = Box::new(MyError::new("failed"));
// Use for: trait objects, recursive types, large values you want on heap

// Rc<T> — reference-counted, single-threaded shared ownership
use std::rc::Rc;
let shared = Rc::new(ExpensiveData::new());
let clone = Rc::clone(&shared); // Increments count, doesn't clone data
// Use for: graph structures, multiple owners in single-threaded code

// Arc<T> — atomic reference-counted, thread-safe shared ownership
use std::sync::Arc;
let shared = Arc::new(Config::load());
let handle = {
    let shared = Arc::clone(&shared);
    thread::spawn(move || process(&shared))
};
// Use for: shared immutable data across threads

// Cow<T> — clone-on-write
use std::borrow::Cow;
fn process(input: &str) -> Cow<'_, str> {
    if input.contains("bad") {
        Cow::Owned(input.replace("bad", "good"))
    } else {
        Cow::Borrowed(input) // No allocation when not needed
    }
}
// Use for: avoiding allocation when mutation is conditional
```

## Common Borrow Checker Patterns

### Splitting Borrows

```rust
// The borrow checker tracks borrows per-field, not per-struct
struct State {
    buffer: Vec<u8>,
    index: usize,
}

impl State {
    fn process(&mut self) {
        // This works because buffer and index are separate fields
        let buf = &self.buffer[self.index..];
        self.index += buf.len();
    }
}
```

### Temporary Lifetimes

```rust
// Bad: temporary dropped while borrowed
// let r = &String::from("temp"); // Won't compile — temporary is dropped

// Good: bind to a variable to extend the lifetime
let s = String::from("temp");
let r = &s; // s lives as long as the scope
```

### Entry API for Maps

```rust
use std::collections::HashMap;

let mut map = HashMap::new();

// Entry API avoids double lookup and borrow conflicts
map.entry("key")
    .and_modify(|v| *v += 1)
    .or_insert(0);
```

## Anti-Patterns

```rust
// Never: Clone to satisfy the borrow checker without understanding why
let data = expensive_data.clone(); // Are you sure this is necessary?
// If you're cloning to fix a borrow error, first ask: can I restructure the code?

// Never: Leaking memory to avoid lifetimes
let leaked: &'static str = Box::leak(Box::new(String::from("forever")));
// This is almost never the right solution

// Never: Rc<RefCell<T>> as a default — it's a code smell
// If everything is Rc<RefCell<T>>, you've recreated garbage-collected mutable state
// Restructure to use ownership and borrowing properly first

// Never: Ignoring the borrow checker by reaching for unsafe
// If the borrow checker rejects your code, the design usually needs to change
// unsafe doesn't fix design problems — it hides them
```
