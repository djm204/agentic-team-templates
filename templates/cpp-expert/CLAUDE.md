# C++ Expert Development Guide

Principal-level guidelines for C++ engineering. Deep language mastery, zero-cost abstractions, and systems-level thinking.

---

## Overview

This guide applies to:
- Systems programming (OS, drivers, embedded)
- High-performance computing and real-time systems
- Game engines and graphics programming
- Networking and server infrastructure
- Libraries and frameworks
- Scientific computing and simulation

### Core Philosophy

C++ gives you control. That control comes with responsibility. Write code that is correct, clear, and fast — in that order.

- **Resource management is automatic.** RAII is not optional — every resource has an owner, every owner has a destructor.
- **Zero-cost abstractions are the goal.** If an abstraction adds runtime overhead you don't need, you're using the wrong abstraction.
- **The type system is your strongest tool.** Use it to make invalid states unrepresentable at compile time.
- **Undefined behavior is a bug, period.** No shortcuts. No "it works on my machine."
- **Modern C++ is the baseline.** C++17 minimum, C++20/23 features where they improve clarity.
- **If you don't know, say so.** Admitting uncertainty about compiler behavior, ABI details, or standard wording is professional.

### Key Principles

1. **RAII Everywhere** — Every resource acquisition is an initialization, every release is a destruction
2. **Value Semantics by Default** — Copy, move, compare. References and pointers are the exception
3. **const Correctness** — If it doesn't mutate, it's `const`. No exceptions
4. **Prefer the Standard Library** — `std::vector`, `std::string`, `std::optional`, `std::variant`
5. **Compile-Time Over Runtime** — `constexpr`, `static_assert`, `concepts`

### Project Structure

```
project/
├── include/mylib/            # Public headers
├── src/                      # Implementation files
├── tests/                    # Test files
├── benchmarks/               # Performance benchmarks
├── cmake/                    # CMake modules
├── CMakeLists.txt
├── CMakePresets.json
├── .clang-format
├── .clang-tidy
└── vcpkg.json or conanfile.txt
```

---

## Modern C++

### std::optional, std::variant, std::expected

```cpp
std::optional<User> find_user(std::string_view email);

using JsonValue = std::variant<std::nullptr_t, bool, double, std::string>;

auto parse_port(std::string_view input) -> std::expected<uint16_t, ParseError>;
```

### Concepts (C++20)

```cpp
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
auto clamp(T value, T low, T high) -> T;
```

### Ranges (C++20)

```cpp
auto result = users
    | std::views::filter(&User::is_active)
    | std::views::transform(&User::email)
    | std::ranges::to<std::vector>();
```

---

## Memory and Ownership

### Smart Pointers

- `std::unique_ptr` — Single ownership (default choice, zero overhead)
- `std::shared_ptr` — Shared ownership (rare, atomic ref count overhead)
- Raw pointer — Non-owning reference only

### Rules

- No raw `new`/`delete` in application code
- RAII for every resource (files, sockets, mutexes, memory)
- Rule of Zero: prefer classes that need no custom special members
- Rule of Five: if you need one custom special member, define all five
- Move semantics for efficient transfers

```cpp
auto widget = std::make_unique<Widget>(42);
auto shared = std::make_shared<Resource>();
```

---

## Concurrency

### Core Rules

- Immutable data is thread-safe — share via `const` references
- Every mutable shared state needs synchronization
- `std::jthread` (C++20) — automatically joins on destruction
- `std::scoped_lock` — deadlock-free multi-mutex locking
- `std::atomic` for single variables, `std::mutex` for compound operations

```cpp
auto worker = std::jthread([](std::stop_token stop) {
    while (!stop.stop_requested()) { /* work */ }
});
```

### Parallel Algorithms

```cpp
std::sort(std::execution::par, data.begin(), data.end());
```

---

## Error Handling

### Exception Safety Guarantees

1. **No-throw** — Function never throws. Mark `noexcept`.
2. **Strong** — If exception thrown, state rolls back.
3. **Basic** — Invariants preserved, no leaks.

### std::expected (C++23)

```cpp
auto result = validate(input)
    .and_then([&](auto v) { return save(db, v); })
    .transform([](auto s) { return Response::from(s); });
```

### Rules

- Throw by value, catch by const reference
- `noexcept` on destructors, move operations, swap
- `static_assert` for compile-time invariants
- Never throw in destructors

---

## Testing

### Framework Stack

| Tool | Purpose |
|------|---------|
| Google Test / Catch2 | Test framework |
| Google Mock | Mocking |
| Google Benchmark | Micro-benchmarks |
| ASan | Address sanitizer |
| UBSan | Undefined behavior sanitizer |
| TSan | Thread sanitizer |
| Valgrind | Memory leak detection |

### Sanitizers Are Mandatory

```bash
cmake -B build -DENABLE_SANITIZERS=ON
cmake --build build && ctest --test-dir build
```

Every sanitizer finding is a real bug. No exceptions.

---

## Performance

### Profile First

```bash
perf record -g ./myapp && perf report
```

### Key Patterns

- Cache-friendly data structures (SoA vs AoS for hot loops)
- Pre-allocate containers with `reserve()`
- Move semantics to avoid copies
- `constexpr` computation at compile time
- Help auto-vectorization with simple loops and `__restrict`
- `std::string_view` for zero-copy string operations

---

## Tooling

### Essential Stack

| Tool | Purpose |
|------|---------|
| CMake + Ninja | Build system |
| vcpkg / Conan | Package management |
| clang-format | Code formatting |
| clang-tidy | Static analysis |
| Sanitizers | Runtime bug detection |
| perf / Valgrind | Profiling |
| spdlog | Structured logging |

### CI Essentials

```bash
cmake --preset dev && cmake --build --preset dev
ctest --preset dev
clang-format --dry-run --Werror src/*.cpp
clang-tidy -p build/dev src/*.cpp
```

---

## Definition of Done

A C++ feature is complete when:

- [ ] Compiles with zero warnings under `-Wall -Wextra -Wpedantic -Werror`
- [ ] All tests pass (unit, integration)
- [ ] Sanitizers pass (ASan, UBSan, TSan)
- [ ] `clang-tidy` reports zero findings
- [ ] No undefined behavior
- [ ] No memory leaks
- [ ] `const` correctness enforced
- [ ] RAII used for all resource management
- [ ] No raw `new`/`delete` in application code
- [ ] Exception safety guarantees documented
- [ ] Code reviewed and approved
