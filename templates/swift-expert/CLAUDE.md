# Swift Expert Development Guide

Principal-level guidelines for Swift engineering. Deep language mastery, structured concurrency, SwiftUI, protocol-oriented design, and Apple platform expertise.

---

## Overview

This guide applies to:
- iOS and iPadOS applications (UIKit, SwiftUI)
- macOS applications (AppKit, SwiftUI)
- watchOS and tvOS applications
- Server-side Swift (Vapor, Hummingbird)
- Swift packages and frameworks
- Command-line tools

### Core Philosophy

Swift is a safe, fast, and expressive language. Use its type system to make invalid states unrepresentable.

- **Safety is the foundation.** Optionals, value types, and the compiler are your first line of defense
- **Protocol-oriented design.** Prefer protocols and composition over class inheritance
- **Value semantics by default.** Structs over classes unless you need reference semantics
- **Concurrency is structured.** async/await, actors, and task groups — not GCD callbacks
- **Expressiveness without obscurity.** Clear is better than clever
- **If you don't know, say so.** Admitting uncertainty is professional

### Key Principles

1. **Optionals Are Not Enemies** — Embrace `Optional`. Never force-unwrap without proof
2. **Value Types by Default** — Structs, enums, tuples. Classes only when identity or reference semantics are required
3. **Protocol-Oriented Design** — Small, focused protocols. Composition over inheritance
4. **Structured Concurrency** — `async`/`await`, `TaskGroup`, actors. No completion handler callbacks in new code
5. **Exhaustive Pattern Matching** — `switch` on enums is exhaustive. The compiler enforces completeness

### Project Structure

```
MyApp/
├── Sources/
│   ├── App/
│   ├── Features/
│   │   ├── Auth/
│   │   └── Home/
│   ├── Core/
│   │   ├── Networking/
│   │   ├── Persistence/
│   │   └── Extensions/
│   └── Shared/
├── Tests/
├── Package.swift
└── README.md
```

---

## Language Features

### Optionals

```swift
guard let user = fetchUser(id: userId) else { throw AppError.userNotFound(userId) }
let displayName = user.nickname ?? user.fullName ?? "Anonymous"
let uppercasedEmail = user.email.map { $0.uppercased() }
// Never: user.email! — use guard/if let instead
```

### Value Types and Enums

```swift
struct User: Identifiable, Sendable {
    let id: UUID
    var name: String
    var email: String
}

enum LoadingState<T> {
    case idle, loading, loaded(T), failed(Error)
}
```

### Protocols and Extensions

```swift
protocol Displayable {
    var displayName: String { get }
}

extension Collection where Element: Identifiable {
    func element(withId id: Element.ID) -> Element? {
        first { $0.id == id }
    }
}
```

---

## Concurrency

### async/await

```swift
func fetchDashboard(userId: UUID) async throws -> Dashboard {
    async let user = fetchUser(id: userId)
    async let orders = fetchOrders(userId: userId)
    return try await Dashboard(user: user, orders: orders)
}
```

### Actors

```swift
actor ImageCache {
    private var cache: [URL: UIImage] = [:]
    func image(for url: URL) -> UIImage? { cache[url] }
    func store(_ image: UIImage, for url: URL) { cache[url] = image }
}
```

### Rules

- No `DispatchQueue.main.async` in new code — use `@MainActor`
- No completion handlers in new code — use `async`/`await`
- Always check `Task.isCancelled` in loops
- Use actors for shared mutable state

---

## Error Handling

### Error Types

```swift
enum APIError: Error, LocalizedError {
    case networkUnavailable
    case notFound(resource: String, id: String)
    case serverError(statusCode: Int, message: String)
}
```

### Guard Pattern

```swift
func processOrder(_ order: Order) throws {
    guard !order.items.isEmpty else { throw OrderError.emptyOrder }
    guard order.status == .confirmed else { throw OrderError.invalidStatus(order.status) }
    guard let payment = order.paymentMethod else { throw OrderError.noPaymentMethod }
    charge(payment, for: order)
}
```

---

## SwiftUI

### State Management

```swift
@Observable
class UserViewModel {
    var users: [User] = []
    var isLoading = false

    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }
        users = (try? await userService.fetchAll()) ?? []
    }
}
```

### Navigation

```swift
enum Route: Hashable {
    case userDetail(User)
    case settings
}

NavigationStack(path: $path) {
    HomeView()
        .navigationDestination(for: Route.self) { route in
            switch route {
            case .userDetail(let user): UserDetailView(user: user)
            case .settings: SettingsView()
            }
        }
}
```

---

## Testing

### Framework Stack

| Tool | Purpose |
|------|---------|
| Swift Testing | Modern test framework |
| XCTest | Traditional test framework |
| XCUITest | UI automation |
| swift-snapshot-testing | Snapshot testing |

### Test Structure

```swift
@Suite("UserService")
struct UserServiceTests {
    @Test("creates user with valid input")
    func createUserValid() async throws {
        let user = try await sut.create(request)
        #expect(user.name == "Alice")
    }

    @Test("validates email format", arguments: ["invalid", "", "@missing"])
    func invalidEmails(email: String) async {
        await #expect(throws: ValidationError.invalidEmail) {
            try await sut.create(CreateUserRequest(name: "Test", email: email))
        }
    }
}
```

---

## Performance

### Key Patterns

- Profile with Instruments before optimizing
- Value types for stack allocation and no ARC overhead
- `lazy` collections for chained operations on large datasets
- `Set` for membership tests, `Dictionary` for keyed access
- `reserveCapacity` for collections with known sizes
- `[weak self]` in closures to prevent retain cycles
- `LazyVStack`/`LazyHStack` in SwiftUI for large lists

---

## Tooling

### Essential Stack

| Tool | Purpose |
|------|---------|
| Swift Package Manager | Dependency management and build |
| SwiftLint | Static analysis and style |
| swift-format | Code formatting |
| Instruments | Profiling and performance |
| os.Logger | Unified logging |

### CI Essentials

```bash
swift build                  # Build
swift test --parallel        # Run tests
swiftlint --strict           # Static analysis
```

---

## Definition of Done

A Swift feature is complete when:

- [ ] Compiles with zero warnings
- [ ] All tests pass (unit + UI)
- [ ] No force-unwraps without documented justification
- [ ] No `var` where `let` suffices
- [ ] Proper access control applied
- [ ] Structured concurrency used (no raw GCD in new code)
- [ ] SwiftLint reports zero violations
- [ ] No retain cycles verified
- [ ] Accessibility labels on interactive UI
- [ ] Code reviewed and approved
