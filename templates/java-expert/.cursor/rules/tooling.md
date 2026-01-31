# Java Tooling and Build Systems

Maven or Gradle. Static analysis. CI/CD. Docker. The full production pipeline.

## Build Tools

### Maven

```xml
<!-- pom.xml essentials -->
<properties>
    <java.version>21</java.version>
    <maven.compiler.source>${java.version}</maven.compiler.source>
    <maven.compiler.target>${java.version}</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<!-- Dependency management in parent POM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Essential plugins -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <compilerArgs>
                    <arg>-Xlint:all</arg>
                    <arg>-Werror</arg>
                </compilerArgs>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <configuration>
                <argLine>-XX:+EnableDynamicAgentLoading</argLine>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### Gradle (Kotlin DSL)

```kotlin
// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "3.4.0"
    id("io.spring.dependency-management") version "1.1.6"
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

tasks.withType<JavaCompile> {
    options.compilerArgs.addAll(listOf("-Xlint:all", "-Werror"))
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
    jvmArgs("-XX:+EnableDynamicAgentLoading")
}
```

## Essential Commands

```bash
# Maven
mvn clean verify                     # Full build + tests
mvn test                             # Unit tests only
mvn verify -Pintegration-tests       # Integration tests
mvn dependency:tree                  # Dependency analysis
mvn versions:display-dependency-updates  # Check for updates
mvn spotbugs:check                   # Static analysis

# Gradle
./gradlew clean build                # Full build + tests
./gradlew test                       # Unit tests
./gradlew integrationTest            # Integration tests
./gradlew dependencies               # Dependency tree
./gradlew dependencyUpdates          # Check for updates
```

## Static Analysis

### SpotBugs + ErrorProne

```xml
<!-- SpotBugs -->
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <configuration>
        <effort>Max</effort>
        <threshold>Low</threshold>
        <failOnError>true</failOnError>
    </configuration>
</plugin>

<!-- ErrorProne (compile-time bug detection) -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <annotationProcessorPaths>
            <path>
                <groupId>com.google.errorprone</groupId>
                <artifactId>error_prone_core</artifactId>
                <version>${errorprone.version}</version>
            </path>
        </annotationProcessorPaths>
        <compilerArgs>
            <arg>-XDcompilePolicy=simple</arg>
            <arg>-Xplugin:ErrorProne</arg>
        </compilerArgs>
    </configuration>
</plugin>
```

### Checkstyle

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <configuration>
        <configLocation>google_checks.xml</configLocation>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>
```

## Docker

```dockerfile
# Multi-stage build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseZGC \
    -XX:+ZGenerational"

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
  build:
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
          cache: maven

      - name: Build and test
        run: mvn clean verify -B
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/testdb
          SPRING_DATASOURCE_USERNAME: postgres
          SPRING_DATASOURCE_PASSWORD: test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Logging (SLF4J + Logback)

```java
// Always use SLF4J facade
private static final Logger log = LoggerFactory.getLogger(OrderService.class);
// Or with Lombok: @Slf4j on the class

// Structured logging with parameters — never string concatenation
log.info("Order created orderId={} customerId={} itemCount={}",
    order.getId(), order.getCustomerId(), order.getItems().size());

// MDC for request-scoped context
MDC.put("requestId", requestId);
MDC.put("userId", userId);
try {
    // All log statements in this scope include requestId and userId
    processOrder(order);
} finally {
    MDC.clear();
}
```

```xml
<!-- logback-spring.xml for JSON output in production -->
<configuration>
    <springProfile name="prod">
        <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder" />
        </appender>
    </springProfile>

    <springProfile name="local">
        <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
    </springProfile>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

## Anti-Patterns

```java
// Never: System.out.println for logging
System.out.println("Order created: " + order.getId());
// Use SLF4J logger

// Never: hardcoded versions scattered across modules
// Use dependencyManagement (Maven) or platform (Gradle)

// Never: fat JAR without layer optimization
// Use Spring Boot layered JARs for Docker cache efficiency

// Never: running as root in Docker containers
USER root // Security risk
// Use: non-root user (adduser)

// Never: skipping static analysis in CI
// SpotBugs, ErrorProne, and Checkstyle catch real bugs
```
