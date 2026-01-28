# Quality Metrics

Guidelines for measuring test quality beyond simple coverage percentages.

## The Problem with Coverage Alone

High code coverage doesn't guarantee effective tests. You can have 100% coverage with tests that:
- Never fail
- Don't check results
- Miss edge cases
- Test implementation, not behavior

**Goodhart's Law**: "When a measure becomes a target, it ceases to be a good measure."

## Multi-Dimensional Quality Metrics

### 1. Code Coverage (Baseline Hygiene)

Traditional metrics as a starting point:

| Metric | Target | Purpose |
|--------|--------|---------|
| Line Coverage | 80%+ | Code is executed |
| Branch Coverage | 75%+ | Decision paths tested |
| Function Coverage | 90%+ | Public APIs tested |
| Statement Coverage | 80%+ | Statements executed |

```ts
// vitest.config.ts
export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 90,
        statements: 80,
      },
      exclude: [
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        '**/types/**',
      ],
    },
  },
};
```

### 2. Mutation Score (Test Effectiveness)

Mutation testing measures whether your tests actually catch bugs.

**How it works:**
1. Tool introduces small changes (mutations) to your code
2. Tests run against each mutant
3. "Killed" mutants = tests caught the bug
4. "Survived" mutants = tests missed the bug

```ts
// Original code
function isAdult(age: number): boolean {
  return age >= 18;
}

// Mutant 1: Change >= to >
return age > 18;  // Should be killed by test for age=18

// Mutant 2: Change 18 to 17
return age >= 17; // Should be killed by boundary test

// Mutant 3: Return opposite
return age < 18;  // Should be killed by any positive test
```

**Target**: 70%+ mutation score

**Tools:**
- Stryker (JavaScript/TypeScript)
- PITest (Java)
- mutmut (Python)

```json
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "testRunner": "vitest",
  "reporters": ["clear-text", "html", "dashboard"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "mutator": {
    "excludedMutations": ["StringLiteral"]
  }
}
```

### 3. Assertion Density

Tests should make meaningful assertions:

```ts
// Bad: No assertions (high coverage, low quality)
it('processes order', async () => {
  await processOrder(orderData);
  // No expect!
});

// Bad: Weak assertion
it('processes order', async () => {
  const result = await processOrder(orderData);
  expect(result).toBeDefined(); // Too weak
});

// Good: Meaningful assertions
it('processes order', async () => {
  const order = await processOrder(orderData);
  expect(order.status).toBe('confirmed');
  expect(order.total).toBe(150);
  expect(order.items).toHaveLength(2);
});
```

**Target**: 2-5 assertions per test (one logical concept)

### 4. Test Execution Time

Fast tests get run. Slow tests get skipped.

| Test Type | Target | Max Acceptable |
|-----------|--------|----------------|
| Unit | <10ms | 50ms |
| Integration | <500ms | 2s |
| E2E | <30s | 2min |
| Full Suite | <5min | 15min |

Monitor and alert on regression:

```yaml
# CI quality gate
- name: Check Test Duration
  run: |
    START=$(date +%s)
    npm test
    END=$(date +%s)
    DURATION=$((END - START))
    
    if [ $DURATION -gt 300 ]; then
      echo "Test suite took ${DURATION}s, exceeds 5 minute limit"
      exit 1
    fi
```

### 5. Flaky Test Rate

Flaky tests erode confidence and waste time.

**Target**: 0% flaky tests

Track and quarantine:

```ts
// vitest.config.ts
export default {
  test: {
    retry: 2, // Retry failed tests to identify flakes
    reporters: [
      'default',
      ['vitest-flake-tracker', { outputFile: 'flaky-tests.json' }],
    ],
  },
};
```

### 6. Test-to-Code Ratio

Healthy projects have similar amounts of test code and production code.

**Target**: 1:1 to 1.5:1 (test lines : production lines)

```bash
# Measure ratio
PROD_LINES=$(find src -name '*.ts' ! -name '*.test.ts' | xargs wc -l | tail -1 | awk '{print $1}')
TEST_LINES=$(find src -name '*.test.ts' | xargs wc -l | tail -1 | awk '{print $1}')
RATIO=$(echo "scale=2; $TEST_LINES / $PROD_LINES" | bc)
echo "Test-to-code ratio: $RATIO"
```

## Quality Gates in CI

### Comprehensive Quality Pipeline

```yaml
# .github/workflows/quality.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run format:check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - run: npm ci
      - run: npm test -- --coverage --reporter=junit
      
      - name: Check Coverage Thresholds
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Line coverage $COVERAGE% below 80% threshold"
            exit 1
          fi

  mutation-testing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - run: npm ci
      - run: npx stryker run
      
      - name: Check Mutation Score
        run: |
          SCORE=$(jq '.mutationScore' reports/mutation/mutation-score.json)
          if (( $(echo "$SCORE < 70" | bc -l) )); then
            echo "Mutation score $SCORE% below 70% threshold"
            exit 1
          fi

  test-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - run: npm ci
      - run: npm test -- --passWithNoTests=false
      
      - name: Check Test Duration
        run: |
          npm test -- --reporter=json > test-results.json
          DURATION=$(jq '.numTotalTests * 100' test-results.json) # Rough estimate
          if [ $DURATION -gt 300000 ]; then
            echo "Tests taking too long"
            exit 1
          fi
```

### Pull Request Quality Checks

```yaml
# .github/workflows/pr-quality.yml
name: PR Quality

on: pull_request

jobs:
  changed-files-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Get changed files
        id: changed-files
        run: |
          echo "files=$(git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -E '\.(ts|tsx)$' | grep -v '.test.' | tr '\n' ',')" >> $GITHUB_OUTPUT
      
      - name: Check new code has tests
        run: |
          for file in $(echo "${{ steps.changed-files.outputs.files }}" | tr ',' '\n'); do
            TEST_FILE="${file%.ts}.test.ts"
            if [ ! -f "$TEST_FILE" ]; then
              echo "Missing test file for: $file"
              exit 1
            fi
          done
```

## Tracking Metrics Over Time

### Dashboard Metrics

```ts
// scripts/collect-metrics.ts
import fs from 'fs';

interface QualityMetrics {
  date: string;
  lineCoverage: number;
  branchCoverage: number;
  mutationScore: number;
  testCount: number;
  testDuration: number;
  flakyTests: number;
  testToCodeRatio: number;
}

async function collectMetrics(): Promise<QualityMetrics> {
  const coverage = JSON.parse(
    fs.readFileSync('coverage/coverage-summary.json', 'utf8')
  );
  
  const mutation = JSON.parse(
    fs.readFileSync('reports/mutation/mutation-score.json', 'utf8')
  );
  
  const testResults = JSON.parse(
    fs.readFileSync('test-results.json', 'utf8')
  );

  return {
    date: new Date().toISOString(),
    lineCoverage: coverage.total.lines.pct,
    branchCoverage: coverage.total.branches.pct,
    mutationScore: mutation.mutationScore,
    testCount: testResults.numTotalTests,
    testDuration: testResults.testResults.reduce(
      (sum, t) => sum + t.duration,
      0
    ),
    flakyTests: countFlakyTests(),
    testToCodeRatio: calculateTestToCodeRatio(),
  };
}
```

### Trend Analysis

```ts
// Check for regressions
function checkForRegressions(
  current: QualityMetrics,
  previous: QualityMetrics
): string[] {
  const issues: string[] = [];

  if (current.lineCoverage < previous.lineCoverage - 2) {
    issues.push(
      `Line coverage dropped from ${previous.lineCoverage}% to ${current.lineCoverage}%`
    );
  }

  if (current.mutationScore < previous.mutationScore - 5) {
    issues.push(
      `Mutation score dropped from ${previous.mutationScore}% to ${current.mutationScore}%`
    );
  }

  if (current.testDuration > previous.testDuration * 1.2) {
    issues.push(
      `Test duration increased by ${Math.round((current.testDuration / previous.testDuration - 1) * 100)}%`
    );
  }

  if (current.flakyTests > previous.flakyTests) {
    issues.push(
      `Flaky tests increased from ${previous.flakyTests} to ${current.flakyTests}`
    );
  }

  return issues;
}
```

## Quality Improvement Strategies

### When Coverage is Low

1. Identify untested files: `npx vitest --coverage --reporter=html`
2. Prioritize by risk (business logic, security, data handling)
3. Write integration tests first (higher coverage per test)
4. Use TDD for new features

### When Mutation Score is Low

1. Run mutation report: `npx stryker run`
2. Find survived mutants
3. Add assertions that would catch those mutations
4. Focus on boundary conditions and logic branches

### When Tests are Slow

1. Profile test execution
2. Parallelize independent tests
3. Use test database per worker
4. Mock expensive external calls
5. Split slow integration tests from fast unit tests

### When Flaky Tests Appear

1. Quarantine immediately
2. Add to flaky test tracking
3. Analyze root cause (timing, state, external deps)
4. Fix or delete - don't leave flaky tests running

## Reporting and Visibility

### Test Quality Badge

```markdown
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![Mutation Score](https://img.shields.io/badge/mutation-75%25-green)
![Tests](https://img.shields.io/badge/tests-342-blue)
```

### Weekly Quality Report

```ts
function generateWeeklyReport(metrics: QualityMetrics[]): string {
  const latest = metrics[metrics.length - 1];
  const weekAgo = metrics[0];

  return `
## Test Quality Report

### Current Metrics
- Line Coverage: ${latest.lineCoverage}% (target: 80%)
- Mutation Score: ${latest.mutationScore}% (target: 70%)
- Test Count: ${latest.testCount}
- Avg Test Duration: ${latest.testDuration}ms

### Week-over-Week
- Coverage: ${(latest.lineCoverage - weekAgo.lineCoverage).toFixed(1)}%
- Mutation Score: ${(latest.mutationScore - weekAgo.mutationScore).toFixed(1)}%
- Tests Added: ${latest.testCount - weekAgo.testCount}

### Action Items
${generateActionItems(latest)}
  `;
}
```
