# C++ Performance

Measure first. Understand the hardware. Zero-cost abstractions are the goal.

## Profile Before Optimizing

```bash
# perf (Linux)
perf record -g ./myapp
perf report

# Valgrind callgrind
valgrind --tool=callgrind ./myapp
kcachegrind callgrind.out.*

# Google Benchmark for micro-benchmarks
./benchmarks --benchmark_format=console --benchmark_min_time=2s
```

### Tools

| Tool | Purpose |
|------|---------|
| perf | CPU profiling, cache analysis |
| Valgrind/Callgrind | Instruction-level profiling |
| Google Benchmark | Micro-benchmarks |
| Compiler Explorer | Assembly inspection |
| heaptrack | Heap allocation profiling |
| Tracy | Frame profiler (games/real-time) |

## Cache-Friendly Data Structures

```cpp
// Structure of Arrays (SoA) vs Array of Structures (AoS)

// AoS — bad cache utilization when iterating one field
struct Particle {
    float x, y, z;
    float vx, vy, vz;
    float mass;
    int type;
};
std::vector<Particle> particles; // Accesses mass? Loads x,y,z,vx,vy,vz too

// SoA — excellent cache utilization for field-wise iteration
struct Particles {
    std::vector<float> x, y, z;
    std::vector<float> vx, vy, vz;
    std::vector<float> mass;
    std::vector<int> type;
};
// Iterating mass only touches mass data — no waste

// Rule: profile first. SoA matters for hot loops over large datasets.
```

## Allocation Avoidance

```cpp
// Pre-allocate containers
std::vector<Item> items;
items.reserve(expected_count); // One allocation instead of many

// Small buffer optimization (SBO)
// std::string already uses SBO (typically 15-22 chars inline)
// std::function uses SBO for small callables

// Stack allocation for temporary buffers
std::array<char, 256> buffer; // Stack, not heap

// Object pools for frequent allocation/deallocation
template <typename T>
class ObjectPool {
    std::vector<std::unique_ptr<T>> pool_;
    std::vector<T*> available_;

public:
    auto acquire() -> T* {
        if (available_.empty()) {
            pool_.push_back(std::make_unique<T>());
            return pool_.back().get();
        }
        auto* obj = available_.back();
        available_.pop_back();
        return obj;
    }

    void release(T* obj) {
        available_.push_back(obj);
    }
};
```

## Move Semantics for Performance

```cpp
// Move instead of copy for expensive objects
std::vector<std::string> build_names(std::span<const User> users) {
    std::vector<std::string> names;
    names.reserve(users.size());
    for (const auto& user : users) {
        names.push_back(user.name()); // Copy (user is const)
    }
    return names; // NRVO — no copy, no move
}

// Sink parameters: take by value and move
class Widget {
    std::string name_;
public:
    explicit Widget(std::string name) : name_{std::move(name)} {}
    // Caller can copy or move into the parameter
};

// Emplace instead of push_back to construct in-place
items.emplace_back(arg1, arg2); // Constructs directly in vector
items.push_back(Item{arg1, arg2}); // Constructs then moves
```

## constexpr Computation

```cpp
// Move computation to compile time
constexpr auto factorial(int n) -> int {
    int result = 1;
    for (int i = 2; i <= n; ++i) result *= i;
    return result;
}
static_assert(factorial(5) == 120);

// Compile-time lookup tables
constexpr auto build_crc_table() {
    std::array<uint32_t, 256> table{};
    for (uint32_t i = 0; i < 256; ++i) {
        uint32_t crc = i;
        for (int j = 0; j < 8; ++j) {
            crc = (crc >> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
        }
        table[i] = crc;
    }
    return table;
}
constexpr auto crc_table = build_crc_table(); // Computed at compile time
```

## SIMD and Vectorization

```cpp
// Help the compiler auto-vectorize
// 1. Use contiguous containers (vector, array)
// 2. Simple loop bodies without branches
// 3. No pointer aliasing (use __restrict or std::span)

void add_vectors(float* __restrict out,
                 const float* __restrict a,
                 const float* __restrict b,
                 size_t n) {
    for (size_t i = 0; i < n; ++i) {
        out[i] = a[i] + b[i]; // Auto-vectorized by compiler
    }
}

// Verify with: -fopt-info-vec (GCC) or -Rpass=loop-vectorize (Clang)
```

## String Performance

```cpp
// std::string_view for read-only string operations — zero copies
void process(std::string_view input) {
    auto prefix = input.substr(0, 5); // No allocation
    if (input.starts_with("http")) { /* ... */ }
}

// Avoid string concatenation in loops
std::string result;
result.reserve(total_estimated_size);
for (const auto& item : items) {
    result.append(item.name());
    result.push_back(',');
}

// fmt::format or std::format over stringstream
auto msg = fmt::format("User {} logged in from {}", name, ip);
```

## Compiler Optimization Flags

```cmake
# Release build
target_compile_options(${PROJECT_NAME} PRIVATE
    $<$<CONFIG:Release>:-O3 -DNDEBUG -march=native>
    $<$<CONFIG:Debug>:-O0 -g>
    $<$<CONFIG:RelWithDebInfo>:-O2 -g -DNDEBUG>
)

# Link-Time Optimization
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE ON)
```

## Anti-Patterns

```cpp
// Never: premature optimization without profiling
// "I think this allocation is slow" — prove it

// Never: virtual function calls in hot loops (unless measured)
for (auto& item : million_items) {
    item->process(); // vtable lookup every iteration
}
// Consider: CRTP, std::variant, or batch processing

// Never: std::map when std::unordered_map or sorted vector suffices
std::map<std::string, int> counts; // O(log n) lookup, poor cache locality
// Use: std::unordered_map or flat_map (C++23)

// Never: shared_ptr for performance-critical paths
// Atomic reference count operations are expensive
// Use unique_ptr or raw non-owning pointers

// Never: exceptions in hot paths
// Exceptions are zero-cost on the happy path but expensive when thrown
```
