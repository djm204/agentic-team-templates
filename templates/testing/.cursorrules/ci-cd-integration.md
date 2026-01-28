# CI/CD Integration

Guidelines for integrating testing into continuous integration and deployment pipelines.

## Pipeline Architecture

### Test Stages

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD Pipeline                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌───────────┐  │
│  │ Static  │ → │   Unit   │ → │ Integration │ → │    E2E    │  │
│  │Analysis │   │  Tests   │   │   Tests     │   │   Tests   │  │
│  └─────────┘   └──────────┘   └─────────────┘   └───────────┘  │
│      ↓                                               ↓          │
│  ┌─────────┐                                   ┌───────────┐   │
│  │ Quality │                                   │Performance│   │
│  │  Gates  │                                   │   Tests   │   │
│  └─────────┘                                   └───────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fast Feedback First

Order tests by speed and confidence:

1. **Static Analysis** (seconds) - Catch obvious errors
2. **Unit Tests** (seconds-minutes) - Fast, isolated
3. **Integration Tests** (minutes) - Real dependencies
4. **E2E Tests** (minutes-hours) - Full system
5. **Performance Tests** (hours) - Load testing

## GitHub Actions Configuration

### Complete Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: test-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # Stage 1: Static Analysis (fastest)
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Type Check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Format Check
        run: npm run format:check

  # Stage 2: Unit Tests (fast)
  unit-tests:
    runs-on: ubuntu-latest
    needs: static-analysis
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Unit Tests
        run: npm run test:unit -- --coverage --reporter=junit --outputFile=test-results/junit.xml
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info
          fail_ci_if_error: true
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: unit-test-results
          path: test-results/

  # Stage 3: Integration Tests (medium)
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Run Migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
      
      - name: Run Integration Tests
        run: npm run test:integration -- --reporter=junit --outputFile=test-results/junit.xml
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: test-results/

  # Stage 4: E2E Tests (slow)
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Build Application
        run: npm run build
      
      - name: Start Application
        run: npm run start &
        env:
          NODE_ENV: test
      
      - name: Wait for Application
        run: npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run E2E Tests
        run: npm run test:e2e
      
      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-screenshots
          path: test-results/

  # Quality Gates
  quality-gates:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Check Coverage Threshold
        run: |
          npm run test:unit -- --coverage
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
      
      - name: Run Mutation Tests
        run: npx stryker run
        continue-on-error: true
      
      - name: Upload Mutation Report
        uses: actions/upload-artifact@v4
        with:
          name: mutation-report
          path: reports/mutation/

  # Performance Tests (main branch only)
  performance-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Staging
        run: ./scripts/deploy-staging.sh
      
      - name: Run Load Tests
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/smoke.js
          flags: --out json=results.json
      
      - name: Check Performance Thresholds
        run: |
          ERROR_RATE=$(jq '.metrics.http_req_failed.values.rate' results.json)
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Error rate $ERROR_RATE exceeds 1% threshold"
            exit 1
          fi
      
      - name: Upload Performance Results
        uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: results.json
```

### Parallel Test Execution

```yaml
# Run tests in parallel across multiple jobs
integration-tests:
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4]
  
  steps:
    - uses: actions/checkout@v4
    
    - run: npm ci
    
    - name: Run Tests (Shard ${{ matrix.shard }}/4)
      run: npm run test:integration -- --shard=${{ matrix.shard }}/4
```

### Test Caching

```yaml
# Cache test dependencies and build artifacts
- name: Cache Dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Cache Build
  uses: actions/cache@v4
  with:
    path: .next
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

## Pull Request Checks

### Required Checks

```yaml
# .github/workflows/pr-checks.yml
name: PR Checks

on: pull_request

jobs:
  test-coverage-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - run: npm ci
      
      - name: Get Changed Files
        id: changed-files
        uses: tj-actions/changed-files@v44
        with:
          files: |
            src/**/*.ts
            src/**/*.tsx
      
      - name: Check New Code Has Tests
        if: steps.changed-files.outputs.any_changed == 'true'
        run: |
          for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
            if [[ "$file" == *.test.* ]]; then
              continue
            fi
            
            TEST_FILE="${file%.ts}.test.ts"
            if [[ ! -f "$TEST_FILE" ]]; then
              echo "Missing test file for: $file"
              # Warn but don't fail
            fi
          done
      
      - name: Run Tests for Changed Files
        run: |
          npm run test:unit -- --changed --coverage

  lint-commit-messages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Lint Commit Messages
        uses: wagoid/commitlint-github-action@v5
```

### PR Comment with Results

```yaml
- name: Comment Test Results
  uses: actions/github-script@v7
  if: always() && github.event_name == 'pull_request'
  with:
    script: |
      const fs = require('fs');
      
      let coverage = 'N/A';
      try {
        const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
        coverage = `${summary.total.lines.pct.toFixed(1)}%`;
      } catch (e) {}
      
      const body = `## Test Results
      
      | Metric | Value |
      |--------|-------|
      | Coverage | ${coverage} |
      | Status | ${{ job.status }} |
      
      [View detailed report](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})
      `;
      
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: body
      });
```

## Test Environment Management

### Docker Compose for Local CI

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://postgres:test@db:5432/test
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
  
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7
```

### Testcontainers

```ts
// test/setup.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';

let postgres: StartedPostgreSqlContainer;
let redis: StartedRedisContainer;

export async function setupTestContainers() {
  postgres = await new PostgreSqlContainer()
    .withDatabase('test')
    .start();
  
  redis = await new RedisContainer().start();
  
  process.env.DATABASE_URL = postgres.getConnectionUri();
  process.env.REDIS_URL = `redis://${redis.getHost()}:${redis.getPort()}`;
}

export async function teardownTestContainers() {
  await postgres?.stop();
  await redis?.stop();
}
```

## Reporting and Visibility

### Test Report Generation

```ts
// vitest.config.ts
export default {
  test: {
    reporters: [
      'default',
      'junit',
      'html',
      ['vitest-sonar-reporter', { outputFile: 'sonar-report.xml' }],
    ],
    outputFile: {
      junit: 'test-results/junit.xml',
      html: 'test-results/report.html',
    },
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: 'coverage',
    },
  },
};
```

### SonarQube Integration

```yaml
- name: SonarQube Scan
  uses: SonarSource/sonarqube-scan-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

```properties
# sonar-project.properties
sonar.projectKey=my-project
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=**/*.test.ts
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.testExecutionReportPaths=sonar-report.xml
```

## Deployment Gates

### Staging Deployment

```yaml
deploy-staging:
  needs: [e2e-tests]
  runs-on: ubuntu-latest
  environment:
    name: staging
    url: https://staging.example.com
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Staging
      run: ./scripts/deploy.sh staging
    
    - name: Run Smoke Tests
      run: npm run test:smoke -- --base-url=https://staging.example.com
```

### Production Deployment

```yaml
deploy-production:
  needs: [performance-tests]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  environment:
    name: production
    url: https://example.com
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Production
      run: ./scripts/deploy.sh production
    
    - name: Run Health Checks
      run: |
        for i in {1..30}; do
          if curl -s https://example.com/health | grep -q "ok"; then
            exit 0
          fi
          sleep 10
        done
        exit 1
    
    - name: Notify Slack
      if: always()
      uses: slackapi/slack-github-action@v1
      with:
        payload: |
          {
            "text": "Deployment to production: ${{ job.status }}"
          }
```

## Best Practices

### 1. Fail Fast

Run fastest tests first. If static analysis fails, skip slower tests.

### 2. Parallelize Everything

Split tests across workers and shards for faster execution.

### 3. Cache Aggressively

Cache dependencies, build artifacts, and test databases.

### 4. Isolate Test Environments

Each test run should have isolated resources.

### 5. Artifact Everything

Upload test results, coverage, screenshots for debugging.

### 6. Notify on Failure

Alert team immediately when tests fail on main branch.

### 7. Track Metrics Over Time

Store test duration, coverage, flakiness metrics historically.

### 8. Review Test Reports in PRs

Make test results visible and actionable in pull requests.
