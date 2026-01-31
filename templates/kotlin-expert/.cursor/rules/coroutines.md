# Kotlin Coroutines

Structured concurrency is the law. Every coroutine has a scope. Every scope has a lifecycle.

## Fundamentals

```kotlin
// Coroutines are lightweight — thousands are cheap
suspend fun fetchUser(id: UserId): User {
    return userRepository.findById(id)
        ?: throw NotFoundException("User", id.value)
}

// suspend functions can only be called from coroutines or other suspend functions
// They mark suspension points — where the function may pause and resume
```

## Structured Concurrency

```kotlin
// Every coroutine lives in a scope — when the scope cancels, all children cancel
class UserService(
    private val userRepo: UserRepository,
    private val emailService: EmailService,
) {
    // CoroutineScope tied to service lifecycle
    suspend fun register(request: CreateUserRequest): User {
        val user = userRepo.create(request)
        // This child coroutine is tied to the caller's scope
        emailService.sendWelcome(user.email)
        return user
    }
}

// Parallel decomposition with coroutineScope
suspend fun loadDashboard(userId: UserId): Dashboard = coroutineScope {
    val userDeferred = async { userService.findById(userId) }
    val ordersDeferred = async { orderService.findRecent(userId) }
    val statsDeferred = async { statsService.forUser(userId) }

    Dashboard(
        user = userDeferred.await(),
        orders = ordersDeferred.await(),
        stats = statsDeferred.await()
    )
}
// If any async fails, ALL are cancelled — no orphaned work
```

## Dispatchers

```kotlin
// Dispatchers.IO — blocking I/O (database, file, network)
withContext(Dispatchers.IO) {
    database.query(sql)
}

// Dispatchers.Default — CPU-intensive computation
withContext(Dispatchers.Default) {
    data.map { expensiveTransform(it) }
}

// Dispatchers.Main — UI thread (Android)
withContext(Dispatchers.Main) {
    updateUI(result)
}

// Never create custom thread pools unless you have a specific reason
// The built-in dispatchers are well-tuned
```

## Flow

```kotlin
// Cold asynchronous stream — values emitted on demand
fun observeUsers(): Flow<List<User>> = flow {
    while (true) {
        emit(userRepository.findAll())
        delay(5.seconds)
    }
}

// Operators
val activeUserNames: Flow<String> = observeUsers()
    .map { users -> users.filter { it.isActive } }
    .flatMapConcat { users -> users.asFlow() }
    .map { it.name }
    .distinctUntilChanged()

// StateFlow — hot observable with current value (replaces LiveData)
class UserViewModel : ViewModel() {
    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun loadUser(id: UserId) {
        viewModelScope.launch {
            _state.value = UiState.Loading
            try {
                val user = userService.findById(id)
                _state.value = UiState.Success(user)
            } catch (e: Exception) {
                _state.value = UiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

// SharedFlow — hot stream for events (no replay by default)
class EventBus {
    private val _events = MutableSharedFlow<AppEvent>()
    val events: SharedFlow<AppEvent> = _events.asSharedFlow()

    suspend fun emit(event: AppEvent) = _events.emit(event)
}

// Collecting flows
lifecycleScope.launch {
    viewModel.state.collect { state ->
        when (state) {
            is UiState.Loading -> showLoading()
            is UiState.Success -> showUser(state.user)
            is UiState.Error -> showError(state.message)
        }
    }
}
```

## Cancellation

```kotlin
// Cooperative cancellation — coroutines must check for cancellation
suspend fun processItems(items: List<Item>) {
    for (item in items) {
        ensureActive() // Throws CancellationException if cancelled
        process(item)
    }
}

// All suspend functions in kotlinx.coroutines are cancellable
// delay(), yield(), withContext(), etc. check for cancellation

// CancellationException is special — it doesn't propagate as failure
// Use it for normal cancellation, not for errors

// Timeout
val result = withTimeout(5.seconds) {
    fetchDataFromNetwork()
}

// Timeout with null instead of exception
val result = withTimeoutOrNull(5.seconds) {
    fetchDataFromNetwork()
}
```

## Exception Handling

```kotlin
// CoroutineExceptionHandler — last resort for uncaught exceptions
val handler = CoroutineExceptionHandler { _, exception ->
    logger.error("Uncaught coroutine exception", exception)
}

// supervisorScope — child failure doesn't cancel siblings
suspend fun fetchAllData(): DashboardData = supervisorScope {
    val user = async { fetchUser() }
    val orders = async { fetchOrders() }     // If this fails...
    val stats = async { fetchStats() }       // ...this continues

    DashboardData(
        user = user.await(),
        orders = runCatching { orders.await() }.getOrDefault(emptyList()),
        stats = runCatching { stats.await() }.getOrNull()
    )
}

// try-catch in coroutines
launch {
    try {
        riskyOperation()
    } catch (e: Exception) {
        if (e is CancellationException) throw e // Never catch cancellation
        logger.error("Operation failed", e)
    }
}
```

## Channels

```kotlin
// Producer-consumer with bounded channel
val channel = Channel<Event>(capacity = Channel.BUFFERED)

// Producer
launch {
    for (event in events) {
        channel.send(event) // Suspends if buffer is full
    }
    channel.close()
}

// Consumer
launch {
    for (event in channel) { // Iterates until channel is closed
        process(event)
    }
}

// Fan-out: multiple consumers from one channel
repeat(workerCount) {
    launch { for (event in channel) process(event) }
}
```

## Anti-Patterns

```kotlin
// Never: GlobalScope
GlobalScope.launch { } // No lifecycle, no cancellation, leaks coroutines
// Use: viewModelScope, lifecycleScope, or a custom CoroutineScope

// Never: runBlocking in production code (except main() or tests)
runBlocking { fetchData() } // Blocks the thread, defeats the purpose
// Use: suspend functions all the way up

// Never: catching CancellationException without rethrowing
catch (e: Exception) { log(e) } // Swallows cancellation!
// Use: catch (e: Exception) { if (e is CancellationException) throw e; log(e) }

// Never: launch without error handling
launch { riskyWork() } // Exception silently crashes
// Use: launch with try-catch or CoroutineExceptionHandler

// Never: Thread.sleep() in coroutines
Thread.sleep(1000) // Blocks the thread
// Use: delay(1000) // Suspends without blocking
```
