---
description: Quality Metrics
alwaysApply: false
---

# Quality Metrics

Measure test quality beyond simple coverage. High coverage with weak assertions catches nothing.

## Multi-Dimensional Metrics

### Code Coverage (Baseline)

| Metric | Target |
|--------|--------|
| Line Coverage | 80%+ |
| Branch Coverage | 75%+ |
| Function Coverage | 90%+ |

### Mutation Score (Test Effectiveness)
Introduces small code changes and checks if tests catch them. Survived mutants = missed bugs.

```ts
// Original
function isAdult(age: number) { return age >= 18; }
// Mutant: age > 18  — boundary test for age=18 should kill this
// Mutant: age >= 17 — should be killed by boundary test
```

**Target**: 70%+ mutation score. Tools: Stryker (JS/TS), PITest (Java), mutmut (Python).

### Assertion Density
Tests must make meaningful assertions, not just execute code:

```ts
// Bad: no real assertion
const result = await processOrder(data);
expect(result).toBeDefined();

// Good: verifies behavior
const order = await processOrder(data);
expect(order.status).toBe('confirmed');
expect(order.total).toBe(150);
```

**Target**: 2-5 meaningful assertions per test.

### Execution Time

| Type | Target | Max |
|------|--------|-----|
| Unit | < 10ms | 50ms |
| Integration | < 500ms | 2s |
| E2E | < 30s | 2min |
| Full suite | < 5min | 15min |

### Flaky Test Rate
**Target**: 0%. Quarantine immediately, fix or delete. Never leave flaky tests running.

### Test-to-Code Ratio
**Target**: 1:1 to 1.5:1 (test lines : production lines).

## Improvement Strategies

- **Low coverage** — Write integration tests first (highest coverage per test), use TDD for new features
- **Low mutation score** — Find survived mutants, add assertions for boundary conditions and logic branches
- **Slow tests** — Profile, parallelize, mock expensive externals, split slow integration from fast unit
- **Flaky tests** — Quarantine immediately, analyze root cause (timing, state, external deps), fix or delete

## Anti-Patterns

- **Coverage as sole metric** — 100% coverage means nothing if tests never fail on real bugs
- **Ignoring mutation testing** — Coverage says "code ran," mutation score says "tests actually verify behavior"
- **No regression tracking** — Monitor metrics over time; a single drop is noise, a trend needs action
