# Swift Performance

Profile first. Understand ARC, value types, and Instruments. Optimize what matters.

## Profile Before Optimizing

```bash
# Instruments — always profile before optimizing
# Time Profiler: CPU hotspots
# Allocations: memory usage and leaks
# Leaks: retain cycles
# Network: request analysis
# Core Animation: rendering performance

# Xcode: Product → Profile (⌘I)
```

## Value Types and Copy-on-Write

```swift
// Structs are stack-allocated (when possible) and value-copied
// But Swift uses COW for standard library collections
var array1 = [1, 2, 3]
var array2 = array1 // No copy yet — shared storage
array2.append(4)    // Copy happens here (COW trigger)

// Custom COW for large value types
struct LargeStruct {
    private final class Storage {
        var data: [Int]
        init(data: [Int]) { self.data = data }
    }

    private var storage: Storage

    var data: [Int] {
        get { storage.data }
        set {
            if !isKnownUniquelyReferenced(&storage) {
                storage = Storage(data: newValue)
            } else {
                storage.data = newValue
            }
        }
    }
}
```

## ARC and Retain Cycles

```swift
// Weak references — break retain cycles
class ViewController: UIViewController {
    private var cancellable: AnyCancellable?

    func subscribe() {
        cancellable = publisher
            .sink { [weak self] value in  // weak self!
                self?.handleValue(value)
            }
    }
}

// Unowned — when you guarantee the reference outlives the closure
class Parent {
    let child: Child

    init() {
        child = Child()
        child.onComplete = { [unowned self] in
            self.handleCompletion() // Crashes if self is deallocated
        }
    }
}

// Capture lists — be explicit
Task { [weak self, userId = self.user.id] in
    guard let self else { return }
    let data = try await self.fetch(userId: userId)
}
```

## Collection Performance

```swift
// Reserve capacity for known sizes
var results: [ProcessedItem] = []
results.reserveCapacity(items.count)

// Use lazy for chained operations on large collections
let names = users.lazy
    .filter { $0.isActive }
    .map { $0.fullName }
    .prefix(10)
// Operations only execute when iterated

// ContiguousArray for non-class element types
let numbers = ContiguousArray<Int>(repeating: 0, count: 1000)
// Guaranteed contiguous memory layout — better cache performance

// Set for membership tests
let activeIds = Set(activeUsers.map(\.id)) // O(1) lookup
let filtered = orders.filter { activeIds.contains($0.userId) }

// Dictionary for keyed access
let userById = Dictionary(uniqueKeysWithValues: users.map { ($0.id, $0) })
```

## String Performance

```swift
// String is a value type with COW
// UTF-8 encoded internally — character access is O(n)

// Prefer Substring over creating new Strings
let greeting = "Hello, World!"
let hello = greeting.prefix(5) // Substring — shares storage

// Convert to String only when needed for storage
let stored = String(hello) // Creates independent copy

// Use string interpolation — optimized by compiler
let message = "User \(user.name) logged in" // Efficient

// For heavy concatenation
var result = ""
result.reserveCapacity(estimatedLength)
for item in items {
    result += item.description
}
```

## SwiftUI Performance

```swift
// Avoid unnecessary view recomputation
struct UserRow: View {
    let user: User // Prefer let over @State for display-only data

    var body: some View {
        HStack {
            AvatarView(url: user.avatarURL)
            Text(user.name)
        }
    }
}

// Equatable conformance to skip redundant diffs
struct ExpensiveView: View, Equatable {
    let data: ChartData

    static func == (lhs: Self, rhs: Self) -> Bool {
        lhs.data.id == rhs.data.id && lhs.data.version == rhs.data.version
    }

    var body: some View {
        ChartRenderer(data: data) // Expensive
    }
}

// Use @Observable over ObservableObject (iOS 17+)
// @Observable tracks property-level access — fewer view updates

// Lazy stacks for large lists
ScrollView {
    LazyVStack { // Only creates visible views
        ForEach(items) { item in
            ItemRow(item: item)
        }
    }
}
```

## Concurrency Performance

```swift
// Limit concurrent work
func processImages(_ urls: [URL]) async throws -> [UIImage] {
    try await withThrowingTaskGroup(of: UIImage.self) { group in
        let maxConcurrency = ProcessInfo.processInfo.activeProcessorCount

        var results: [UIImage] = []
        results.reserveCapacity(urls.count)

        for (index, url) in urls.enumerated() {
            if index >= maxConcurrency {
                if let image = try await group.next() {
                    results.append(image)
                }
            }
            group.addTask { try await downloadImage(from: url) }
        }

        for try await image in group {
            results.append(image)
        }
        return results
    }
}

// Avoid unnecessary actor hops
actor DataStore {
    private var items: [Item] = []

    // Batch operations reduce actor hops
    func addAll(_ newItems: [Item]) {
        items.append(contentsOf: newItems) // Single hop
    }
    // Instead of calling add(_:) in a loop — one hop per call
}
```

## Memory Management

```swift
// Autoreleasepool for tight loops with ObjC objects
func processLargeDataset() {
    for batch in dataset.chunks(ofCount: 100) {
        autoreleasepool {
            let processed = batch.map { transform($0) }
            save(processed)
        }
        // Memory released each iteration
    }
}

// Avoid strong reference cycles in closures
class NetworkManager {
    var onComplete: ((Result<Data, Error>) -> Void)?

    deinit {
        onComplete = nil // Break cycle on dealloc
    }
}
```

## Anti-Patterns

```swift
// Never: premature optimization without profiling
// "I think this allocation is slow" — prove it with Instruments

// Never: using classes where structs work
class Point { var x: Double; var y: Double } // Heap allocation
// Use: struct Point — stack allocation, no ARC overhead

// Never: force-unwrapping in hot paths
array[index]! // Hidden crash waiting to happen

// Never: string concatenation with + in loops
var result = ""
for item in items { result = result + item.name } // O(n²)
// Use: reserveCapacity + append, or joined()

// Never: capturing self strongly in long-lived closures
timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
    self.update() // Retain cycle
}
// Use: [weak self]
```
