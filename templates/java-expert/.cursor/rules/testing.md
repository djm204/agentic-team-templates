# Java Testing

Test behavior, not implementation. Every test answers: "what does this code do?"

## Framework Stack

| Tool | Purpose |
|------|---------|
| JUnit 5 | Test framework |
| AssertJ | Fluent assertions |
| Mockito | Mocking (with strict stubs) |
| Testcontainers | Real databases/services |
| Spring Boot Test | Integration testing |
| WireMock | HTTP API mocking |
| ArchUnit | Architecture tests |

## Unit Test Structure

```java
class OrderServiceTest {

    private final OrderRepository repository = mock(OrderRepository.class);
    private final InventoryClient inventory = mock(InventoryClient.class);
    private final OrderService sut = new OrderService(repository, inventory);

    @Test
    void create_withValidRequest_savesAndReturnsOrder() {
        // Arrange
        var request = new CreateOrderRequest("customer-1", List.of(
            new OrderItemRequest("SKU-001", 2)));
        when(inventory.checkAvailability("SKU-001", 2)).thenReturn(true);

        // Act
        var result = sut.create(request);

        // Assert
        assertThat(result.customerId()).isEqualTo("customer-1");
        assertThat(result.status()).isEqualTo(OrderStatus.PENDING);
        verify(repository).save(any(Order.class));
    }

    @Test
    void create_withInsufficientInventory_throwsException() {
        var request = new CreateOrderRequest("customer-1", List.of(
            new OrderItemRequest("SKU-001", 100)));
        when(inventory.checkAvailability("SKU-001", 100)).thenReturn(false);

        assertThatThrownBy(() -> sut.create(request))
            .isInstanceOf(InsufficientInventoryException.class)
            .hasMessageContaining("SKU-001");

        verify(repository, never()).save(any());
    }
}
```

## Test Naming

```java
// Pattern: method_scenario_expectedBehavior
@Test void findById_whenExists_returnsUser() {}
@Test void findById_whenNotFound_returnsEmpty() {}
@Test void create_withDuplicateEmail_throwsConflictException() {}

// Or descriptive sentences
@Test void newly_created_order_has_pending_status() {}
@Test void expired_orders_are_automatically_cancelled() {}
```

## Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "'',       false",
    "ab,       false",
    "abc,      true",
    "valid123, true"
})
void validatePassword_checksMinLength(String input, boolean expected) {
    assertThat(PasswordValidator.isValid(input)).isEqualTo(expected);
}

@ParameterizedTest
@MethodSource("invalidOrderRequests")
void create_withInvalidData_throwsValidationException(CreateOrderRequest request) {
    assertThatThrownBy(() -> sut.create(request))
        .isInstanceOf(ValidationException.class);
}

static Stream<Arguments> invalidOrderRequests() {
    return Stream.of(
        Arguments.of(new CreateOrderRequest(null, List.of())),
        Arguments.of(new CreateOrderRequest("", List.of())),
        Arguments.of(new CreateOrderRequest("c1", List.of()))
    );
}
```

## Spring Boot Integration Tests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class OrderControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }

    @Test
    void postOrders_withValidRequest_returnsCreated() {
        var request = new CreateOrderRequest("customer-1", List.of(
            new OrderItemRequest("SKU-001", 2)));

        var response = restTemplate.postForEntity("/api/v1/orders", request, OrderResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().customerId()).isEqualTo("customer-1");
        assertThat(response.getHeaders().getLocation()).isNotNull();
    }

    @Test
    void getOrders_whenNotFound_returns404() {
        var response = restTemplate.getForEntity(
            "/api/v1/orders/" + UUID.randomUUID(), ProblemDetail.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
```

## WireMock for External APIs

```java
@SpringBootTest
@WireMockTest(httpPort = 8089)
class PaymentServiceTest {

    @Autowired
    private PaymentService paymentService;

    @Test
    void charge_whenPaymentSucceeds_returnsTransactionId() {
        stubFor(post("/payments/charge")
            .willReturn(okJson("""
                {"transactionId": "tx-123", "status": "SUCCESS"}
                """)));

        var result = paymentService.charge(new ChargeRequest("order-1", BigDecimal.TEN));

        assertThat(result.transactionId()).isEqualTo("tx-123");
        verify(postRequestedFor(urlEqualTo("/payments/charge"))
            .withRequestBody(matchingJsonPath("$.orderId", equalTo("order-1"))));
    }

    @Test
    void charge_whenPaymentServiceDown_throwsException() {
        stubFor(post("/payments/charge")
            .willReturn(serverError()));

        assertThatThrownBy(() -> paymentService.charge(
            new ChargeRequest("order-1", BigDecimal.TEN)))
            .isInstanceOf(PaymentException.class);
    }
}
```

## Architecture Tests (ArchUnit)

```java
class ArchitectureTest {

    private final JavaClasses classes = new ClassFileImporter()
        .importPackages("com.example.myapp");

    @Test
    void domain_should_not_depend_on_infrastructure() {
        noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat()
            .resideInAnyPackage("..infrastructure..", "..api..")
            .check(classes);
    }

    @Test
    void controllers_should_not_access_repositories_directly() {
        noClasses()
            .that().resideInAPackage("..api..")
            .should().dependOnClassesThat()
            .resideInAPackage("..persistence..")
            .check(classes);
    }

    @Test
    void services_should_be_annotated_with_service() {
        classes()
            .that().resideInAPackage("..application..")
            .and().haveSimpleNameEndingWith("Service")
            .should().beAnnotatedWith(Service.class)
            .check(classes);
    }
}
```

## Test Data Builders

```java
public class TestOrders {

    public static Order.Builder aValidOrder() {
        return Order.builder()
            .customerId("customer-1")
            .status(OrderStatus.PENDING)
            .items(List.of(anOrderItem().build()));
    }

    public static OrderItem.Builder anOrderItem() {
        return OrderItem.builder()
            .sku("SKU-" + ThreadLocalRandom.current().nextInt(1000))
            .quantity(1)
            .price(BigDecimal.valueOf(9.99));
    }
}

// Usage in tests
var order = TestOrders.aValidOrder()
    .status(OrderStatus.SHIPPED)
    .build();
```

## Anti-Patterns

```java
// Never: testing implementation details
verify(repository, times(1)).save(any()); // How, not what
// Test the outcome: verify the order exists, has correct status

// Never: @SpringBootTest for unit tests (slow startup)
@SpringBootTest // Loads entire context for testing one service
class OrderServiceTest {} // Use plain JUnit + Mockito instead

// Never: Thread.sleep in tests
Thread.sleep(5000); // Flaky and slow
// Use Awaitility: await().atMost(5, SECONDS).until(() -> condition);

// Never: shared mutable state between tests
static List<Order> testOrders = new ArrayList<>(); // Tests pollute each other
// Use @BeforeEach to reset state

// Never: ignoring test failures with @Disabled without a reason
@Disabled // Why? When will it be fixed?
@Disabled("Flaky due to #1234 — external API timeout. Fix by 2025-02-01")
```
