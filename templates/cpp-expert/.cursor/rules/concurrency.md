# C++ Concurrency

The C++ memory model is the law. Every concurrent access must be explicitly synchronized.

## std::thread and std::jthread

```cpp
// std::jthread (C++20) — automatically joins on destruction
void process_data(std::stop_token stop, std::span<const Item> items) {
    for (const auto& item : items) {
        if (stop.stop_requested()) return;
        process(item);
    }
}

auto worker = std::jthread(process_data, data);
// Automatically joins when worker goes out of scope
// Can request stop: worker.request_stop();

// Never use std::thread without join/detach — it calls std::terminate
```

## Mutex and Locking

```cpp
// RAII locking — always
class ThreadSafeCounter {
    mutable std::mutex mutex_;
    int count_ = 0;

public:
    void increment() {
        std::lock_guard lock(mutex_);
        ++count_;
    }

    int get() const {
        std::lock_guard lock(mutex_);
        return count_;
    }
};

// Multiple mutexes — use std::scoped_lock to avoid deadlock
void transfer(Account& from, Account& to, int amount) {
    std::scoped_lock lock(from.mutex_, to.mutex_); // Deadlock-free
    from.balance_ -= amount;
    to.balance_ += amount;
}

// Read-heavy workloads — use shared_mutex
class Cache {
    mutable std::shared_mutex mutex_;
    std::unordered_map<std::string, Value> data_;

public:
    auto get(const std::string& key) const -> std::optional<Value> {
        std::shared_lock lock(mutex_); // Multiple readers OK
        auto it = data_.find(key);
        return it != data_.end() ? std::optional{it->second} : std::nullopt;
    }

    void set(const std::string& key, Value value) {
        std::unique_lock lock(mutex_); // Exclusive write
        data_[key] = std::move(value);
    }
};
```

## Atomics

```cpp
// Lock-free operations for simple types
std::atomic<int> counter{0};
counter.fetch_add(1, std::memory_order_relaxed); // Fastest for counters

// Flags
std::atomic<bool> ready{false};
// Producer:
data = prepare();
ready.store(true, std::memory_order_release);
// Consumer:
while (!ready.load(std::memory_order_acquire)) { /* spin or yield */ }
use(data); // Guaranteed to see prepared data

// std::atomic_ref (C++20) for non-atomic variables
int value = 0;
std::atomic_ref ref{value};
ref.fetch_add(1);
```

## Condition Variables

```cpp
template <typename T>
class BoundedQueue {
    std::queue<T> queue_;
    mutable std::mutex mutex_;
    std::condition_variable not_empty_;
    std::condition_variable not_full_;
    size_t max_size_;

public:
    explicit BoundedQueue(size_t max_size) : max_size_{max_size} {}

    void push(T item) {
        std::unique_lock lock(mutex_);
        not_full_.wait(lock, [this] { return queue_.size() < max_size_; });
        queue_.push(std::move(item));
        not_empty_.notify_one();
    }

    auto pop() -> T {
        std::unique_lock lock(mutex_);
        not_empty_.wait(lock, [this] { return !queue_.empty(); });
        auto item = std::move(queue_.front());
        queue_.pop();
        not_full_.notify_one();
        return item;
    }

    auto try_pop(std::chrono::milliseconds timeout) -> std::optional<T> {
        std::unique_lock lock(mutex_);
        if (!not_empty_.wait_for(lock, timeout, [this] { return !queue_.empty(); })) {
            return std::nullopt;
        }
        auto item = std::move(queue_.front());
        queue_.pop();
        not_full_.notify_one();
        return item;
    }
};
```

## Async and Futures

```cpp
// std::async for fire-and-forget parallel work
auto future = std::async(std::launch::async, [] {
    return expensive_computation();
});

auto result = future.get(); // Blocks until ready

// Parallel independent work
auto user_future = std::async(std::launch::async, [&] { return fetch_user(id); });
auto orders_future = std::async(std::launch::async, [&] { return fetch_orders(id); });

auto user = user_future.get();
auto orders = orders_future.get();
```

## Parallel Algorithms (C++17)

```cpp
#include <execution>

// Parallel sort
std::sort(std::execution::par, data.begin(), data.end());

// Parallel transform-reduce
auto total = std::transform_reduce(
    std::execution::par,
    orders.begin(), orders.end(),
    0.0,                                        // Initial value
    std::plus<>{},                              // Reduce
    [](const Order& o) { return o.total(); }    // Transform
);

// Parallel for_each
std::for_each(std::execution::par_unseq, items.begin(), items.end(),
    [](auto& item) { item.process(); });
```

## Thread Safety Rules

1. **Immutable data is thread-safe** — share freely via `const` references
2. **Every mutable shared state needs synchronization** — no exceptions
3. **Prefer lock-free data structures** when correctness is provable
4. **Hold locks for the minimum time** — compute outside the critical section
5. **Never hold two locks simultaneously** unless using `std::scoped_lock`
6. **Use `std::atomic` for single variables**, mutex for compound operations

## Anti-Patterns

```cpp
// Never: lock and forget
mutex_.lock();
do_work(); // If this throws, mutex stays locked forever
mutex_.unlock();
// Use: std::lock_guard or std::unique_lock (RAII)

// Never: double-checked locking without atomics
if (!instance) {
    std::lock_guard lock(mutex);
    if (!instance) instance = new Singleton(); // Data race!
}
// Use: std::call_once or static local (Meyers singleton)

static Singleton& instance() {
    static Singleton s; // Thread-safe in C++11+
    return s;
}

// Never: volatile for synchronization
volatile int flag; // volatile != atomic in C++
// Use: std::atomic<int> flag;

// Never: busy-waiting without yield
while (!ready.load()) {} // Burns CPU
// Use: condition_variable, or at least std::this_thread::yield()
```
