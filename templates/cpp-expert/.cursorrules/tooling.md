# C++ Tooling and Build System

CMake is the standard. Sanitizers are mandatory. Static analysis catches bugs before they ship.

## CMake

### Modern CMake (Target-Based)

```cmake
cmake_minimum_required(VERSION 3.25)
project(myapp VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Main library
add_library(mylib
    src/types.cpp
    src/utils.cpp
)
target_include_directories(mylib PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# Executable
add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE mylib)

# Tests
option(BUILD_TESTING "Build tests" ON)
if(BUILD_TESTING)
    enable_testing()
    add_subdirectory(tests)
endif()
```

### CMake Presets

```json
{
    "version": 6,
    "configurePresets": [
        {
            "name": "dev",
            "generator": "Ninja",
            "binaryDir": "${sourceDir}/build/dev",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Debug",
                "CMAKE_EXPORT_COMPILE_COMMANDS": "ON",
                "ENABLE_SANITIZERS": "ON"
            }
        },
        {
            "name": "release",
            "generator": "Ninja",
            "binaryDir": "${sourceDir}/build/release",
            "cacheVariables": {
                "CMAKE_BUILD_TYPE": "Release",
                "CMAKE_INTERPROCEDURAL_OPTIMIZATION": "ON"
            }
        }
    ],
    "buildPresets": [
        { "name": "dev", "configurePreset": "dev" },
        { "name": "release", "configurePreset": "release" }
    ],
    "testPresets": [
        { "name": "dev", "configurePreset": "dev", "output": { "outputOnFailure": true } }
    ]
}
```

### Essential Commands

```bash
# Configure and build
cmake --preset dev
cmake --build --preset dev

# Run tests
ctest --preset dev

# Clean build
cmake --build --preset dev --target clean

# Install
cmake --install build/release --prefix /usr/local
```

## Package Management

### vcpkg

```json
{
    "dependencies": [
        "fmt",
        "spdlog",
        "catch2",
        "benchmark",
        "nlohmann-json"
    ]
}
```

```cmake
# CMakeLists.txt
find_package(fmt CONFIG REQUIRED)
find_package(spdlog CONFIG REQUIRED)
target_link_libraries(myapp PRIVATE fmt::fmt spdlog::spdlog)
```

### Conan

```ini
# conanfile.txt
[requires]
fmt/10.2.1
spdlog/1.13.0
catch2/3.5.2

[generators]
CMakeDeps
CMakeToolchain
```

## .clang-format

```yaml
BasedOnStyle: Google
IndentWidth: 4
ColumnLimit: 100
PointerAlignment: Left
AllowShortFunctionsOnASingleLine: Inline
AllowShortIfStatementsOnASingleLine: Never
AllowShortLoopsOnASingleLine: false
BreakBeforeBraces: Attach
IncludeBlocks: Regroup
SortIncludes: CaseSensitive
SpaceAfterCStyleCast: false
```

```bash
# Format all files
find src include tests -name '*.cpp' -o -name '*.hpp' | xargs clang-format -i

# CI check
find src include tests -name '*.cpp' -o -name '*.hpp' | xargs clang-format --dry-run --Werror
```

## .clang-tidy

```yaml
Checks: >
    -*,
    bugprone-*,
    clang-analyzer-*,
    cppcoreguidelines-*,
    misc-*,
    modernize-*,
    performance-*,
    readability-*,
    -modernize-use-trailing-return-type,
    -readability-identifier-length

WarningsAsErrors: '*'

CheckOptions:
    - key: readability-identifier-naming.ClassCase
      value: CamelCase
    - key: readability-identifier-naming.FunctionCase
      value: lower_case
    - key: readability-identifier-naming.VariableCase
      value: lower_case
    - key: readability-identifier-naming.PrivateMemberSuffix
      value: '_'
```

```bash
# Run clang-tidy
clang-tidy -p build/dev src/*.cpp -- -std=c++20

# With CMake integration
set(CMAKE_CXX_CLANG_TIDY "clang-tidy")
```

## Docker

```dockerfile
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y \
    cmake ninja-build g++-14 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY CMakeLists.txt CMakePresets.json vcpkg.json ./
COPY include/ include/
COPY src/ src/

RUN cmake --preset release && cmake --build --preset release

FROM ubuntu:24.04 AS runtime
RUN useradd -m appuser
USER appuser
COPY --from=build /app/build/release/myapp /usr/local/bin/
ENTRYPOINT ["myapp"]
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
    strategy:
      matrix:
        os: [ubuntu-latest]
        compiler: [gcc-14, clang-18]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y ninja-build ${{ matrix.compiler }}

      - name: Configure
        run: cmake --preset dev
        env:
          CXX: ${{ matrix.compiler == 'gcc-14' && 'g++-14' || 'clang++-18' }}

      - name: Build
        run: cmake --build --preset dev

      - name: Test
        run: ctest --preset dev

      - name: clang-format check
        run: |
          find src include tests -name '*.cpp' -o -name '*.hpp' | \
            xargs clang-format --dry-run --Werror

      - name: clang-tidy
        run: |
          clang-tidy -p build/dev src/*.cpp -- -std=c++20

  sanitizers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        sanitizer: [address, thread]

    steps:
      - uses: actions/checkout@v4
      - name: Build with sanitizer
        run: |
          cmake -B build -DCMAKE_BUILD_TYPE=Debug \
            -DCMAKE_CXX_FLAGS="-fsanitize=${{ matrix.sanitizer }} -fno-omit-frame-pointer"
          cmake --build build
      - name: Test with sanitizer
        run: ctest --test-dir build --output-on-failure
```

## Logging (spdlog)

```cpp
#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
#include <spdlog/sinks/rotating_file_sink.h>

auto logger = spdlog::stdout_color_mt("app");
logger->set_level(spdlog::level::info);

logger->info("Server starting on port {}", port);
logger->warn("Connection pool at {}% capacity", utilization);
logger->error("Failed to process order {}: {}", order_id, ec.message());

// Structured logging with fmt
spdlog::info("request method={} path={} status={} duration_ms={}",
    method, path, status, duration.count());
```

## Anti-Patterns

```cpp
// Never: hand-written Makefiles for complex projects
// Use CMake with presets

// Never: header-only for everything (compile time explosion)
// Use compilation units, forward declarations, and pimpl

// Never: skipping sanitizers in CI
// ASan + UBSan + TSan catch real bugs that tests miss

// Never: -Wno-* to suppress warnings without fixing
// Fix the code, don't silence the compiler

// Never: system-installed dependencies without version pinning
// Use vcpkg, Conan, or FetchContent with pinned versions
```
