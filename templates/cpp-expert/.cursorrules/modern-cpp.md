# Modern C++ Language Features

C++17/20/23 features used deliberately. Every feature exists for safety, clarity, or performance.

## Core Type System

### auto and Type Deduction

```cpp
// Good: auto when the type is obvious from context
auto name = std::string{"Alice"};
auto count = static_cast<size_t>(items.size());
auto it = container.find(key);
auto ptr = std::make_unique<Widget>(42);

// Good: trailing return types for complex deductions
template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}

// Bad: auto when it obscures the type
auto result = process(data); // What is result? Reader must look up process()
// Prefer explicit type when clarity matters
ProcessResult result = process(data);
```

### std::optional

```cpp
// Return type for "might not exist"
std::optional<User> find_user(std::string_view email) {
    auto it = users_.find(std::string{email});
    if (it == users_.end()) return std::nullopt;
    return it->second;
}

// Usage
if (auto user = find_user(email); user.has_value()) {
    process(*user);
}

// Or with value_or
auto name = find_user(email)
    .transform([](const User& u) { return u.name(); })
    .value_or("Unknown");
```

### std::variant

```cpp
// Type-safe union — the C++ discriminated union
using JsonValue = std::variant<
    std::nullptr_t,
    bool,
    double,
    std::string,
    std::vector<JsonValue>,
    std::map<std::string, JsonValue>>;

// Visit with overloaded lambdas
auto to_string(const JsonValue& value) -> std::string {
    return std::visit(overloaded{
        [](std::nullptr_t) { return std::string{"null"}; },
        [](bool b) { return b ? std::string{"true"} : std::string{"false"}; },
        [](double d) { return std::to_string(d); },
        [](const std::string& s) { return "\"" + s + "\""; },
        [](const auto&) { return std::string{"[complex]"}; }
    }, value);
}

// The overloaded helper
template<class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template<class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;
```

### std::expected (C++23)

```cpp
// Result type — like Rust's Result
enum class ParseError { empty_input, invalid_format, out_of_range };

auto parse_port(std::string_view input) -> std::expected<uint16_t, ParseError> {
    if (input.empty()) return std::unexpected{ParseError::empty_input};

    int value = 0;
    auto [ptr, ec] = std::from_chars(input.data(), input.data() + input.size(), value);

    if (ec != std::errc{}) return std::unexpected{ParseError::invalid_format};
    if (value < 1 || value > 65535) return std::unexpected{ParseError::out_of_range};

    return static_cast<uint16_t>(value);
}

// Monadic operations
auto result = parse_port(input)
    .transform([](uint16_t port) { return Endpoint{"localhost", port}; })
    .or_else([](ParseError e) -> std::expected<Endpoint, ParseError> {
        return Endpoint{"localhost", 8080}; // Default
    });
```

## Concepts (C++20)

```cpp
// Constrain templates at the interface, not in error messages
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <typename T>
concept Serializable = requires(T t, std::ostream& os) {
    { os << t } -> std::same_as<std::ostream&>;
    { t.serialize() } -> std::convertible_to<std::string>;
};

// Clean constrained templates
template <Numeric T>
auto clamp(T value, T low, T high) -> T {
    return std::max(low, std::min(value, high));
}

// Requires clause for complex constraints
template <typename Container>
    requires std::ranges::range<Container> &&
             std::totally_ordered<std::ranges::range_value_t<Container>>
auto find_median(Container& c) {
    std::ranges::sort(c);
    return c[c.size() / 2];
}
```

## Ranges (C++20/23)

```cpp
#include <ranges>

// Composable, lazy transformations
auto active_user_emails = users
    | std::views::filter([](const User& u) { return u.is_active(); })
    | std::views::transform([](const User& u) { return u.email(); })
    | std::views::take(100);

// Collect into a container
auto result = active_user_emails | std::ranges::to<std::vector>();

// Algorithm with projection
std::ranges::sort(users, {}, &User::name); // Sort by name
auto it = std::ranges::find(users, target_id, &User::id); // Find by id
```

## Structured Bindings

```cpp
// Decompose aggregates
auto [key, value] = *map.find(target);
auto [x, y, z] = get_position();

// With if-init
if (auto [it, inserted] = map.try_emplace(key, value); !inserted) {
    log::warn("Key {} already exists", key);
}

// Iterate maps cleanly
for (const auto& [name, score] : scores) {
    fmt::print("{}: {}\n", name, score);
}
```

## String Handling

```cpp
// std::string_view for non-owning references (C++17)
void process(std::string_view input) {
    // Zero-copy substring
    auto prefix = input.substr(0, 5);
}

// std::format (C++20)
auto msg = std::format("User {} logged in from {}", user.name(), ip_address);

// fmt library (pre-C++20 or for extra features)
fmt::print("Processing {} items\n", count);

// Never: manual snprintf or string concatenation in loops
```

## Anti-Patterns

```cpp
// Never: raw new/delete
auto* widget = new Widget(42);
delete widget;
// Use: auto widget = std::make_unique<Widget>(42);

// Never: C-style casts
int x = (int)some_double;
// Use: static_cast<int>(some_double)

// Never: NULL or 0 for null pointers
if (ptr == NULL)
// Use: if (ptr == nullptr)

// Never: C arrays in interfaces
void process(int* data, size_t len);
// Use: void process(std::span<const int> data);

// Never: using namespace std; in headers
// Pollutes every translation unit that includes the header
```
