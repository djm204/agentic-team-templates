# Kotlin Tooling and Build System

Gradle with Kotlin DSL. Static analysis. CI/CD. The full production pipeline.

## Gradle (Kotlin DSL)

```kotlin
// build.gradle.kts
plugins {
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.serialization") version "2.1.0"
    id("io.ktor.plugin") version "3.0.0" // For Ktor projects
    id("io.gitlab.arturbosch.detekt") version "1.23.7"
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        allWarningsAsErrors = true
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",     // Strict null-safety for Java interop
            "-Xcontext-receivers", // Enable context receivers (experimental)
        )
    }
}

dependencies {
    // Ktor
    implementation("io.ktor:ktor-server-core")
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")

    // DI
    implementation("io.insert-koin:koin-ktor")

    // Database
    implementation("org.jetbrains.exposed:exposed-core")
    implementation("org.jetbrains.exposed:exposed-jdbc")

    // Testing
    testImplementation(kotlin("test"))
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("io.mockk:mockk")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test")
    testImplementation("org.testcontainers:postgresql")
}

tasks.test {
    useJUnitPlatform()
}
```

## Essential Commands

```bash
# Build and test
./gradlew build                    # Full build + tests
./gradlew test                     # Tests only
./gradlew check                    # Tests + static analysis

# Run
./gradlew run                      # Run application
./gradlew buildFatJar              # Ktor fat JAR

# Dependencies
./gradlew dependencies             # Dependency tree
./gradlew dependencyUpdates        # Check for updates

# Static analysis
./gradlew detekt                   # Detekt analysis
./gradlew ktlintCheck              # Code formatting check
./gradlew ktlintFormat             # Auto-format
```

## Detekt (Static Analysis)

```yaml
# detekt.yml
complexity:
  LongMethod:
    threshold: 30
  ComplexCondition:
    threshold: 4
  TooManyFunctions:
    thresholdInFiles: 20

style:
  ForbiddenComment:
    values:
      - "TODO:"
      - "FIXME:"
      - "HACK:"
    allowedPatterns: "TODO\\(#\\d+\\)"  # Allow TODO with issue number
  MagicNumber:
    active: true
    ignoreNumbers:
      - "-1"
      - "0"
      - "1"
      - "2"
  MaxLineLength:
    maxLineLength: 120

exceptions:
  TooGenericExceptionCaught:
    active: true
    exceptionNames:
      - "Exception"
      - "RuntimeException"
      - "Throwable"
```

## kotlinx.serialization

```kotlin
// Type-safe serialization — no reflection
@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    val role: UserRole = UserRole.USER
)

@Serializable
enum class UserRole { USER, ADMIN, VIEWER }

// Custom serializer
@Serializable(with = InstantSerializer::class)
data class Event(val name: String, val occurredAt: Instant)

object InstantSerializer : KSerializer<Instant> {
    override val descriptor = PrimitiveSerialDescriptor("Instant", PrimitiveKind.STRING)
    override fun serialize(encoder: Encoder, value: Instant) = encoder.encodeString(value.toString())
    override fun deserialize(decoder: Decoder): Instant = Instant.parse(decoder.decodeString())
}
```

## Docker

```dockerfile
FROM gradle:8-jdk21 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle/ gradle/
RUN gradle dependencies --no-daemon

COPY src/ src/
RUN gradle buildFatJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseZGC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

## CI/CD (GitHub Actions)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21

      - uses: gradle/actions/setup-gradle@v4

      - name: Build and test
        run: ./gradlew check
        env:
          DATABASE_URL: jdbc:postgresql://localhost:5432/testdb

      - name: Detekt
        run: ./gradlew detekt

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: build/reports/tests/
```

## Logging

```kotlin
// kotlin-logging (SLF4J wrapper)
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}

// Lazy evaluation — message not constructed if level is disabled
logger.info { "Processing order ${order.id} with ${order.items.size} items" }
logger.error(exception) { "Failed to process order ${order.id}" }

// MDC for request context
MDC.put("requestId", requestId)
MDC.put("userId", userId)
try {
    processRequest()
} finally {
    MDC.clear()
}
```

## Anti-Patterns

```kotlin
// Never: build.gradle (Groovy) for Kotlin projects
// Use: build.gradle.kts (Kotlin DSL) — type-safe, IDE support

// Never: skipping detekt in CI
// Static analysis catches real bugs and code smells

// Never: Jackson for Kotlin (use kotlinx.serialization)
// Jackson requires reflection and kotlin-module. kotlinx.serialization is compile-time.

// Never: JUnit 4 assertions
assertEquals(expected, actual) // No message, confusing order
// Use: assertThat(actual).isEqualTo(expected) // AssertJ, readable

// Never: hardcoded versions scattered across modules
// Use: version catalogs (gradle/libs.versions.toml)
```
