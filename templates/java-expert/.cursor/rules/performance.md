# Java Performance

The JVM is a world-class runtime. Understand it, don't fight it. Measure first.

## Profile Before Optimizing

```bash
# JFR (Java Flight Recorder) — production-safe profiling
java -XX:StartFlightRecording=filename=recording.jfr,duration=60s -jar app.jar

# Async-profiler — low-overhead sampling
./asprof -d 30 -f profile.html <pid>

# JVM flags for diagnostics
-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xlog:gc*:file=gc.log
```

### Diagnostic Tools

| Tool | Purpose |
|------|---------|
| JFR + JMC | Production profiling (CPU, memory, I/O, locks) |
| async-profiler | Low-overhead CPU/allocation profiling |
| JMH | Micro-benchmarks with statistical rigor |
| jcmd | Runtime diagnostics (heap dump, thread dump) |
| VisualVM | Real-time monitoring |

## JMH Benchmarks

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 5, time = 1)
public class StringConcatBenchmark {

    private List<String> items;

    @Setup
    public void setup() {
        items = IntStream.range(0, 1000)
            .mapToObj(Integer::toString)
            .toList();
    }

    @Benchmark
    public String concatenation() {
        var result = "";
        for (var item : items) result += item;
        return result;
    }

    @Benchmark
    public String stringBuilder() {
        var sb = new StringBuilder();
        for (var item : items) sb.append(item);
        return sb.toString();
    }

    @Benchmark
    public String stringJoin() {
        return String.join("", items);
    }
}
```

## GC Tuning

```bash
# G1GC (default, good for most workloads)
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# ZGC (ultra-low latency, Java 21+ production-ready)
-XX:+UseZGC
-XX:+ZGenerational  # Generational ZGC (Java 21+)

# Heap sizing
-Xms2g -Xmx2g      # Fixed heap size (no resize pauses)
-XX:+AlwaysPreTouch # Touch memory pages at startup
```

### GC Rules

- Start with G1GC defaults — they're good
- Use ZGC if you need < 1ms pause times
- Set `-Xms` = `-Xmx` for predictable behavior
- Monitor with JFR, not gut feeling

## Memory Patterns

### Avoid Unnecessary Allocations

```java
// Bad: autoboxing in hot loops
long sum = 0;
for (Integer value : integerList) {
    sum += value; // Unboxing on every iteration
}

// Good: use primitive streams
long sum = integerList.stream().mapToLong(Integer::longValue).sum();

// Bad: intermediate collections
var result = users.stream()
    .map(User::name)
    .collect(Collectors.toList()) // Intermediate list
    .stream()
    .filter(n -> n.startsWith("A"))
    .toList();

// Good: single pipeline
var result = users.stream()
    .map(User::name)
    .filter(n -> n.startsWith("A"))
    .toList();
```

### String Optimization

```java
// String.intern() for repeated strings (use carefully — fills PermGen/Metaspace)
// Better: use enum or constants for known string sets

// StringBuilder for complex concatenation
var sb = new StringBuilder(256); // Pre-size if length is known
for (var item : items) {
    sb.append(item.name()).append(": ").append(item.value()).append('\n');
}
return sb.toString();
```

### Collection Sizing

```java
// Pre-size collections when capacity is known
var map = new HashMap<String, User>(expectedSize * 4 / 3 + 1); // Account for load factor
var list = new ArrayList<User>(expectedSize);

// Use specialized collections
EnumMap<Status, List<Order>> byStatus = new EnumMap<>(Status.class);
EnumSet<Permission> permissions = EnumSet.of(READ, WRITE);
```

## Connection Pooling (HikariCP)

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10         # Default is fine for most apps
      minimum-idle: 5
      idle-timeout: 300000          # 5 minutes
      connection-timeout: 30000     # 30 seconds
      max-lifetime: 1800000         # 30 minutes
      leak-detection-threshold: 60000  # 1 minute — detect leaked connections
```

### Pool Sizing Rule

Formula: `connections = (core_count * 2) + effective_spindle_count`
For SSDs: `connections ≈ core_count * 2`

Most apps need 10-20 connections. More is rarely better.

## HTTP Client Performance

```java
// Shared HttpClient instance with connection pooling
private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .executor(Executors.newVirtualThreadPerTaskExecutor())
    .build();

// Or with Spring: RestClient / WebClient (reuse instances)
@Bean
public RestClient restClient(RestClient.Builder builder) {
    return builder
        .baseUrl("https://api.example.com")
        .requestFactory(new JdkClientHttpRequestFactory(HTTP_CLIENT))
        .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
        .build();
}
```

## Caching

```java
// Spring Cache with Caffeine (in-process)
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        var caffeine = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .recordStats();

        var manager = new CaffeineCacheManager();
        manager.setCaffeine(caffeine);
        return manager;
    }
}

@Cacheable(value = "users", key = "#id")
public Optional<User> findById(UUID id) {
    return userRepository.findById(id);
}

@CacheEvict(value = "users", key = "#user.id")
public void update(User user) {
    userRepository.save(user);
}
```

## Anti-Patterns

```java
// Never: premature optimization without profiling
// "I think this is slow" — prove it with JMH or JFR

// Never: creating threads manually
new Thread(() -> process(item)).start(); // No lifecycle management, no error handling
// Use ExecutorService or virtual threads

// Never: synchronizing on string literals
synchronized ("lock") { } // String interning means unexpected sharing
// Use: private final Object lock = new Object();

// Never: reflection in hot paths
method.invoke(target, args); // Orders of magnitude slower than direct calls
// Use interfaces and polymorphism

// Never: unbounded caches
private final Map<String, Object> cache = new HashMap<>(); // Grows forever → OOM
// Use Caffeine with eviction policies
```
