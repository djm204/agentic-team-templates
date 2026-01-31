# Rust Concurrency

Rust prevents data races at compile time through ownership and the `Send`/`Sync` marker traits. Fearless concurrency is real — but it doesn't mean you can ignore deadlocks, race conditions at the logic level, or performance pitfalls.

## Send and Sync

```rust
// Send: safe to transfer ownership to another thread
// Sync: safe to share references (&T) between threads
// These are auto-traits — the compiler derives them automatically

// Most types are Send + Sync
// Rc<T> is NOT Send or Sync — use Arc<T> for multi-threaded code
// RefCell<T> is Send but NOT Sync — use Mutex<T> for multi-threaded code
// Raw pointers are neither — wrap them in types that uphold invariants
```

## Threading

### std::thread

```rust
use std::thread;

// Scoped threads (Go 1.63+) — borrows from the parent stack are allowed
let mut data = vec![1, 2, 3, 4];
thread::scope(|s| {
    let (left, right) = data.split_at_mut(2);

    s.spawn(|| {
        left.iter_mut().for_each(|x| *x *= 2);
    });
    s.spawn(|| {
        right.iter_mut().for_each(|x| *x *= 3);
    });
});
// Both threads are guaranteed to finish before scope exits
// No Arc, no clone, no join handles to manage
assert_eq!(data, [2, 4, 9, 12]);
```

### Shared State with Arc + Mutex

```rust
use std::sync::{Arc, Mutex};

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    }));
}

for handle in handles {
    handle.join().unwrap();
}
```

### RwLock for Read-Heavy Workloads

```rust
use std::sync::RwLock;

let config = Arc::new(RwLock::new(Config::default()));

// Multiple readers — no blocking
let cfg = config.read().unwrap();
println!("{}", cfg.setting);

// Single writer — exclusive access
let mut cfg = config.write().unwrap();
cfg.setting = new_value;
```

## Channels

```rust
use std::sync::mpsc;

// Multiple producers, single consumer
let (tx, rx) = mpsc::channel();

let tx2 = tx.clone(); // Clone sender for second producer

thread::spawn(move || {
    tx.send(Message::Data(vec![1, 2, 3])).unwrap();
});

thread::spawn(move || {
    tx2.send(Message::Data(vec![4, 5, 6])).unwrap();
});

// Receive all messages
for msg in rx {
    process(msg);
}

// crossbeam-channel for multi-producer multi-consumer, select!, bounded channels
use crossbeam_channel::{bounded, select};

let (tx, rx) = bounded(100); // Backpressure at 100 items

select! {
    recv(rx) -> msg => handle(msg.unwrap()),
    default(Duration::from_secs(1)) => println!("timeout"),
}
```

## Async/Await

### Tokio Runtime

```rust
#[tokio::main]
async fn main() -> Result<()> {
    let listener = TcpListener::bind("0.0.0.0:8080").await?;

    loop {
        let (stream, addr) = listener.accept().await?;
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream).await {
                eprintln!("connection error from {addr}: {e}");
            }
        });
    }
}
```

### Async Patterns

```rust
// Concurrent execution with join
let (users, posts) = tokio::join!(
    fetch_users(&client),
    fetch_posts(&client),
);

// Race — first to complete wins
tokio::select! {
    result = fetch_data() => handle_data(result),
    _ = tokio::time::sleep(Duration::from_secs(5)) => {
        return Err(anyhow!("fetch timed out"));
    }
}

// Bounded concurrency with semaphore
use tokio::sync::Semaphore;

let semaphore = Arc::new(Semaphore::new(10));
let mut handles = vec![];

for url in urls {
    let permit = semaphore.clone().acquire_owned().await?;
    handles.push(tokio::spawn(async move {
        let result = fetch(url).await;
        drop(permit); // Release when done
        result
    }));
}

// Stream processing
use tokio_stream::StreamExt;

let mut stream = tokio_stream::iter(items)
    .map(|item| async move { process(item).await })
    .buffer_unordered(10); // Process up to 10 concurrently

while let Some(result) = stream.next().await {
    handle(result?);
}
```

### Async Traits

```rust
// Since Rust 1.75: async fn in traits works natively
pub trait Repository {
    async fn find_by_id(&self, id: &str) -> Result<Option<Entity>>;
    async fn save(&self, entity: &Entity) -> Result<()>;
}

// For trait objects (dyn), use the async-trait crate or
// return Pin<Box<dyn Future>> manually
```

### Cancellation Safety

```rust
// tokio::select! can cancel futures — understand what that means
// A future dropped mid-execution won't run its remaining code

// Cancellation-safe: reading from a channel (no partial state)
// NOT cancellation-safe: reading into a buffer (partial read lost)

tokio::select! {
    // Safe: mpsc::Receiver::recv is cancellation-safe
    msg = rx.recv() => { ... }

    // DANGEROUS if buf has partial state from a previous iteration
    n = reader.read(&mut buf) => { ... }
}

// When in doubt, consult tokio's docs for each method's cancellation safety
```

## Atomics

```rust
use std::sync::atomic::{AtomicU64, Ordering};

static REQUEST_COUNT: AtomicU64 = AtomicU64::new(0);

fn handle_request() {
    REQUEST_COUNT.fetch_add(1, Ordering::Relaxed);
}

// Ordering guide:
// Relaxed  — no ordering guarantees, just atomicity (counters)
// Acquire  — subsequent reads see writes before the Release
// Release  — previous writes are visible to Acquire loads
// SeqCst   — total order, strongest guarantee, rarely needed
// If unsure, use SeqCst and optimize later with profiling data
```

## Anti-Patterns

```rust
// Never: Holding a MutexGuard across an await point
let guard = mutex.lock().await;
do_async_work().await; // Deadlock risk — guard is held across await
drop(guard);
// Instead: lock, extract data, drop guard, then await

// Never: Spawning tasks without cancellation or shutdown strategy
tokio::spawn(async { loop { do_work().await; } }); // How does this stop?

// Never: Blocking in async context
std::thread::sleep(Duration::from_secs(1)); // Blocks the executor thread!
tokio::time::sleep(Duration::from_secs(1)).await; // Use this instead

// For CPU-bound work in async context:
tokio::task::spawn_blocking(|| expensive_computation()).await?;

// Never: Using std::sync::Mutex in async code (blocks the executor)
// Use tokio::sync::Mutex instead when you must hold across awaits
```
