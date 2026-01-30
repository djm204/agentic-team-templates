# Rust Performance and Unsafe

Rust's zero-cost abstractions mean you rarely need to choose between ergonomics and performance. When you do need to go lower, `unsafe` is the mechanism — and it comes with strict obligations.

## Performance

### Measure First

```bash
# Profile before optimizing
cargo bench                          # Run benchmarks
cargo flamegraph                     # Generate flamegraph (needs cargo-flamegraph)
cargo instruments -t "Time Profiler" # macOS Instruments

# Check binary size
cargo bloat --release --crates       # Which crates contribute to binary size
cargo bloat --release --filter "my_"  # Your functions by size

# Check compile times
cargo build --timings                # HTML report of compile times per crate
```

### Allocation Patterns

```rust
// Preallocate collections when size is known
let mut results = Vec::with_capacity(items.len());
for item in items {
    results.push(process(item));
}

// Use iterators — they often avoid allocation entirely
let sum: i64 = items.iter()
    .filter(|x| x.is_valid())
    .map(|x| x.value())
    .sum();

// Avoid unnecessary clones
fn process(data: &str) -> Result<Output> { ... }     // Borrow when possible
fn consume(data: String) -> Result<Output> { ... }   // Take ownership when needed

// Cow for conditional ownership
use std::borrow::Cow;
fn normalize(input: &str) -> Cow<'_, str> {
    if input.contains('\t') {
        Cow::Owned(input.replace('\t', "    "))
    } else {
        Cow::Borrowed(input) // Zero allocation when no tabs
    }
}

// SmallVec for small, stack-allocated collections
use smallvec::SmallVec;
let mut tags: SmallVec<[Tag; 4]> = SmallVec::new();
// Up to 4 tags on the stack, spills to heap only if exceeded
```

### String Performance

```rust
// String concatenation: use a builder pattern
use std::fmt::Write;
let mut output = String::with_capacity(estimated_size);
for item in items {
    write!(output, "{}: {}\n", item.key, item.value).unwrap();
}

// For byte-level work, operate on &[u8] instead of &str
// Converting to str requires UTF-8 validation — skip it when you can

// Interning for repeated strings
// Use string interning crates (lasso, string_cache) for heavy deduplication
```

### Iterator Optimization

```rust
// Iterators compile to the same code as manual loops — use them freely

// Collect into specific types
let map: HashMap<_, _> = pairs.into_iter().collect();
let set: HashSet<_> = items.into_iter().collect();

// Avoid collect() when you don't need a collection
// Bad: allocates a Vec just to iterate it
let filtered: Vec<_> = items.iter().filter(|x| x.active).collect();
for item in &filtered { ... }

// Good: iterate directly
for item in items.iter().filter(|x| x.active) { ... }

// chunks/windows for batch processing
for chunk in data.chunks(1024) {
    process_batch(chunk)?;
}
```

### Data Layout

```rust
// Field ordering affects struct size due to padding
// Bad: 24 bytes (with padding)
struct Padded {
    a: u8,   // 1 byte + 7 padding
    b: u64,  // 8 bytes
    c: u8,   // 1 byte + 7 padding
}

// Good: 16 bytes (reordered to minimize padding)
struct Compact {
    b: u64,  // 8 bytes
    a: u8,   // 1 byte
    c: u8,   // 1 byte + 6 padding
}

// repr(C) for FFI — disables Rust's field reordering
#[repr(C)]
struct FfiStruct { ... }

// The compiler may reorder fields automatically in default repr(Rust),
// but being explicit about layout helps readability and FFI correctness
```

## Unsafe

### The Contract

Every `unsafe` block is a proof obligation. You are telling the compiler: "I have verified that the safety invariants hold here, and I accept responsibility."

```rust
// ALWAYS document the safety invariant
// SAFETY: We've verified that `index` is within bounds via the
// length check on line 42, and the slice is valid for the lifetime
// of this function.
unsafe {
    *ptr.add(index) = value;
}
```

### Valid Uses of Unsafe

```rust
// 1. Calling unsafe functions (FFI)
extern "C" {
    fn external_function(ptr: *const u8, len: usize) -> i32;
}

pub fn safe_wrapper(data: &[u8]) -> Result<i32> {
    // SAFETY: data.as_ptr() is valid for data.len() bytes,
    // and the external function only reads from the pointer.
    let result = unsafe { external_function(data.as_ptr(), data.len()) };
    if result < 0 {
        Err(Error::ExternalFailure(result))
    } else {
        Ok(result)
    }
}

// 2. Implementing unsafe traits
// SAFETY: MyType is Send because its internal raw pointer
// is only accessed from the thread that owns MyType.
// The pointer is never shared or aliased.
unsafe impl Send for MyType {}

// 3. Accessing mutable statics
static mut COUNTER: u64 = 0;
// SAFETY: This is only called from a single thread during initialization.
unsafe { COUNTER += 1; }
// Prefer AtomicU64 or OnceLock instead — this is almost always avoidable.

// 4. Unchecked operations for performance (after profiling proves it matters)
// SAFETY: We've validated that all bytes in `data` are valid UTF-8
// in the validation pass on line 30.
let s = unsafe { std::str::from_utf8_unchecked(data) };
```

### Minimizing Unsafe Surface

```rust
// Wrap unsafe in safe abstractions with narrow interfaces
pub struct AlignedBuffer {
    ptr: *mut u8,
    len: usize,
    cap: usize,
}

impl AlignedBuffer {
    pub fn new(capacity: usize, alignment: usize) -> Self {
        let layout = Layout::from_size_align(capacity, alignment).unwrap();
        // SAFETY: layout is valid (non-zero size, power-of-two alignment)
        let ptr = unsafe { alloc::alloc(layout) };
        if ptr.is_null() {
            alloc::handle_alloc_error(layout);
        }
        Self { ptr, len: 0, cap: capacity }
    }

    // Public API is fully safe — unsafe is encapsulated
    pub fn push(&mut self, byte: u8) {
        assert!(self.len < self.cap, "buffer full");
        // SAFETY: We've verified len < cap, so ptr.add(len) is within allocation
        unsafe { self.ptr.add(self.len).write(byte); }
        self.len += 1;
    }

    pub fn as_slice(&self) -> &[u8] {
        // SAFETY: ptr is valid for len bytes, all initialized by push()
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

impl Drop for AlignedBuffer {
    fn drop(&mut self) {
        let layout = Layout::from_size_align(self.cap, /* alignment */).unwrap();
        // SAFETY: ptr was allocated with this layout in new()
        unsafe { alloc::dealloc(self.ptr, layout); }
    }
}
```

### Miri

```bash
# Miri detects undefined behavior in unsafe code
cargo +nightly miri test

# Miri catches:
# - Out-of-bounds memory access
# - Use-after-free
# - Invalid use of uninitialized data
# - Violations of aliasing rules (Stacked Borrows)
# - Data races

# Run Miri in CI for any crate with unsafe code
```

## Anti-Patterns

```rust
// Never: unsafe to "shut up the borrow checker"
// If the borrow checker rejects it, there's a reason. Redesign.

// Never: unsafe without a SAFETY comment
unsafe { ptr::write(dst, src) } // WHY is this safe? Document it.

// Never: transmute as a first resort
let x: u32 = unsafe { std::mem::transmute(my_float) };
// Use to_bits() / from_bits() instead — safe, clear, correct

// Never: Assuming layout without repr(C)
// Rust's default repr can reorder fields — don't assume memory layout

// Never: Dereferencing raw pointers without proving validity
// A raw pointer might be null, dangling, or misaligned.
// Prove all three are impossible before dereferencing.
```
