# Kotlin Testing

Test behavior with expressive assertions. Coroutines require special test infrastructure.

## Framework Stack

| Tool | Purpose |
|------|---------|
| JUnit 5 | Test framework |
| Kotest | Kotlin-native testing (property-based, data-driven) |
| MockK | Kotlin-native mocking |
| kotlinx-coroutines-test | Coroutine testing |
| Testcontainers | Real databases/services |
| Ktor Test | HTTP endpoint testing |
| ArchUnit | Architecture tests |

## Unit Test Structure

```kotlin
class OrderServiceTest {

    private val orderRepo = mockk<OrderRepository>()
    private val inventoryClient = mockk<InventoryClient>()
    private val sut = OrderService(orderRepo, inventoryClient)

    @Test
    fun `create with valid items returns success`() = runTest {
        // Arrange
        val request = CreateOrderRequest(
            customerId = "customer-1",
            items = listOf(OrderItemRequest("SKU-001", 2))
        )
        coEvery { inventoryClient.checkAvailability("SKU-001", 2) } returns true
        coEvery { orderRepo.save(any()) } answers { firstArg() }

        // Act
        val result = sut.create(request)

        // Assert
        assertThat(result).isInstanceOf(Result.Success::class.java)
        val order = (result as Result.Success).value
        assertThat(order.customerId).isEqualTo("customer-1")
        assertThat(order.items).hasSize(1)
    }

    @Test
    fun `create with insufficient inventory returns failure`() = runTest {
        val request = CreateOrderRequest(
            customerId = "customer-1",
            items = listOf(OrderItemRequest("SKU-001", 100))
        )
        coEvery { inventoryClient.checkAvailability("SKU-001", 100) } returns false

        val result = sut.create(request)

        assertThat(result).isInstanceOf(Result.Failure::class.java)
        val error = (result as Result.Failure).error
        assertThat(error).isInstanceOf(AppError.Validation::class.java)

        coVerify(exactly = 0) { orderRepo.save(any()) }
    }
}
```

## Coroutine Testing

```kotlin
// runTest provides a TestScope with virtual time
@Test
fun `polling retries on failure`() = runTest {
    var attempts = 0
    coEvery { service.fetch() } answers {
        attempts++
        if (attempts < 3) throw IOException("Temporary failure")
        else Data("success")
    }

    val result = sut.fetchWithRetry(maxRetries = 3)

    assertThat(result.value).isEqualTo("success")
    assertThat(attempts).isEqualTo(3)
}

// Testing flows
@Test
fun `user updates emit state changes`() = runTest {
    val viewModel = UserViewModel(mockUserService)

    viewModel.state.test {
        assertThat(awaitItem()).isEqualTo(UiState.Loading)

        viewModel.loadUser(UserId("123"))

        assertThat(awaitItem()).isEqualTo(UiState.Loading)
        assertThat(awaitItem()).isInstanceOf(UiState.Success::class.java)
    }
}

// advanceTimeBy for testing delays
@Test
fun `cache expires after TTL`() = runTest {
    cache.set("key", "value")

    assertThat(cache.get("key")).isEqualTo("value")

    advanceTimeBy(cacheTtl + 1.seconds)

    assertThat(cache.get("key")).isNull()
}
```

## MockK

```kotlin
// Suspend function mocking
coEvery { userRepo.findById(any()) } returns User(id = "1", name = "Alice")
coEvery { emailService.send(any(), any(), any()) } just Runs

// Verification
coVerify(exactly = 1) { emailService.send("alice@test.com", any(), any()) }
coVerify(ordering = Ordering.ORDERED) {
    userRepo.save(any())
    emailService.send(any(), any(), any())
}

// Capturing
val slot = slot<User>()
coEvery { userRepo.save(capture(slot)) } answers { firstArg() }

sut.create(request)

assertThat(slot.captured.name).isEqualTo("Alice")

// Relaxed mocks — return defaults for all unmocked calls
val logger = mockk<Logger>(relaxed = true)
```

## Ktor Testing

```kotlin
class UserRoutesTest {

    @Test
    fun `POST users returns created for valid request`() = testApplication {
        application {
            configureRouting()
            configureSerialization()
        }

        val response = client.post("/api/v1/users") {
            contentType(ContentType.Application.Json)
            setBody("""{"name": "Alice", "email": "alice@test.com"}""")
        }

        assertEquals(HttpStatusCode.Created, response.status)
        val user = response.body<UserResponse>()
        assertEquals("Alice", user.name)
    }

    @Test
    fun `GET users id returns not found for missing user`() = testApplication {
        application { configureRouting() }

        val response = client.get("/api/v1/users/nonexistent")

        assertEquals(HttpStatusCode.NotFound, response.status)
    }
}
```

## Data-Driven Tests (Kotest)

```kotlin
class SlugifyTest : FunSpec({
    withData(
        "Hello World" to "hello-world",
        "  spaces  " to "spaces",
        "Special!@#Chars" to "specialchars",
        "" to "",
    ) { (input, expected) ->
        slugify(input) shouldBe expected
    }
})

// Property-based testing
class MoneyTest : FunSpec({
    test("addition is commutative") {
        checkAll(Arb.positiveLong(), Arb.positiveLong()) { a, b ->
            Money(a, USD) + Money(b, USD) shouldBe Money(b, USD) + Money(a, USD)
        }
    }
})
```

## Anti-Patterns

```kotlin
// Never: Thread.sleep in tests
Thread.sleep(5000) // Flaky and slow
// Use: runTest with advanceTimeBy, or Awaitility

// Never: testing internal implementation
verify { repo.save(any()) } // How, not what
// Test the observable outcome instead

// Never: shared mutable state between tests
companion object { val testUsers = mutableListOf<User>() }
// Use @BeforeEach to reset state

// Never: ignoring coroutine test infrastructure
@Test fun `test`() { runBlocking { sut.doWork() } }
// Use: runTest { } for proper virtual time and dispatcher control
```
