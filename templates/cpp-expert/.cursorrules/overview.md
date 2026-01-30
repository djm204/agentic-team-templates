# C++ Expert Overview

Principal-level C++ engineering. Deep language mastery, zero-cost abstractions, and systems-level thinking.

## Scope

This guide applies to:
- Systems programming (OS, drivers, embedded)
- High-performance computing and real-time systems
- Game engines and graphics programming
- Networking and server infrastructure
- Libraries and frameworks
- Scientific computing and simulation

## Core Philosophy

C++ gives you control. That control comes with responsibility. Write code that is correct, clear, and fast — in that order.

- **Resource management is automatic.** RAII is not optional — every resource has an owner, every owner has a destructor.
- **Zero-cost abstractions are the goal.** If an abstraction adds runtime overhead you don't need, you're using the wrong abstraction.
- **The type system is your strongest tool.** Use it to make invalid states unrepresentable at compile time.
- **Undefined behavior is a bug, period.** No shortcuts. No "it works on my machine." UB is the enemy.
- **Modern C++ is the baseline.** C++17 minimum, C++20/23 features where they improve clarity.
- **If you don't know, say so.** Admitting uncertainty about compiler behavior, ABI details, or standard wording is professional.

## Key Principles

1. **RAII Everywhere** — Every resource acquisition is an initialization, every release is a destruction
2. **Value Semantics by Default** — Copy, move, compare. References and pointers are the exception
3. **const Correctness** — If it doesn't mutate, it's `const`. No exceptions
4. **Prefer the Standard Library** — `std::vector`, `std::string`, `std::optional`, `std::variant` before rolling your own
5. **Compile-Time Over Runtime** — `constexpr`, `static_assert`, `concepts` — catch bugs before the program runs

## Project Structure

```
project/
├── include/mylib/            # Public headers
│   ├── mylib.hpp             # Main include
│   ├── types.hpp
│   └── utils.hpp
├── src/                      # Implementation files
│   ├── main.cpp
│   ├── types.cpp
│   └── utils.cpp
├── tests/                    # Test files
│   ├── test_types.cpp
│   └── test_utils.cpp
├── benchmarks/               # Performance benchmarks
├── third_party/              # Vendored dependencies
├── cmake/                    # CMake modules
│   └── CompilerWarnings.cmake
├── CMakeLists.txt
├── CMakePresets.json
├── .clang-format
├── .clang-tidy
└── conanfile.txt or vcpkg.json
```

## Compiler Warnings

```cmake
# Treat warnings as errors — non-negotiable
target_compile_options(${PROJECT_NAME} PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W4 /WX /permissive->
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall -Wextra -Wpedantic -Werror
        -Wshadow -Wconversion -Wsign-conversion -Wnon-virtual-dtor
        -Wold-style-cast -Wcast-align -Wunused -Woverloaded-virtual
        -Wnull-dereference -Wdouble-promotion -Wformat=2>
)
```

## Definition of Done

A C++ feature is complete when:

- [ ] Compiles with zero warnings under `-Wall -Wextra -Wpedantic -Werror`
- [ ] All tests pass (unit, integration)
- [ ] Sanitizers pass (ASan, UBSan, TSan)
- [ ] `clang-tidy` reports zero findings
- [ ] No undefined behavior (verified with sanitizers)
- [ ] No memory leaks (verified with ASan or Valgrind)
- [ ] `const` correctness enforced
- [ ] RAII used for all resource management
- [ ] No raw `new`/`delete` in application code
- [ ] Exception safety guarantees documented
- [ ] Code reviewed and approved
