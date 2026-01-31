# Swift Language Features

Optionals, value types, enums, generics, and protocol-oriented design. The type system is your strongest tool.

## Optionals

```swift
// Guard let — early exit pattern (preferred)
guard let user = fetchUser(id: userId) else {
    throw AppError.userNotFound(userId)
}
// user is non-optional from here

// If let — conditional binding
if let email = user.email {
    sendNotification(to: email)
}

// Optional chaining
let street = user.address?.street?.uppercased()

// Nil coalescing
let displayName = user.nickname ?? user.fullName ?? "Anonymous"

// Optional map/flatMap
let uppercasedEmail = user.email.map { $0.uppercased() }
let parsed: URL? = urlString.flatMap { URL(string: $0) }

// Never: force-unwrap without proof
// user.email!  — use guard/if let instead
// Only acceptable: IBOutlets (UIKit), known-safe literals
let url = URL(string: "https://api.example.com")! // Known-safe literal
```

## Value Types vs Reference Types

```swift
// Prefer structs — value semantics, no shared mutable state
struct User: Identifiable, Sendable {
    let id: UUID
    var name: String
    var email: String
    var preferences: Preferences
}

// Use classes only when you need:
// 1. Identity (object === object)
// 2. Reference semantics (shared state)
// 3. Inheritance from ObjC classes
// 4. Deinitializers
class NetworkSession {
    private var urlSession: URLSession
    deinit { urlSession.invalidateAndCancel() }
}

// Copy-on-write for large value types
struct LargeCollection<Element> {
    private var storage: Storage // Reference type internally
    // Implement COW manually only when profiling shows need
}
```

## Enums

```swift
// Enums with associated values — model state precisely
enum LoadingState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(Error)
}

// Exhaustive switch — compiler enforces all cases
func render(state: LoadingState<[User]>) -> some View {
    switch state {
    case .idle:
        EmptyView()
    case .loading:
        ProgressView()
    case .loaded(let users):
        UserListView(users: users)
    case .failed(let error):
        ErrorView(error: error)
    }
    // No default needed — compiler verifies exhaustiveness
}

// String-backed enums for API
enum UserRole: String, Codable, CaseIterable {
    case admin
    case editor
    case viewer
}

// Enums as namespaces
enum Constants {
    static let maxRetries = 3
    static let defaultTimeout: TimeInterval = 30
}
```

## Protocols and Extensions

```swift
// Small, focused protocols
protocol Identifiable {
    associatedtype ID: Hashable
    var id: ID { get }
}

protocol Displayable {
    var displayName: String { get }
}

// Default implementations
extension Displayable where Self: User {
    var displayName: String { "\(firstName) \(lastName)" }
}

// Protocol composition
func showProfile(for entity: Identifiable & Displayable) {
    print("\(entity.id): \(entity.displayName)")
}

// Constrained extensions
extension Array where Element: Numeric {
    var sum: Element { reduce(0, +) }
}

extension Collection where Element: Identifiable {
    func element(withId id: Element.ID) -> Element? {
        first { $0.id == id }
    }
}
```

## Generics

```swift
// Generic functions
func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
    try JSONDecoder().decode(type, from: data)
}

// Generic types with constraints
struct Repository<Entity: Identifiable & Codable> {
    private var storage: [Entity.ID: Entity] = [:]

    mutating func save(_ entity: Entity) {
        storage[entity.id] = entity
    }

    func find(by id: Entity.ID) -> Entity? {
        storage[id]
    }
}

// Opaque return types (some)
func makeView() -> some View {
    VStack {
        Text("Hello")
        Image(systemName: "star")
    }
}

// Primary associated types (Swift 5.7+)
func processCollection(_ items: some Collection<User>) { /* ... */ }
```

## Property Wrappers

```swift
// Standard property wrappers
@Published var users: [User] = []
@State private var isPresented = false
@Binding var selectedTab: Tab
@Environment(\.dismiss) var dismiss
@AppStorage("darkMode") var isDarkMode = false

// Custom property wrapper
@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    let range: ClosedRange<Value>

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}

struct AudioSettings {
    @Clamped(0...100) var volume: Int = 50
}
```

## Result Builders

```swift
// SwiftUI uses @ViewBuilder
@ViewBuilder
func content(for state: LoadingState<User>) -> some View {
    switch state {
    case .loading:
        ProgressView()
    case .loaded(let user):
        Text(user.name)
    default:
        EmptyView()
    }
}
```

## Anti-Patterns

```swift
// Never: force-unwrapping optionals carelessly
let name = user.name!  // Crash if nil
// Use: guard let name = user.name else { return }

// Never: class where struct suffices
class Point { var x: Double; var y: Double }
// Use: struct Point { var x: Double; var y: Double }

// Never: stringly-typed APIs
func fetchData(endpoint: String) { /* ... */ }
// Use: enum Endpoint { case users; case orders }

// Never: Any/AnyObject without cause
func process(_ items: [Any]) { /* ... */ }
// Use: generics or protocols

// Never: deeply nested if/let chains
if let a = optionalA {
    if let b = a.optionalB {
        if let c = b.optionalC { /* ... */ }
    }
}
// Use: guard let with early return, or optional chaining
```
