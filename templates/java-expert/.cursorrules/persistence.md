# Java Persistence

JPA/Hibernate done right, JDBC when you need control, and database patterns that scale.

## JPA Entity Design

```java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String customerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Version
    private Long version; // Optimistic locking

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    // Protected no-arg constructor for JPA
    protected Order() {}

    // Factory method with validation
    public static Order create(String customerId, List<OrderItem> items) {
        Objects.requireNonNull(customerId, "customerId is required");
        if (items.isEmpty()) throw new IllegalArgumentException("Order must have items");

        var order = new Order();
        order.customerId = customerId;
        order.status = OrderStatus.PENDING;
        items.forEach(order::addItem);
        return order;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    // Getters only — no public setters for domain-relevant fields
    public UUID getId() { return id; }
    public OrderStatus getStatus() { return status; }
    public List<OrderItem> getItems() { return Collections.unmodifiableList(items); }
}
```

## Repository Pattern

```java
// Spring Data JPA — let the framework generate implementations
public interface OrderRepository extends JpaRepository<Order, UUID> {

    // Derived query
    List<Order> findByCustomerIdAndStatus(String customerId, OrderStatus status);

    // JPQL for complex queries
    @Query("""
        SELECT o FROM Order o
        JOIN FETCH o.items
        WHERE o.customerId = :customerId
        ORDER BY o.createdAt DESC
        """)
    List<Order> findWithItemsByCustomerId(@Param("customerId") String customerId);

    // Native query when JPQL isn't enough
    @Query(value = """
        SELECT o.* FROM orders o
        WHERE o.created_at > :since
          AND o.status = 'PENDING'
        FOR UPDATE SKIP LOCKED
        LIMIT :limit
        """, nativeQuery = true)
    List<Order> findPendingForProcessing(
        @Param("since") Instant since,
        @Param("limit") int limit);

    // Projections for read-only queries
    @Query("""
        SELECT new com.example.dto.OrderSummary(o.id, o.status, o.createdAt, SIZE(o.items))
        FROM Order o
        WHERE o.customerId = :customerId
        """)
    Page<OrderSummary> findSummariesByCustomerId(
        @Param("customerId") String customerId, Pageable pageable);
}
```

## Transaction Management

```java
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final TransactionTemplate txTemplate;

    // Declarative — for simple cases
    @Transactional
    public Order create(CreateOrderRequest request) {
        var order = Order.create(request.customerId(), request.items());
        return orderRepository.save(order);
    }

    // Read-only transactions — enables optimizations
    @Transactional(readOnly = true)
    public Optional<Order> findById(UUID id) {
        return orderRepository.findById(id);
    }

    // Programmatic — for fine-grained control
    public OrderResult processOrder(UUID orderId) {
        // Step 1: Update order status (transactional)
        var order = txTemplate.execute(status -> {
            var o = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order: " + orderId));
            o.markProcessing();
            return orderRepository.save(o);
        });

        // Step 2: Call external payment (non-transactional)
        var paymentResult = paymentService.charge(order);

        // Step 3: Update with result (new transaction)
        return txTemplate.execute(status -> {
            if (paymentResult.isSuccess()) {
                order.markPaid(paymentResult.transactionId());
            } else {
                order.markFailed(paymentResult.errorMessage());
            }
            orderRepository.save(order);
            return OrderResult.from(order);
        });
    }
}
```

## N+1 Query Prevention

```java
// Bad: lazy loading in a loop
var orders = orderRepository.findAll(); // 1 query
for (var order : orders) {
    order.getItems().size(); // N queries!
}

// Good: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.status = :status")
List<Order> findWithItemsByStatus(@Param("status") OrderStatus status);

// Good: @EntityGraph
@EntityGraph(attributePaths = {"items", "customer"})
List<Order> findByStatus(OrderStatus status);

// Good: DTO projection (best performance)
@Query("""
    SELECT new com.example.dto.OrderSummary(o.id, o.status, SIZE(o.items))
    FROM Order o WHERE o.status = :status
    """)
List<OrderSummary> findSummariesByStatus(@Param("status") OrderStatus status);
```

## Database Migrations (Flyway)

```sql
-- V1__create_orders_table.sql
CREATE TABLE orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(255) NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    version     BIGINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- V2__add_order_items_table.sql
CREATE TABLE order_items (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku      VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price    NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

## JDBC Template (When JPA Is Overkill)

```java
// For bulk operations, complex queries, or maximum performance
@Repository
@RequiredArgsConstructor
public class OrderReportRepository {

    private final JdbcTemplate jdbc;

    public List<DailyRevenue> getDailyRevenue(LocalDate from, LocalDate to) {
        return jdbc.query("""
            SELECT DATE(created_at) as day, SUM(total) as revenue, COUNT(*) as order_count
            FROM orders
            WHERE created_at BETWEEN ? AND ?
              AND status = 'COMPLETED'
            GROUP BY DATE(created_at)
            ORDER BY day
            """,
            (rs, rowNum) -> new DailyRevenue(
                rs.getDate("day").toLocalDate(),
                rs.getBigDecimal("revenue"),
                rs.getInt("order_count")),
            from, to);
    }
}
```

## Anti-Patterns

```java
// Never: open-in-view (lazy loading in presentation layer)
spring.jpa.open-in-view=true // Masks N+1 problems, unclear data boundaries

// Never: entities as API responses
@GetMapping("/{id}")
public Order getById(@PathVariable UUID id) {
    return orderRepository.findById(id).orElseThrow();
    // Exposes internal structure, lazy loading exceptions, circular references
}
// Map to DTOs/records

// Never: manual ID generation with UUID.randomUUID() in application code
// Let the database or JPA strategy handle it

// Never: ignoring @Version for concurrent writes
// Optimistic locking prevents lost updates — use it

// Never: long-running transactions
@Transactional
public void processAllOrders() {
    var orders = orderRepository.findAll(); // Locks for entire method
    orders.forEach(this::processExpensiveOperation);
}
// Process in batches with separate transactions
```
