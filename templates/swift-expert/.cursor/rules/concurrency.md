# Swift Concurrency

Structured concurrency with async/await, actors, and task groups. No more callback pyramids.

## async/await

```swift
// Async functions
func fetchUser(id: UUID) async throws -> User {
    let (data, response) = try await urlSession.data(from: userURL(id))
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw APIError.invalidResponse
    }
    return try JSONDecoder().decode(User.self, from: data)
}

// Calling async code
let user = try await fetchUser(id: userId)

// Async let — parallel execution
async let user = fetchUser(id: userId)
async let orders = fetchOrders(userId: userId)
async let preferences = fetchPreferences(userId: userId)

let dashboard = try await Dashboard(
    user: user,
    orders: orders,
    preferences: preferences
)
// All three requests run concurrently
```

## Task and TaskGroup

```swift
// Unstructured task (use sparingly)
Task {
    do {
        let result = try await processData()
        await MainActor.run { updateUI(with: result) }
    } catch {
        await MainActor.run { showError(error) }
    }
}

// Task group — dynamic parallelism
func fetchAllUsers(ids: [UUID]) async throws -> [User] {
    try await withThrowingTaskGroup(of: User.self) { group in
        for id in ids {
            group.addTask {
                try await fetchUser(id: id)
            }
        }

        var users: [User] = []
        for try await user in group {
            users.append(user)
        }
        return users
    }
}

// Task cancellation
func longRunningProcess() async throws {
    for item in items {
        try Task.checkCancellation() // Throws if cancelled
        await process(item)
    }
}

// Cooperative cancellation
Task {
    let result = try await longRunningProcess()
}
// Later:
task.cancel() // Cooperative — task must check
```

## Actors

```swift
// Actor — thread-safe mutable state
actor ImageCache {
    private var cache: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? {
        cache[url]
    }

    func store(_ image: UIImage, for url: URL) {
        cache[url] = image
    }

    func clear() {
        cache.removeAll()
    }
}

// Using actors
let cache = ImageCache()
let image = await cache.image(for: url) // await required for actor isolation

// nonisolated — opt out for non-mutable access
actor UserStore {
    let id: UUID // Immutable, safe without isolation

    nonisolated var description: String {
        "UserStore(\(id))"
    }
}
```

## MainActor

```swift
// MainActor — UI thread safety
@MainActor
class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var error: AppError?

    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }

        do {
            users = try await userService.fetchAll()
        } catch {
            self.error = AppError(error)
        }
    }
}

// MainActor.run for one-off UI updates
func processInBackground() async {
    let result = await heavyComputation()
    await MainActor.run {
        self.displayResult = result
    }
}
```

## Sendable

```swift
// Sendable — safe to pass across concurrency domains
struct UserDTO: Sendable {
    let id: UUID
    let name: String
    let email: String
}

// @Sendable closures
func performAsync(_ work: @Sendable @escaping () async -> Void) {
    Task { await work() }
}

// @unchecked Sendable — manual safety guarantee
final class ThreadSafeCache: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: [String: Any] = [:]

    func get(_ key: String) -> Any? {
        lock.lock()
        defer { lock.unlock() }
        return storage[key]
    }
}
```

## AsyncSequence and AsyncStream

```swift
// AsyncStream for bridging callback APIs
func notifications(named name: Notification.Name) -> AsyncStream<Notification> {
    AsyncStream { continuation in
        let observer = NotificationCenter.default.addObserver(
            forName: name, object: nil, queue: nil
        ) { notification in
            continuation.yield(notification)
        }
        continuation.onTermination = { _ in
            NotificationCenter.default.removeObserver(observer)
        }
    }
}

// Consuming async sequences
for await notification in notifications(named: .userDidLogin) {
    handleLogin(notification)
}

// AsyncSequence transformations
let validUsers = userStream
    .filter { $0.isActive }
    .map { UserViewModel(user: $0) }
    .prefix(10)
```

## Rules

- No `DispatchQueue.main.async` in new code — use `@MainActor` or `MainActor.run`
- No completion handlers in new code — use `async`/`await`
- No `DispatchGroup` — use `TaskGroup`
- Always check `Task.isCancelled` or call `Task.checkCancellation()` in loops
- Mark types as `Sendable` when passed across concurrency domains
- Use actors for shared mutable state, not locks (in new code)
- `Task {}` is unstructured — prefer structured concurrency (`async let`, `TaskGroup`)

## Anti-Patterns

```swift
// Never: fire-and-forget tasks without error handling
Task { try await riskyOperation() } // Errors silently swallowed
// Use: Task with do/catch

// Never: blocking the main thread
DispatchQueue.main.sync { /* ... */ } // Deadlock risk
// Use: @MainActor or MainActor.run

// Never: capturing self strongly in long-lived tasks
Task { [self] in await self.process() } // Potential retain cycle
// Use: Task { [weak self] in await self?.process() }

// Never: using GCD for new concurrent code
DispatchQueue.global().async { /* ... */ }
// Use: Task { /* ... */ } with async/await
```
