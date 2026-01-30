# Swift Error Handling

Typed errors, Result, and defensive validation. Make failure states explicit.

## Error Types

```swift
// Domain-specific errors with associated values
enum APIError: Error, LocalizedError {
    case networkUnavailable
    case unauthorized
    case notFound(resource: String, id: String)
    case serverError(statusCode: Int, message: String)
    case decodingFailed(type: String, underlying: Error)
    case rateLimited(retryAfter: TimeInterval)

    var errorDescription: String? {
        switch self {
        case .networkUnavailable:
            "Network connection is unavailable"
        case .unauthorized:
            "Authentication required"
        case .notFound(let resource, let id):
            "\(resource) with ID '\(id)' not found"
        case .serverError(let code, let message):
            "Server error \(code): \(message)"
        case .decodingFailed(let type, let error):
            "Failed to decode \(type): \(error.localizedDescription)"
        case .rateLimited(let retryAfter):
            "Rate limited. Retry after \(retryAfter)s"
        }
    }
}
```

## do/catch

```swift
// Specific error handling
func loadUser(id: UUID) async {
    do {
        let user = try await userService.fetch(id: id)
        self.user = user
    } catch let error as APIError {
        switch error {
        case .notFound:
            self.state = .notFound
        case .unauthorized:
            self.state = .needsLogin
        case .networkUnavailable:
            self.state = .offline
        default:
            self.state = .error(error)
        }
    } catch {
        // Catch-all for unexpected errors
        self.state = .error(AppError.unexpected(error))
    }
}

// try? — convert to optional (use when failure is acceptable)
let cachedImage = try? imageCache.load(key: url.absoluteString)

// try! — only when failure is a programmer error
let regex = try! NSRegularExpression(pattern: "^[a-z]+$")
```

## Result Type

```swift
// Result for synchronous operations
func validate(email: String) -> Result<Email, ValidationError> {
    guard !email.isEmpty else {
        return .failure(.empty("email"))
    }
    guard email.contains("@") else {
        return .failure(.invalidFormat("email"))
    }
    return .success(Email(rawValue: email))
}

// Pattern matching on Result
switch validate(email: input) {
case .success(let email):
    createAccount(email: email)
case .failure(let error):
    showValidationError(error)
}

// Result with map/flatMap
let userName = fetchUser(id: userId)
    .map { $0.name }
    .mapError { AppError.network($0) }
```

## Guard and Preconditions

```swift
// Guard — early exit for invalid state
func processOrder(_ order: Order) throws {
    guard order.items.isEmpty == false else {
        throw OrderError.emptyOrder
    }
    guard order.status == .confirmed else {
        throw OrderError.invalidStatus(order.status)
    }
    guard let paymentMethod = order.paymentMethod else {
        throw OrderError.noPaymentMethod
    }
    // Happy path continues here, all values available
    charge(paymentMethod, for: order)
}

// precondition — programmer errors (removed in -Ounchecked)
func element(at index: Int) -> Element {
    precondition(index >= 0 && index < count, "Index \(index) out of bounds")
    return storage[index]
}

// assert — debug-only checks
func configure(retryCount: Int) {
    assert(retryCount > 0, "retryCount must be positive")
    self.maxRetries = retryCount
}

// fatalError — truly impossible states
func handle(_ state: AppState) {
    switch state {
    case .ready: start()
    case .running: continue_()
    // If new states are added, this will force handling them
    @unknown default:
        fatalError("Unhandled state: \(state)")
    }
}
```

## Typed Throws (Swift 6+)

```swift
// Typed throws — callers know exact error type
func parse(json: Data) throws(ParseError) -> Config {
    guard let dict = try? JSONSerialization.jsonObject(with: json) as? [String: Any] else {
        throw .invalidJSON
    }
    guard let name = dict["name"] as? String else {
        throw .missingField("name")
    }
    return Config(name: name)
}

// Caller gets typed error without casting
do {
    let config = try parse(json: data)
} catch {
    // error is ParseError, not any Error
    switch error {
    case .invalidJSON: handleInvalidJSON()
    case .missingField(let name): handleMissingField(name)
    }
}
```

## Error Recovery Patterns

```swift
// Retry with exponential backoff
func fetchWithRetry<T>(
    maxAttempts: Int = 3,
    operation: () async throws -> T
) async throws -> T {
    var lastError: Error?
    for attempt in 0..<maxAttempts {
        do {
            return try await operation()
        } catch {
            lastError = error
            if attempt < maxAttempts - 1 {
                let delay = pow(2.0, Double(attempt))
                try await Task.sleep(for: .seconds(delay))
            }
        }
    }
    throw lastError!
}

// Fallback chain
func loadAvatar(for user: User) async -> UIImage {
    if let cached = avatarCache[user.id] { return cached }
    if let downloaded = try? await downloadAvatar(user.avatarURL) { return downloaded }
    return UIImage(systemName: "person.circle")!
}
```

## Anti-Patterns

```swift
// Never: catching and ignoring errors
do { try operation() } catch { } // Silent failure
// Use: at minimum, log the error

// Never: using try! on fallible operations
let data = try! Data(contentsOf: fileURL) // Crash on missing file
// Use: do/try/catch or try? with fallback

// Never: throwing generic Error
throw NSError(domain: "", code: 0) // No context
// Use: domain-specific error types

// Never: error types without context
enum AppError: Error { case failed } // Useless for debugging
// Use: associated values with context
```
