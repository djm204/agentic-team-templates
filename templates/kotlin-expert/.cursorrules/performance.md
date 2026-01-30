# Kotlin Performance

Profile first. Understand the JVM. Kotlin-specific optimizations matter.

## Profile Before Optimizing

```bash
# JFR (Java Flight Recorder) — works with Kotlin on JVM
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s -jar app.jar

# Kotlin-specific: check for unnecessary boxing, allocations
# Use JMH for micro-benchmarks
```

## Inline Functions

```kotlin
// inline eliminates lambda allocation overhead — use for hot paths
inline fun <T> measure(label: String, block: () -> T): T {
    val start = System.nanoTime()
    val result = block()
    val elapsed = System.nanoTime() - start
    logger.debug { "$label took ${elapsed / 1_000_000}ms" }
    return result
}

// crossinline — prevent non-local returns in inlined lambdas
inline fun transaction(crossinline block: () -> Unit) {
    beginTransaction()
    try {
        block()
        commit()
    } catch (e: Exception) {
        rollback()
        throw e
    }
}

// reified — preserve generic type info at runtime (only with inline)
inline fun <reified T> parseJson(json: String): T {
    return objectMapper.readValue(json, T::class.java)
}

// Rules:
// - Inline small, frequently-called higher-order functions
// - Don't inline large function bodies (code bloat)
// - Standard library uses inline extensively: let, apply, also, run, with, map, filter
```

## Value Classes

```kotlin
// Zero overhead wrappers — no runtime allocation for the wrapper
@JvmInline
value class UserId(val value: String)

@JvmInline
value class Email(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email" }
    }
}

// At runtime, UserId("abc") is just the String "abc"
// But at compile time, you can't pass UserId where Email is expected
fun findUser(id: UserId): User // Type-safe, zero overhead
```

## Sequences vs Collections

```kotlin
// Collections: eager, creates intermediate lists
val result = users
    .filter { it.isActive }     // Creates List<User>
    .map { it.name }            // Creates List<String>
    .take(10)                   // Creates List<String>

// Sequences: lazy, no intermediate allocations
val result = users.asSequence()
    .filter { it.isActive }     // No intermediate list
    .map { it.name }            // No intermediate list
    .take(10)                   // Stops after 10 matches
    .toList()                   // Single terminal allocation

// Use sequences when:
// - Processing large collections (>1000 elements)
// - Chaining multiple operations
// - Using take/first (short-circuit)

// Use collections when:
// - Small datasets
// - Single operation
// - Need indexed access during processing
```

## Coroutine Performance

```kotlin
// Channel buffers for throughput
val channel = Channel<Event>(capacity = 64) // Buffered, not unlimited

// Fan-out for parallel processing
val workers = List(Runtime.getRuntime().availableProcessors()) {
    launch(Dispatchers.Default) {
        for (item in channel) process(item)
    }
}

// Avoid unnecessary suspension
// Bad: wrapping non-suspending code in withContext
suspend fun format(name: String): String = withContext(Dispatchers.Default) {
    name.trim().lowercase() // This is instant — no need for withContext
}

// Good: only use withContext for actual blocking/CPU work
suspend fun hashPassword(password: String): String = withContext(Dispatchers.Default) {
    BCrypt.hashpw(password, BCrypt.gensalt()) // Actually CPU-intensive
}
```

## Collection Optimization

```kotlin
// Pre-size collections
val map = HashMap<String, User>(expectedSize)
val list = ArrayList<User>(expectedSize)

// buildList/buildMap — single allocation
val items = buildList(expectedSize) {
    for (item in source) {
        if (item.isValid) add(transform(item))
    }
}

// Use appropriate collection types
val lookup = users.associateBy { it.id }     // HashMap for O(1) lookup
val uniqueEmails = users.mapTo(HashSet()) { it.email } // HashSet for uniqueness
val sorted = users.sortedBy { it.name }      // Single sort, not repeated

// Avoid: repeated list.contains() — use a Set
val activeIds = activeUsers.map { it.id }.toSet() // O(1) lookup
orders.filter { it.userId in activeIds } // Fast membership test
```

## String Performance

```kotlin
// StringBuilder for complex concatenation
val result = buildString {
    for (item in items) {
        append(item.name)
        append(": ")
        appendLine(item.value)
    }
}

// joinToString for simple cases
val csv = items.joinToString(",") { it.name }

// String templates are efficient — Kotlin compiles them to StringBuilder
val message = "User $name logged in from $ip" // Fine for most cases
```

## Anti-Patterns

```kotlin
// Never: premature optimization without profiling
// "I think this allocation is slow" — prove it with JFR or JMH

// Never: creating coroutines for non-suspending work
launch { val x = 1 + 1 } // Overhead of coroutine machinery for nothing

// Never: using reflection in hot paths
val prop = User::class.memberProperties.find { it.name == "email" }
// Use direct property access

// Never: unnecessary boxing
val numbers: List<Int> = listOf(1, 2, 3) // Boxed integers
// For performance-critical code: IntArray(3) { it + 1 }

// Never: mutable shared state in coroutines without synchronization
var counter = 0
repeat(1000) { launch { counter++ } } // Data race
// Use: AtomicInteger, Mutex, or single-writer pattern
```
