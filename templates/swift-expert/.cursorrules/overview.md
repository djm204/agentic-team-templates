# Swift Expert Overview

Principal-level Swift engineering. Deep language mastery, protocol-oriented design, concurrency, and Apple platform expertise.

## Scope

This guide applies to:
- iOS and iPadOS applications (UIKit, SwiftUI)
- macOS applications (AppKit, SwiftUI)
- watchOS and tvOS applications
- Server-side Swift (Vapor, Hummingbird)
- Swift packages and frameworks
- Command-line tools

## Core Philosophy

Swift is a safe, fast, and expressive language. Use its type system to make invalid states unrepresentable.

- **Safety is the foundation.** Optionals, value types, and the compiler are your first line of defense
- **Protocol-oriented design.** Prefer protocols and composition over class inheritance
- **Value semantics by default.** Structs over classes unless you need reference semantics
- **Concurrency is structured.** async/await, actors, and task groups — not GCD callbacks
- **Expressiveness without obscurity.** Clear is better than clever
- **If you don't know, say so.** Admitting uncertainty is professional

## Key Principles

1. **Optionals Are Not Enemies** — Embrace `Optional`. Never force-unwrap without proof. Use `guard`, `if let`, `map`, `flatMap`
2. **Value Types by Default** — Structs, enums, tuples. Classes only when identity or reference semantics are required
3. **Protocol-Oriented Design** — Small, focused protocols. Default implementations via extensions. Composition over inheritance
4. **Structured Concurrency** — `async`/`await`, `TaskGroup`, actors. No completion handler callbacks in new code
5. **Exhaustive Pattern Matching** — `switch` on enums is exhaustive. The compiler enforces completeness

## Project Structure

```
MyApp/
├── Sources/
│   ├── App/
│   │   ├── MyAppApp.swift
│   │   └── AppDelegate.swift
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── Views/
│   │   │   ├── ViewModels/
│   │   │   └── Models/
│   │   └── Home/
│   ├── Core/
│   │   ├── Networking/
│   │   ├── Persistence/
│   │   └── Extensions/
│   └── Shared/
│       ├── Components/
│       └── Utilities/
├── Tests/
│   ├── UnitTests/
│   ├── IntegrationTests/
│   └── UITests/
├── Package.swift (or .xcodeproj)
└── README.md
```

## API Design Guidelines

Follow Swift's official API Design Guidelines:

- **Clarity at the point of use** is the most important goal
- **Omit needless words** — every word should convey information
- **Name according to roles**, not types: `let greeting: String` not `let greetingString: String`
- **Label closure parameters**: `func filter(_ isIncluded: (Element) -> Bool)`
- **Boolean properties** read as assertions: `isEmpty`, `hasChildren`, `canBecomeFirstResponder`
- **Mutating/nonmutating pairs**: `sort()`/`sorted()`, `append()`/`appending()`
- **Protocols describing capabilities** end in `-able`, `-ible`, or `-ing`: `Equatable`, `Codable`, `Sendable`

## Definition of Done

A Swift feature is complete when:

- [ ] Compiles with zero warnings
- [ ] All tests pass (unit + UI)
- [ ] No force-unwraps (`!`) without documented justification
- [ ] No `var` where `let` suffices
- [ ] Proper access control (`private`, `internal`, `public`)
- [ ] Concurrency code uses structured concurrency (no raw GCD in new code)
- [ ] SwiftLint reports zero violations
- [ ] No retain cycles (weak/unowned references verified)
- [ ] Accessibility labels on all interactive UI elements
- [ ] Code reviewed and approved
