# Swift Tooling and Build System

Swift Package Manager, Xcode, static analysis, and CI/CD pipelines.

## Swift Package Manager

```swift
// Package.swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyApp",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(name: "MyAppCore", targets: ["MyAppCore"]),
        .executable(name: "MyAppCLI", targets: ["MyAppCLI"])
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.0"),
        .package(url: "https://github.com/apple/swift-log", from: "1.5.0"),
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.15.0"),
    ],
    targets: [
        .target(
            name: "MyAppCore",
            dependencies: [
                .product(name: "Logging", package: "swift-log"),
            ]
        ),
        .executableTarget(
            name: "MyAppCLI",
            dependencies: [
                "MyAppCore",
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
            ]
        ),
        .testTarget(
            name: "MyAppCoreTests",
            dependencies: [
                "MyAppCore",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing"),
            ]
        ),
    ]
)
```

## Essential Commands

```bash
# Build
swift build                          # Debug build
swift build -c release               # Release build
xcodebuild -scheme MyApp build       # Xcode build

# Test
swift test                           # Run all tests
swift test --filter UserServiceTests # Run specific suite
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16'

# Run
swift run MyAppCLI                   # Run executable target
swift run MyAppCLI -- --help         # Pass arguments

# Dependencies
swift package resolve                # Resolve dependencies
swift package update                 # Update to latest compatible
swift package show-dependencies      # Dependency tree

# Format and lint
swift format . --recursive           # swift-format
swiftlint                           # SwiftLint analysis
swiftlint --fix                     # Auto-fix violations
```

## SwiftLint

```yaml
# .swiftlint.yml
opt_in_rules:
  - empty_count
  - closure_spacing
  - contains_over_filter_count
  - discouraged_optional_boolean
  - explicit_init
  - fatal_error_message
  - first_where
  - force_unwrapping
  - implicit_return
  - joined_default_parameter
  - last_where
  - overridden_super_call
  - private_action
  - private_outlet
  - redundant_nil_coalescing
  - sorted_first_last
  - unowned_variable_capture
  - vertical_whitespace_closing_braces

disabled_rules:
  - trailing_comma

force_cast: error
force_try: error
force_unwrapping: warning

line_length:
  warning: 120
  error: 200

type_body_length:
  warning: 300
  error: 500

file_length:
  warning: 500
  error: 1000

function_body_length:
  warning: 40
  error: 80

excluded:
  - Pods
  - .build
  - DerivedData
```

## Xcode Project Configuration

```
Build Settings (recommended):
- SWIFT_STRICT_CONCURRENCY = complete    # Full Sendable checking
- SWIFT_VERSION = 6.0
- ENABLE_STRICT_OBJC_MSGSEND = YES
- GCC_TREAT_WARNINGS_AS_ERRORS = YES     # Zero-warning policy
- SWIFT_TREAT_WARNINGS_AS_ERRORS = YES
```

## CI/CD (GitHub Actions)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: macos-14

    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_16.0.app

      - name: Build
        run: |
          xcodebuild build \
            -scheme MyApp \
            -destination 'platform=iOS Simulator,name=iPhone 16' \
            -skipPackagePluginValidation

      - name: Test
        run: |
          xcodebuild test \
            -scheme MyApp \
            -destination 'platform=iOS Simulator,name=iPhone 16' \
            -resultBundlePath TestResults.xcresult \
            -skipPackagePluginValidation

      - name: SwiftLint
        run: |
          brew install swiftlint
          swiftlint --strict

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: TestResults.xcresult

  # SPM-only projects
  spm-test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_16.0.app
      - name: Build and test
        run: swift test --parallel
```

## Logging

```swift
import os

// Unified logging (Apple platforms)
private let logger = Logger(subsystem: "com.example.myapp", category: "networking")

logger.info("Fetching user \(userId, privacy: .public)")
logger.debug("Response: \(data.count) bytes")
logger.error("Request failed: \(error.localizedDescription, privacy: .public)")

// Log levels: debug, info, notice, error, fault
// debug/info are not persisted by default — minimal performance cost

// swift-log (cross-platform / server)
import Logging

var logger = Logger(label: "com.example.myapp")
logger[metadataKey: "requestId"] = "\(requestId)"
logger.info("Processing request", metadata: ["userId": "\(userId)"])
```

## Networking (URLSession)

```swift
// Modern URLSession with async/await
actor APIClient {
    private let session: URLSession
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.session = session
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = URLRequest(url: endpoint.url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.serverError(
                statusCode: httpResponse.statusCode,
                message: String(data: data, encoding: .utf8) ?? ""
            )
        }

        return try decoder.decode(T.self, from: data)
    }
}
```

## Anti-Patterns

```swift
// Never: print() for logging in production
print("User logged in: \(user.id)") // No levels, no filtering, stdout only
// Use: os.Logger or swift-log

// Never: ignoring SwiftLint in CI
// Static analysis catches real bugs and code smells

// Never: hardcoded strings for UI
Text("Welcome back!") // Not localizable
// Use: String(localized: "welcome_back")

// Never: Cocoapods for new projects (when SPM works)
// SPM is the standard. Use Cocoapods only for libraries without SPM support
```
