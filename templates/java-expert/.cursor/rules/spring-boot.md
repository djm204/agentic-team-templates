# Spring Boot Patterns

Production-grade Spring Boot development. Convention over configuration, done right.

## Application Structure

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
// That's it. No XML. No component scanning tricks. Just this.
```

## REST Controllers

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getById(@PathVariable UUID id) {
        return orderService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @Valid @RequestBody CreateOrderRequest request) {
        var order = orderService.create(request);
        var location = URI.create("/api/v1/orders/" + order.id());
        return ResponseEntity.created(location).body(order);
    }

    @GetMapping
    public Page<OrderResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return orderService.findAll(PageRequest.of(page, size));
    }
}
```

## Service Layer

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;
    private final ApplicationEventPublisher eventPublisher;

    public Optional<OrderResponse> findById(UUID id) {
        return orderRepository.findById(id)
            .map(OrderResponse::from);
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        // Validate business rules
        inventoryClient.checkAvailability(request.items())
            .orElseThrow(() -> new InsufficientInventoryException(request.items()));

        // Create and persist
        var order = Order.create(request);
        orderRepository.save(order);

        // Publish domain event
        eventPublisher.publishEvent(new OrderCreatedEvent(order.getId()));

        return OrderResponse.from(order);
    }
}
```

## Configuration

```java
// Strongly typed configuration with validation
@Validated
@ConfigurationProperties(prefix = "app.orders")
public record OrderProperties(
    @NotNull Duration processingTimeout,
    @Min(1) @Max(1000) int maxItemsPerOrder,
    @NotBlank String notificationEmail
) {}

// Enable in Application class or config
@EnableConfigurationProperties(OrderProperties.class)

// application.yml
// app:
//   orders:
//     processing-timeout: 30s
//     max-items-per-order: 50
//     notification-email: orders@example.com
```

## Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ProblemDetail handleNotFound(NotFoundException ex) {
        var problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        var problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");
        var errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                f -> Objects.requireNonNullElse(f.getDefaultMessage(), "Invalid")));
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred");
        // Never expose stack traces or internal details to clients
    }
}
```

## Security

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.csrfTokenRepository(
                CookieCsrfTokenRepository.withHttpOnlyFalse()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }
}
```

## Health Checks

```java
@Component
public class ExternalServiceHealthIndicator implements HealthIndicator {

    private final ExternalServiceClient client;

    @Override
    public Health health() {
        try {
            client.ping();
            return Health.up()
                .withDetail("service", "external-api")
                .build();
        } catch (Exception ex) {
            return Health.down()
                .withDetail("service", "external-api")
                .withException(ex)
                .build();
        }
    }
}

// application.yml
// management:
//   endpoints:
//     web:
//       exposure:
//         include: health,info,prometheus
//   endpoint:
//     health:
//       show-details: when-authorized
```

## Profiles and Environment

```yaml
# application.yml — shared defaults
spring:
  application:
    name: order-service
  jpa:
    open-in-view: false  # Always disable — prevents lazy loading bugs

---
# application-local.yml
spring:
  config:
    activate:
      on-profile: local
  datasource:
    url: jdbc:postgresql://localhost:5432/orders

---
# application-prod.yml
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DATABASE_URL}  # From environment
```

## Anti-Patterns

```java
// Never: field injection
@Autowired
private OrderRepository repository; // Untestable, hides dependencies
// Use constructor injection (Lombok @RequiredArgsConstructor)

// Never: business logic in controllers
@PostMapping
public Order create(@RequestBody CreateOrderRequest request) {
    var order = new Order();
    order.setStatus("PENDING");
    order.setItems(request.items()); // Logic belongs in service/domain
    return orderRepository.save(order);
}

// Never: open-in-view (lazy loading in controllers)
spring.jpa.open-in-view=true // N+1 queries, unclear data access patterns
// Set to false, use eager fetching or DTOs

// Never: catching and ignoring exceptions
try { externalService.call(); }
catch (Exception e) { /* ignore */ }
// Log, wrap, or rethrow — never swallow

// Never: @Transactional on private methods (Spring proxy can't intercept them)
```
