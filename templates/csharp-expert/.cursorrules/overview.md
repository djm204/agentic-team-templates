# C# Expert Overview

Principal-level C# engineering. Deep .NET runtime knowledge, modern language features, and production-grade patterns.

## Scope

This guide applies to:
- Web APIs and services (ASP.NET Core, Minimal APIs)
- Desktop and cross-platform applications (WPF, MAUI, Avalonia)
- Cloud-native services (Azure Functions, Worker Services)
- Libraries and NuGet packages
- Real-time systems (SignalR, gRPC)
- Background processing (Hosted Services, message consumers)

## Core Philosophy

C# is a language of deliberate design. Every feature exists for a reason — use the right tool for the job.

- **Type safety is your first line of defense.** Nullable reference types enabled, warnings as errors.
- **Composition over inheritance.** Interfaces, extension methods, and dependency injection — not deep class hierarchies.
- **Async all the way down.** Never block on async code. Never use `.Result` or `.Wait()` in application code.
- **The framework does the heavy lifting.** ASP.NET Core's middleware pipeline, DI container, and configuration system are battle-tested — use them.
- **Measure before you optimize.** BenchmarkDotNet and dotnet-counters before rewriting anything.
- **If you don't know, say so.** Admitting uncertainty is professional. Guessing at runtime behavior you haven't verified is not.

## Key Principles

1. **Nullable Reference Types Are Non-Negotiable** — `<Nullable>enable</Nullable>` in every project
2. **Prefer Records for Data** — Immutable by default, value semantics, concise syntax
3. **Dependency Injection Is the Architecture** — Constructor injection, interface segregation, composition root
4. **Errors Are Explicit** — Result patterns for expected failures, exceptions for exceptional conditions
5. **Tests Describe Behavior** — Not implementation details

## Project Structure

```
Solution/
├── src/
│   ├── MyApp.Api/              # ASP.NET Core host (thin — wiring only)
│   │   ├── Program.cs          # Composition root
│   │   ├── Endpoints/          # Minimal API endpoint definitions
│   │   └── Middleware/         # Custom middleware
│   ├── MyApp.Application/      # Use cases, commands, queries (no framework deps)
│   │   ├── Commands/
│   │   ├── Queries/
│   │   └── Interfaces/
│   ├── MyApp.Domain/           # Core domain (zero dependencies)
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   └── Events/
│   └── MyApp.Infrastructure/   # External concerns (DB, HTTP, messaging)
│       ├── Persistence/
│       ├── Services/
│       └── Configuration/
├── tests/
│   ├── MyApp.UnitTests/
│   ├── MyApp.IntegrationTests/
│   └── MyApp.ArchitectureTests/
├── Directory.Build.props       # Shared project settings
├── .editorconfig               # Code style enforcement
└── MyApp.sln
```

## Directory.Build.props

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
  </PropertyGroup>
</Project>
```

## Definition of Done

A C# feature is complete when:

- [ ] `dotnet build --warnaserror` passes with zero warnings
- [ ] `dotnet test` passes with no failures
- [ ] Nullable reference types produce no warnings
- [ ] No `#pragma warning disable` without inline justification
- [ ] Async methods don't block (no `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`)
- [ ] All public APIs have XML documentation comments
- [ ] Error paths are tested
- [ ] DI registrations verified (no missing services at runtime)
- [ ] No `TODO` without an associated issue
- [ ] Code reviewed and approved
