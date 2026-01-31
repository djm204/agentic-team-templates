# C++ Error Handling

Exceptions for exceptional conditions. Error codes and std::expected for expected failures. RAII guarantees cleanup.

## Exception Safety Guarantees

Every function provides one of these guarantees — document which:

1. **No-throw** — Function never throws. Mark `noexcept`. (Destructors, move operations, swap)
2. **Strong** — If exception thrown, state rolls back to before the call. (Transaction semantics)
3. **Basic** — If exception thrown, invariants preserved, no leaks. (The minimum acceptable guarantee)
4. **No guarantee** — Avoid. This is a bug.

```cpp
// No-throw: destructors, move constructors, swap
Buffer(Buffer&& other) noexcept;
~Buffer() noexcept; // Implicit, but be explicit

// Strong: copy-and-swap idiom
auto operator=(Buffer other) -> Buffer& { // Takes by value (copies)
    swap(*this, other);                    // noexcept swap
    return *this;                          // Old data destroyed in 'other'
}

// Basic: RAII handles cleanup even if later operations throw
void process(const std::string& path) {
    auto file = open_file(path);    // RAII — cleaned up if next line throws
    auto data = parse(file);        // RAII — cleaned up if next line throws
    validate(data);                 // If this throws, file and data cleaned up
}
```

## Exceptions

```cpp
// Throw by value, catch by const reference
class ApplicationError : public std::runtime_error {
    std::string code_;
public:
    ApplicationError(std::string code, const std::string& message)
        : std::runtime_error(message), code_{std::move(code)} {}

    const std::string& code() const noexcept { return code_; }
};

class NotFoundError : public ApplicationError {
public:
    NotFoundError(const std::string& entity, const std::string& id)
        : ApplicationError("NOT_FOUND",
            fmt::format("{} '{}' not found", entity, id)) {}
};

// Catch specific exceptions first
try {
    auto user = find_user(id);
} catch (const NotFoundError& e) {
    return http::response(404, e.what());
} catch (const ApplicationError& e) {
    return http::response(400, e.what());
} catch (const std::exception& e) {
    log::error("Unexpected error: {}", e.what());
    return http::response(500, "Internal error");
}
```

## std::expected (C++23)

```cpp
// For expected failures — no exception overhead
enum class ValidationError { empty_name, invalid_email, duplicate_email };

auto validate_user(const CreateUserRequest& req)
    -> std::expected<ValidatedUser, ValidationError>
{
    if (req.name.empty())
        return std::unexpected{ValidationError::empty_name};
    if (!is_valid_email(req.email))
        return std::unexpected{ValidationError::invalid_email};
    return ValidatedUser{req.name, req.email};
}

// Monadic chaining
auto result = validate_user(request)
    .and_then([&](auto user) { return save_user(db, user); })
    .transform([](auto saved) { return UserResponse::from(saved); });

if (!result) {
    handle_error(result.error());
}
```

## Error Codes (C-style APIs)

```cpp
// std::error_code / std::error_condition for system-level errors
auto read_file(const std::filesystem::path& path)
    -> std::expected<std::string, std::error_code>
{
    std::error_code ec;
    auto size = std::filesystem::file_size(path, ec);
    if (ec) return std::unexpected{ec};

    std::ifstream file(path);
    if (!file) return std::unexpected{
        std::make_error_code(std::errc::io_error)};

    std::string content(size, '\0');
    file.read(content.data(), static_cast<std::streamsize>(size));
    return content;
}
```

## noexcept

```cpp
// Mark functions noexcept when they genuinely cannot throw
// The compiler can optimize based on this — and std::terminate if violated

// Always noexcept:
~MyClass() noexcept;                          // Destructors (implicit)
MyClass(MyClass&& other) noexcept;            // Move constructor
MyClass& operator=(MyClass&& other) noexcept; // Move assignment
friend void swap(MyClass& a, MyClass& b) noexcept;

// Conditional noexcept:
template <typename T>
void process(T&& value) noexcept(noexcept(value.do_work())) {
    value.do_work();
}

// Why it matters: containers like std::vector will COPY instead of MOVE
// if move constructor is not noexcept (strong exception guarantee)
```

## Assertions and Contracts

```cpp
// Debug-only checks for programmer errors (not user input)
#include <cassert>

void process(std::span<const int> data) {
    assert(!data.empty() && "process() called with empty data");
    // assert is removed in release builds
}

// Static assertions for compile-time invariants
static_assert(sizeof(Packet) == 64, "Packet must be exactly 64 bytes for alignment");
static_assert(std::is_nothrow_move_constructible_v<Buffer>,
    "Buffer must be nothrow-movable for vector reallocation");
```

## Anti-Patterns

```cpp
// Never: catch(...) without rethrowing
try { do_work(); }
catch (...) { /* swallowed */ }
// At minimum: catch (...) { log_error(); throw; }

// Never: throwing in destructors
~MyClass() { throw std::runtime_error("cleanup failed"); }
// std::terminate will be called. Log and continue.

// Never: exceptions across DLL/shared library boundaries (ABI mismatch)
// Use error codes or std::expected at library boundaries

// Never: using exception specifications (deprecated)
void func() throw(std::exception); // Deprecated and removed in C++17
// Use: noexcept or nothing
```
