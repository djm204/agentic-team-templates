# Memory and Ownership

RAII is the foundation. Smart pointers express ownership. Raw pointers mean "non-owning."

## RAII (Resource Acquisition Is Initialization)

```cpp
// The single most important C++ idiom
// Resource lifetime = object lifetime
class DatabaseConnection {
    sqlite3* db_ = nullptr;

public:
    explicit DatabaseConnection(const std::string& path) {
        if (sqlite3_open(path.c_str(), &db_) != SQLITE_OK) {
            throw std::runtime_error("Failed to open database");
        }
    }

    ~DatabaseConnection() {
        if (db_) sqlite3_close(db_);
    }

    // Non-copyable, movable
    DatabaseConnection(const DatabaseConnection&) = delete;
    DatabaseConnection& operator=(const DatabaseConnection&) = delete;
    DatabaseConnection(DatabaseConnection&& other) noexcept
        : db_{std::exchange(other.db_, nullptr)} {}
    DatabaseConnection& operator=(DatabaseConnection&& other) noexcept {
        if (this != &other) {
            if (db_) sqlite3_close(db_);
            db_ = std::exchange(other.db_, nullptr);
        }
        return *this;
    }
};
// No cleanup code needed at call sites — ever
```

## Smart Pointers

### std::unique_ptr — Single Ownership

```cpp
// The default smart pointer. Zero overhead over raw pointer.
auto widget = std::make_unique<Widget>(42);

// Transfer ownership explicitly
auto new_owner = std::move(widget);
// widget is now nullptr — ownership transferred

// Custom deleters for C APIs
auto file = std::unique_ptr<FILE, decltype(&fclose)>(
    fopen("data.txt", "r"), &fclose);

// Factory functions return unique_ptr
auto create_engine(const Config& cfg) -> std::unique_ptr<Engine> {
    return std::make_unique<ConcreteEngine>(cfg);
}
```

### std::shared_ptr — Shared Ownership

```cpp
// Use only when ownership is genuinely shared (rare)
auto shared = std::make_shared<Resource>();
auto also_owns = shared; // Reference count incremented

// Weak references to break cycles
class Node {
    std::vector<std::shared_ptr<Node>> children_;
    std::weak_ptr<Node> parent_; // Doesn't prevent destruction

public:
    auto parent() const -> std::shared_ptr<Node> {
        return parent_.lock(); // Returns nullptr if parent destroyed
    }
};

// Rules:
// - Prefer unique_ptr. Only use shared_ptr when multiple owners exist.
// - Use make_shared (single allocation for control block + object)
// - Never create shared_ptr from raw pointer if one already exists
// - Use weak_ptr to observe without owning
```

### Raw Pointers — Non-Owning References

```cpp
// Raw pointer = "I'm borrowing this, I don't own it"
void process(const Widget* widget) {
    if (!widget) return;
    widget->do_work();
    // Do NOT delete widget — you don't own it
}

// Prefer references over pointers when null is not valid
void process(const Widget& widget) {
    widget.do_work();
}
```

## std::span — Non-Owning View (C++20)

```cpp
// View into contiguous memory — no ownership, no copies
void process(std::span<const int> data) {
    for (auto val : data) {
        // Works with vector, array, C array, etc.
    }
}

std::vector<int> vec = {1, 2, 3, 4, 5};
process(vec);                    // Implicit conversion
process({vec.data() + 1, 3});  // Subspan
int arr[] = {1, 2, 3};
process(arr);                    // C arrays too
```

## Move Semantics

```cpp
class Buffer {
    std::unique_ptr<uint8_t[]> data_;
    size_t size_ = 0;

public:
    // Move constructor — steal resources
    Buffer(Buffer&& other) noexcept
        : data_{std::move(other.data_)}
        , size_{std::exchange(other.size_, 0)} {}

    // Move assignment
    Buffer& operator=(Buffer&& other) noexcept {
        data_ = std::move(other.data_);
        size_ = std::exchange(other.size_, 0);
        return *this;
    }

    // Rule of Five: if you define one, define all five
    Buffer(const Buffer& other);              // Copy constructor
    Buffer& operator=(const Buffer& other);   // Copy assignment
    ~Buffer() = default;                      // Destructor
};

// Move from function return — no cost
auto create_buffer(size_t size) -> Buffer {
    Buffer buf(size);
    // ... fill buffer ...
    return buf; // NRVO or move — never copies
}
```

## The Rule of Zero/Five

```cpp
// Rule of Zero: prefer classes that need no custom special members
class UserService {
    std::unique_ptr<UserRepository> repo_;  // Handles its own cleanup
    std::string name_;                       // Handles its own cleanup

    // No destructor, no copy/move constructors needed — compiler generates correct ones
};

// Rule of Five: if you need one, you need all five
// (destructor, copy ctor, copy assignment, move ctor, move assignment)

// Rule of Three (legacy): if you need destructor, you need copy ctor + copy assignment
```

## Memory Safety Checklist

```cpp
// 1. No owning raw pointers
Widget* w = new Widget(); // BUG: who deletes this?

// 2. No manual memory management
auto w = std::make_unique<Widget>(); // Correct

// 3. No dangling references
const std::string& get_name() {
    std::string name = "Alice";
    return name; // BUG: dangling reference to local
}

// 4. No use-after-move
auto buf = create_buffer(1024);
consume(std::move(buf));
buf.size(); // BUG: use after move

// 5. No out-of-bounds access
vec[vec.size()]; // BUG: one past the end
vec.at(i);       // Bounds-checked alternative
```

## Anti-Patterns

```cpp
// Never: new without corresponding smart pointer
auto* p = new Widget(42);
// Use: auto p = std::make_unique<Widget>(42);

// Never: manual delete
delete p;
delete[] arr;
// Use: RAII, smart pointers, containers

// Never: owning raw pointers in classes
class Bad {
    Widget* widget_; // Who owns this? When is it freed?
};

// Never: returning raw owning pointers
Widget* create_widget(); // Caller must remember to delete
// Use: std::unique_ptr<Widget> create_widget();

// Never: C-style memory management
malloc/free/realloc
// Use: containers, smart pointers, std::vector
```
