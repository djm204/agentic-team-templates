# Java Concurrency

The Java Memory Model is the law. Every concurrent decision must respect it.

## Virtual Threads (Java 21+)

The default for I/O-bound work. Platform threads for CPU-bound work.

```java
// Virtual threads for I/O concurrency
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var futures = tasks.stream()
        .map(task -> executor.submit(() -> process(task)))
        .toList();

    var results = futures.stream()
        .map(f -> {
            try { return f.get(30, TimeUnit.SECONDS); }
            catch (TimeoutException e) { throw new ProcessingTimeoutException(e); }
            catch (ExecutionException e) { throw new ProcessingException(e.getCause()); }
            catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ProcessingException(e);
            }
        })
        .toList();
}
```

### Virtual Thread Rules

- Don't pool virtual threads — they're cheap to create
- Don't use `synchronized` for I/O operations — use `ReentrantLock`
- Don't pin virtual threads to carrier threads (`synchronized` blocks pin)
- Don't use `ThreadLocal` for request-scoped data — use `ScopedValue` (preview)

```java
// Bad: synchronized pins virtual thread to carrier
synchronized (lock) {
    database.query(sql); // I/O while pinned — wastes carrier thread
}

// Good: ReentrantLock doesn't pin
private final ReentrantLock lock = new ReentrantLock();

lock.lock();
try {
    database.query(sql); // Virtual thread can unmount during I/O
} finally {
    lock.unlock();
}
```

## Structured Concurrency (Preview)

```java
// All subtasks succeed or all are cancelled — no leaked threads
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User> userTask = scope.fork(() -> userService.findById(userId));
    Subtask<List<Order>> ordersTask = scope.fork(() -> orderService.findByUser(userId));

    scope.join();           // Wait for all
    scope.throwIfFailed();  // Propagate first failure

    return new Dashboard(userTask.get(), ordersTask.get());
}
```

## CompletableFuture

```java
// Async pipeline with proper error handling
public CompletableFuture<OrderResult> processOrderAsync(CreateOrderRequest request) {
    return validateAsync(request)
        .thenCompose(this::checkInventoryAsync)
        .thenCompose(this::createOrderAsync)
        .thenApply(OrderResult::success)
        .exceptionally(ex -> {
            log.error("Order processing failed", ex);
            return OrderResult.failure(ex.getMessage());
        });
}

// Combine independent operations
public CompletableFuture<Dashboard> loadDashboard(UUID userId) {
    var userFuture = CompletableFuture.supplyAsync(() -> userService.findById(userId));
    var ordersFuture = CompletableFuture.supplyAsync(() -> orderService.recent(userId));
    var statsFuture = CompletableFuture.supplyAsync(() -> statsService.forUser(userId));

    return CompletableFuture.allOf(userFuture, ordersFuture, statsFuture)
        .thenApply(v -> new Dashboard(
            userFuture.join(),
            ordersFuture.join(),
            statsFuture.join()));
}
```

## Thread Safety Patterns

### Immutability (Preferred)

```java
// Immutable objects are inherently thread-safe
public record UserSnapshot(UUID id, String name, Instant capturedAt) {}

// Unmodifiable collections
private final List<String> allowedRoles = List.of("USER", "ADMIN", "MODERATOR");
```

### Atomic Operations

```java
private final AtomicLong requestCounter = new AtomicLong();
private final AtomicReference<Config> currentConfig = new AtomicReference<>(Config.defaults());

public void handleRequest() {
    requestCounter.incrementAndGet();
}

public void updateConfig(Config newConfig) {
    currentConfig.set(newConfig);
}
```

### ConcurrentHashMap

```java
// Thread-safe map with atomic compute operations
private final ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

public void increment(String key) {
    counters.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();
}

// Never iterate and modify — use compute/merge operations
counters.merge(key, new AtomicLong(1), (existing, value) -> {
    existing.incrementAndGet();
    return existing;
});
```

### Bounded Queues

```java
// Backpressure via bounded queue
private final BlockingQueue<Event> eventQueue = new LinkedBlockingQueue<>(10_000);

public boolean publish(Event event) {
    return eventQueue.offer(event); // Returns false if full — handle backpressure
}

public void consume() {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            Event event = eventQueue.poll(1, TimeUnit.SECONDS);
            if (event != null) process(event);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            break;
        }
    }
}
```

## Interrupt Handling

```java
// Always restore interrupt status
public void processItems(List<Item> items) {
    for (var item : items) {
        if (Thread.currentThread().isInterrupted()) {
            log.warn("Processing interrupted, {} items remaining", items.size());
            break;
        }
        process(item);
    }
}

// In catch blocks
try {
    Thread.sleep(Duration.ofSeconds(5));
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // Restore flag
    throw new RuntimeException("Operation interrupted", e);
}
```

## Anti-Patterns

```java
// Never: double-checked locking without volatile (pre-Java 5 bug, but still seen)
// Use: enum singleton, or lazy holder pattern, or just @Singleton

// Never: synchronized on non-final fields
private Object lock = new Object(); // Can be reassigned!
synchronized (lock) { } // Different threads may lock different objects
// Use: private final Object lock = new Object();

// Never: Thread.stop() or Thread.suspend()
// Use: cooperative interruption via Thread.interrupt()

// Never: busy-wait
while (!ready) { } // Burns CPU
// Use: CountDownLatch, Semaphore, or BlockingQueue

// Never: shared mutable state without synchronization
private int counter; // Multiple threads read/write without coordination
// Use: AtomicInteger, or synchronize access
```
