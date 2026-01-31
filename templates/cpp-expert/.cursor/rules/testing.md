# C++ Testing

Test behavior. Test edge cases. Test with sanitizers. No excuses.

## Framework Stack

| Tool | Purpose |
|------|---------|
| Google Test | Test framework |
| Google Mock | Mocking |
| Catch2 | Alternative test framework (header-only) |
| Google Benchmark | Micro-benchmarks |
| ASan | Address sanitizer (memory errors) |
| UBSan | Undefined behavior sanitizer |
| TSan | Thread sanitizer (data races) |
| MSan | Memory sanitizer (uninitialized reads) |
| Valgrind | Memory leak detection |

## Test Structure (Google Test)

```cpp
class OrderServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        repo_ = std::make_unique<MockOrderRepository>();
        inventory_ = std::make_unique<MockInventoryClient>();
        sut_ = std::make_unique<OrderService>(*repo_, *inventory_);
    }

    std::unique_ptr<MockOrderRepository> repo_;
    std::unique_ptr<MockInventoryClient> inventory_;
    std::unique_ptr<OrderService> sut_;
};

TEST_F(OrderServiceTest, Create_WithValidItems_ReturnsOrder) {
    // Arrange
    EXPECT_CALL(*inventory_, check_availability("SKU-001", 2))
        .WillOnce(Return(true));
    EXPECT_CALL(*repo_, save(testing::_))
        .WillOnce(Return(Order{.id = "order-1"}));

    // Act
    auto result = sut_->create(CreateOrderRequest{
        .customer_id = "customer-1",
        .items = {{"SKU-001", 2}}
    });

    // Assert
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ(result->customer_id, "customer-1");
    EXPECT_EQ(result->items.size(), 1);
}

TEST_F(OrderServiceTest, Create_WithInsufficientInventory_ReturnsError) {
    EXPECT_CALL(*inventory_, check_availability("SKU-001", 100))
        .WillOnce(Return(false));

    auto result = sut_->create(CreateOrderRequest{
        .customer_id = "customer-1",
        .items = {{"SKU-001", 100}}
    });

    ASSERT_FALSE(result.has_value());
    EXPECT_EQ(result.error(), OrderError::insufficient_inventory);
}
```

## Catch2 Alternative

```cpp
#include <catch2/catch_test_macros.hpp>
#include <catch2/matchers/catch_matchers_string.hpp>

TEST_CASE("Parser handles edge cases", "[parser]") {
    SECTION("empty input returns error") {
        auto result = parse("");
        REQUIRE_FALSE(result.has_value());
        REQUIRE(result.error() == ParseError::empty_input);
    }

    SECTION("valid input returns parsed value") {
        auto result = parse("42");
        REQUIRE(result.has_value());
        REQUIRE(*result == 42);
    }

    SECTION("overflow returns error") {
        auto result = parse("999999999999999999");
        REQUIRE_FALSE(result.has_value());
        REQUIRE(result.error() == ParseError::out_of_range);
    }
}
```

## Parameterized Tests

```cpp
struct ParseTestCase {
    std::string input;
    std::expected<int, ParseError> expected;
};

class ParseTest : public ::testing::TestWithParam<ParseTestCase> {};

TEST_P(ParseTest, ParsesCorrectly) {
    auto [input, expected] = GetParam();
    auto result = parse(input);

    if (expected.has_value()) {
        ASSERT_TRUE(result.has_value()) << "Input: " << input;
        EXPECT_EQ(*result, *expected);
    } else {
        ASSERT_FALSE(result.has_value()) << "Input: " << input;
        EXPECT_EQ(result.error(), expected.error());
    }
}

INSTANTIATE_TEST_SUITE_P(ParseTests, ParseTest, ::testing::Values(
    ParseTestCase{"42", 42},
    ParseTestCase{"-1", -1},
    ParseTestCase{"", std::unexpected{ParseError::empty_input}},
    ParseTestCase{"abc", std::unexpected{ParseError::invalid_format}}
));
```

## Mocking

```cpp
class MockDatabase : public Database {
public:
    MOCK_METHOD(std::optional<User>, find_user, (std::string_view email), (const, override));
    MOCK_METHOD(void, save_user, (const User& user), (override));
    MOCK_METHOD(bool, delete_user, (std::string_view id), (override));
};

// Expectations
EXPECT_CALL(mock_db, find_user("alice@example.com"))
    .Times(1)
    .WillOnce(Return(User{.name = "Alice", .email = "alice@example.com"}));

// Matchers
EXPECT_CALL(mock_db, save_user(
    Field(&User::email, HasSubstr("@example.com"))))
    .Times(AtLeast(1));
```

## Sanitizers

```cmake
# CMake options for sanitizers
option(ENABLE_SANITIZERS "Enable ASan and UBSan" OFF)

if(ENABLE_SANITIZERS)
    target_compile_options(${PROJECT_NAME} PRIVATE
        -fsanitize=address,undefined
        -fno-omit-frame-pointer)
    target_link_options(${PROJECT_NAME} PRIVATE
        -fsanitize=address,undefined)
endif()

# Thread sanitizer (separate — incompatible with ASan)
option(ENABLE_TSAN "Enable Thread Sanitizer" OFF)
if(ENABLE_TSAN)
    target_compile_options(${PROJECT_NAME} PRIVATE -fsanitize=thread)
    target_link_options(${PROJECT_NAME} PRIVATE -fsanitize=thread)
endif()
```

```bash
# Run with sanitizers
cmake -B build -DENABLE_SANITIZERS=ON
cmake --build build
ctest --test-dir build

# Thread sanitizer (separate build)
cmake -B build-tsan -DENABLE_TSAN=ON
cmake --build build-tsan
ctest --test-dir build-tsan
```

## Benchmarks (Google Benchmark)

```cpp
#include <benchmark/benchmark.h>

static void BM_VectorPushBack(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v);
    }
}
BENCHMARK(BM_VectorPushBack)->Range(8, 1 << 20);

static void BM_VectorReserved(benchmark::State& state) {
    for (auto _ : state) {
        std::vector<int> v;
        v.reserve(static_cast<size_t>(state.range(0)));
        for (int i = 0; i < state.range(0); ++i) {
            v.push_back(i);
        }
        benchmark::DoNotOptimize(v);
    }
}
BENCHMARK(BM_VectorReserved)->Range(8, 1 << 20);

BENCHMARK_MAIN();
```

## Anti-Patterns

```cpp
// Never: tests that depend on execution order
// Each test must be independent and self-contained

// Never: testing private implementation details
// Test public interface and observable behavior

// Never: ignoring sanitizer warnings
// Every ASan/UBSan/TSan finding is a real bug

// Never: skipping edge cases
// Test empty input, max values, boundary conditions, error paths

// Never: mocking everything
// Only mock external dependencies (I/O, network, time)
// Use real objects for in-process logic
```
