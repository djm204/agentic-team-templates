# Kotlin Expert Overview

Principal-level Kotlin engineering. Deep language mastery, coroutines, multiplatform, and idiomatic patterns.

## Scope

This guide applies to:
- Backend services (Ktor, Spring Boot, Quarkus)
- Android applications (Jetpack Compose, Architecture Components)
- Kotlin Multiplatform (KMP) — shared code across Android, iOS, web, desktop
- CLI tools and scripting
- Libraries and Maven/Gradle artifacts
- Data processing and streaming

## Core Philosophy

Kotlin is a pragmatic language. It gives you safety, expressiveness, and interoperability — use all three.

- **Null safety is the foundation.** The type system distinguishes nullable from non-nullable. Respect it — no `!!` without proof.
- **Immutability by default.** `val` over `var`, immutable collections, data classes. Mutation is explicit and intentional.
- **Conciseness without cleverness.** Kotlin lets you write less code. That doesn't mean you should write unreadable code.
- **Coroutines are structured.** Structured concurrency is not optional — every coroutine has a scope, every scope has a lifecycle.
- **Interop is a feature, not a compromise.** Kotlin's Java interop is seamless. Use Java libraries freely, but write Kotlin idiomatically.
- **If you don't know, say so.** Admitting uncertainty is professional. Guessing at coroutine behavior you haven't verified is not.

## Key Principles

1. **Null Safety Is Non-Negotiable** — No `!!` without documented justification. Use safe calls, elvis, and smart casts
2. **Immutability by Default** — `val`, `List` (not `MutableList`), `data class`, `copy()`
3. **Structured Concurrency** — Every coroutine lives in a scope. No `GlobalScope`. No fire-and-forget
4. **Extension Functions Over Utility Classes** — Extend types at the call site, not in static helpers
5. **Sealed Types for State Modeling** — Exhaustive `when` expressions, impossible states are compile errors

## Project Structure

```
project/
├── src/main/kotlin/com/example/myapp/
│   ├── Application.kt              # Entry point
│   ├── config/                      # Configuration
│   ├── domain/                      # Core domain (no framework deps)
│   │   ├── model/                   # Data classes, value objects, sealed types
│   │   ├── service/                 # Domain services
│   │   └── event/                   # Domain events
│   ├── application/                 # Use cases, orchestration
│   │   ├── command/
│   │   ├── query/
│   │   └── port/                    # Interfaces
│   ├── infrastructure/              # External concerns
│   │   ├── persistence/             # Database (Exposed, JPA, R2DBC)
│   │   ├── messaging/               # Kafka, RabbitMQ
│   │   └── client/                  # HTTP clients
│   └── api/                         # REST/gRPC endpoints
│       ├── route/                   # Ktor routes or Spring controllers
│       └── dto/                     # Request/response models
├── src/test/kotlin/com/example/myapp/
│   ├── unit/
│   ├── integration/
│   └── architecture/
├── build.gradle.kts
└── Dockerfile
```

## Definition of Done

A Kotlin feature is complete when:

- [ ] Compiles with zero warnings (`-Werror` or `allWarningsAsErrors = true`)
- [ ] All tests pass
- [ ] No `!!` without documented justification
- [ ] No `var` where `val` suffices
- [ ] No `MutableList`/`MutableMap` exposed in public APIs
- [ ] Coroutines use structured concurrency (no `GlobalScope`)
- [ ] Nullable types handled explicitly (no suppressed warnings)
- [ ] Detekt reports zero findings
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
