# Kotlin Frameworks

Ktor for Kotlin-first, Spring Boot for ecosystem breadth. Both done idiomatically.

## Ktor

```kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        configureRouting()
        configureSerialization()
        configureAuthentication()
    }.start(wait = true)
}

// Routing
fun Application.configureRouting() {
    routing {
        route("/api/v1") {
            userRoutes()
            orderRoutes()
        }
    }
}

fun Route.userRoutes() {
    route("/users") {
        get {
            val users = userService.findAll()
            call.respond(users)
        }

        get("/{id}") {
            val id = UserId(call.parameters["id"]
                ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing id"))

            when (val result = userService.findById(id)) {
                is Result.Success -> call.respond(result.value)
                is Result.Failure -> when (result.error) {
                    is AppError.NotFound -> call.respond(HttpStatusCode.NotFound)
                    else -> call.respond(HttpStatusCode.InternalServerError)
                }
            }
        }

        post {
            val request = call.receive<CreateUserRequest>()
            when (val result = userService.create(request)) {
                is Result.Success -> call.respond(HttpStatusCode.Created, result.value)
                is Result.Failure -> call.respond(HttpStatusCode.BadRequest, result.error)
            }
        }
    }
}

// Content negotiation
fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = false
            ignoreUnknownKeys = true
            encodeDefaults = true
            isLenient = false
        })
    }
}
```

## Spring Boot with Kotlin

```kotlin
@SpringBootApplication
class Application

fun main(args: Array<String>) {
    runApplication<Application>(*args)
}

// REST controller — Kotlin-idiomatic
@RestController
@RequestMapping("/api/v1/orders")
class OrderController(private val orderService: OrderService) {

    @GetMapping("/{id}")
    suspend fun getById(@PathVariable id: UUID): ResponseEntity<OrderResponse> {
        return orderService.findById(OrderId(id.toString()))
            ?.let { ResponseEntity.ok(OrderResponse.from(it)) }
            ?: ResponseEntity.notFound().build()
    }

    @PostMapping
    suspend fun create(@Valid @RequestBody request: CreateOrderRequest): ResponseEntity<OrderResponse> {
        return when (val result = orderService.create(request)) {
            is Result.Success -> ResponseEntity
                .created(URI("/api/v1/orders/${result.value.id}"))
                .body(OrderResponse.from(result.value))
            is Result.Failure -> ResponseEntity
                .badRequest()
                .build()
        }
    }
}

// Configuration with Kotlin DSL
@Configuration
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http {
            csrf { disable() }
            authorizeHttpRequests {
                authorize("/api/public/**", permitAll)
                authorize("/actuator/health", permitAll)
                authorize(anyRequest, authenticated)
            }
            oauth2ResourceServer { jwt { } }
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }
        }
    }
}
```

## Exposed (Kotlin SQL Framework)

```kotlin
// Type-safe SQL — no string queries
object Users : Table("users") {
    val id = uuid("id").autoGenerate()
    val name = varchar("name", 200)
    val email = varchar("email", 255).uniqueIndex()
    val active = bool("active").default(true)
    val createdAt = timestamp("created_at").defaultExpression(CurrentTimestamp)

    override val primaryKey = PrimaryKey(id)
}

// Repository
class UserRepository(private val database: Database) {

    suspend fun findByEmail(email: String): User? = dbQuery {
        Users.selectAll()
            .where { Users.email eq email }
            .map { it.toUser() }
            .singleOrNull()
    }

    suspend fun create(request: CreateUserRequest): User = dbQuery {
        val id = Users.insert {
            it[name] = request.name
            it[email] = request.email
        } get Users.id

        findById(UserId(id.toString()))!!
    }

    private suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
```

## Ktor Client (HTTP)

```kotlin
// Shared client instance with configuration
val httpClient = HttpClient(CIO) {
    install(ContentNegotiation) { json() }
    install(HttpTimeout) {
        requestTimeoutMillis = 30_000
        connectTimeoutMillis = 5_000
    }
    install(HttpRequestRetry) {
        retryOnServerErrors(maxRetries = 3)
        exponentialDelay()
    }
}

// Type-safe API calls
suspend fun fetchGitHubUser(username: String): GitHubUser {
    return httpClient.get("https://api.github.com/users/$username").body()
}
```

## Dependency Injection (Koin)

```kotlin
// Module definition
val appModule = module {
    single { Database.connect(get<DatabaseConfig>().url) }
    single { UserRepository(get()) }
    single { OrderRepository(get()) }
    factory { UserService(get(), get()) }
    factory { OrderService(get(), get()) }
}

// Ktor integration
fun Application.configureKoin() {
    install(Koin) {
        modules(appModule)
    }
}

// Injection in routes
fun Route.userRoutes() {
    val userService by inject<UserService>()
    // ...
}
```

## Anti-Patterns

```kotlin
// Never: blocking calls in coroutine context
suspend fun fetchData(): Data {
    val response = okHttpClient.newCall(request).execute() // BLOCKS the thread
    // Use: a suspend-compatible HTTP client (Ktor Client, suspend wrappers)
}

// Never: exposing mutable state from services
class UserService {
    val users = mutableListOf<User>() // Anyone can mutate
    // Use: private mutableListOf, expose as List
}

// Never: Java-style builder patterns (use named arguments + copy())
User.builder().name("Alice").email("a@b.com").build()
// Use: User(name = "Alice", email = "a@b.com")
```
