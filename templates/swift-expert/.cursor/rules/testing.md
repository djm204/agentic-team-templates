# Swift Testing

XCTest, Swift Testing framework, and UI testing. Test behavior with expressive assertions.

## Framework Stack

| Tool | Purpose |
|------|---------|
| Swift Testing | Modern test framework (Swift 5.10+) |
| XCTest | Traditional test framework |
| ViewInspector | SwiftUI view testing |
| XCUITest | UI automation testing |
| swift-snapshot-testing | Snapshot/screenshot testing |
| OHHTTPStubs / URLProtocol | Network mocking |

## Swift Testing Framework

```swift
import Testing

@Suite("UserService")
struct UserServiceTests {
    let sut: UserService
    let mockRepo: MockUserRepository

    init() {
        mockRepo = MockUserRepository()
        sut = UserService(repository: mockRepo)
    }

    @Test("creates user with valid input")
    func createUserValid() async throws {
        let request = CreateUserRequest(name: "Alice", email: "alice@test.com")

        let user = try await sut.create(request)

        #expect(user.name == "Alice")
        #expect(user.email == "alice@test.com")
        #expect(user.id != UUID())
    }

    @Test("rejects duplicate email")
    func rejectsDuplicateEmail() async {
        mockRepo.existingEmails = ["alice@test.com"]
        let request = CreateUserRequest(name: "Alice", email: "alice@test.com")

        await #expect(throws: ValidationError.duplicateEmail) {
            try await sut.create(request)
        }
    }

    @Test("validates email format", arguments: [
        "invalid",
        "@missing.local",
        "no-at-sign",
        "",
    ])
    func invalidEmails(email: String) async {
        let request = CreateUserRequest(name: "Test", email: email)

        await #expect(throws: ValidationError.invalidEmail) {
            try await sut.create(request)
        }
    }
}
```

## XCTest (Traditional)

```swift
final class OrderServiceTests: XCTestCase {
    private var sut: OrderService!
    private var mockInventory: MockInventoryClient!

    override func setUp() {
        super.setUp()
        mockInventory = MockInventoryClient()
        sut = OrderService(inventory: mockInventory)
    }

    override func tearDown() {
        sut = nil
        mockInventory = nil
        super.tearDown()
    }

    func test_createOrder_withValidItems_succeeds() async throws {
        // Arrange
        mockInventory.availableStock = ["SKU-001": 10]
        let request = CreateOrderRequest(items: [.init(sku: "SKU-001", quantity: 2)])

        // Act
        let order = try await sut.create(request)

        // Assert
        XCTAssertEqual(order.items.count, 1)
        XCTAssertEqual(order.status, .pending)
        XCTAssertEqual(mockInventory.reserveCalls.count, 1)
    }

    func test_createOrder_withInsufficientStock_throws() async {
        mockInventory.availableStock = ["SKU-001": 0]
        let request = CreateOrderRequest(items: [.init(sku: "SKU-001", quantity: 5)])

        do {
            _ = try await sut.create(request)
            XCTFail("Expected OrderError.insufficientStock")
        } catch let error as OrderError {
            XCTAssertEqual(error, .insufficientStock("SKU-001"))
        } catch {
            XCTFail("Unexpected error: \(error)")
        }
    }
}
```

## Async Testing

```swift
// Swift Testing — async is native
@Test func fetchUsers() async throws {
    let users = try await sut.fetchAll()
    #expect(users.count == 3)
}

// XCTest — async/await support
func test_fetchUsers() async throws {
    let users = try await sut.fetchAll()
    XCTAssertEqual(users.count, 3)
}

// Testing with timeouts (XCTest)
func test_longRunningOperation() async throws {
    let expectation = expectation(description: "completes")

    Task {
        _ = try await sut.processLargeDataset()
        expectation.fulfill()
    }

    await fulfillment(of: [expectation], timeout: 10)
}
```

## Mocking with Protocols

```swift
// Protocol-based dependency
protocol UserRepository {
    func findById(_ id: UUID) async throws -> User?
    func save(_ user: User) async throws -> User
    func delete(_ id: UUID) async throws
}

// Mock implementation
final class MockUserRepository: UserRepository {
    var users: [UUID: User] = [:]
    var saveCalls: [User] = []
    var deleteCalls: [UUID] = []
    var findByIdError: Error?

    func findById(_ id: UUID) async throws -> User? {
        if let error = findByIdError { throw error }
        return users[id]
    }

    func save(_ user: User) async throws -> User {
        saveCalls.append(user)
        users[user.id] = user
        return user
    }

    func delete(_ id: UUID) async throws {
        deleteCalls.append(id)
        users.removeValue(forKey: id)
    }
}
```

## Network Mocking

```swift
// URLProtocol-based mock
class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.requestHandler else {
            fatalError("requestHandler not set")
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

// Usage in tests
func test_fetchUser_decodesResponse() async throws {
    let userData = try JSONEncoder().encode(User.preview)
    MockURLProtocol.requestHandler = { request in
        let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
        return (response, userData)
    }

    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)
    let client = APIClient(session: session)

    let user = try await client.fetchUser(id: UUID())
    XCTAssertEqual(user.name, "Jane Doe")
}
```

## UI Testing

```swift
final class LoginUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app.launchArguments = ["--uitesting"]
        app.launch()
    }

    func test_loginFlow_withValidCredentials() {
        let emailField = app.textFields["email-field"]
        emailField.tap()
        emailField.typeText("user@test.com")

        let passwordField = app.secureTextFields["password-field"]
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["login-button"].tap()

        XCTAssertTrue(app.staticTexts["welcome-label"].waitForExistence(timeout: 5))
    }
}
```

## Test Naming

```swift
// XCTest: test_[method]_[condition]_[expected]
func test_validate_emptyEmail_throwsValidationError()
func test_create_validRequest_returnsNewUser()
func test_delete_nonexistentUser_throwsNotFound()

// Swift Testing: descriptive strings
@Test("validates email format rejects empty string")
@Test("creates user with all required fields")
@Test("deletes existing user successfully")
```

## Anti-Patterns

```swift
// Never: testing implementation details
XCTAssertEqual(viewModel.fetchCallCount, 1) // Fragile
// Test the observable outcome instead

// Never: shared mutable state between tests
static var sharedDatabase = Database() // Tests affect each other
// Use: setUp/tearDown for fresh state

// Never: testing with real network calls
let user = try await realAPIClient.fetchUser(id: uuid) // Flaky
// Use: protocol mocking or URLProtocol

// Never: sleeping in tests
try await Task.sleep(for: .seconds(2)) // Slow and flaky
// Use: expectations with timeouts, or test schedulers
```
