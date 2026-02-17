---
description: Testing Best Practices
alwaysApply: false
---

# Testing Best Practices

Tests are a first-class deliverable. A feature without tests is incomplete.

## Core Principles

- **Test behavior, not implementation** — Verify what the system does so refactoring doesn't break tests
- **Testing Trophy** — Prioritize integration tests (~60%) over unit (~20%), with E2E (~10%) and static analysis (~10%)
- **Fast feedback** — Unit < 10ms, integration < 500ms, E2E < 30s, full suite < 5 min
- **Deterministic results** — Mock time, isolate data, reset state, use explicit waits
- **Tests as documentation** — Anyone should understand system behavior by reading tests

## Test Behavior, Not Implementation

```ts
// Bad: tests implementation detail
it('calls repo.save', () => {
  const spy = vi.spyOn(repo, 'save');
  service.createUser(data);
  expect(spy).toHaveBeenCalled();
});

// Good: tests observable behavior
it('persists user', async () => {
  await service.createUser(data);
  const user = await db.user.findUnique({ where: { email: data.email } });
  expect(user).toBeDefined();
});
```

## TDD (When Valuable)

Red-Green-Refactor in 2-10 minute cycles. Best for complex business logic, security-critical code, and systems with many edge cases. Skip for prototypes and exploratory spikes.

## Coverage Targets

| Metric | Target |
|--------|--------|
| Line Coverage | 80%+ |
| Branch Coverage | 75%+ |
| Function Coverage | 90%+ |
| Mutation Score | 70%+ |

## Definition of Done

- Critical paths have integration tests
- Pure functions have unit tests
- Edge cases and error paths tested
- Tests are deterministic with no flaky tests
- Coverage meets thresholds

## Anti-Patterns

- **Excessive mocking** — Mock only what you don't control; use real dependencies in integration tests
- **Shared mutable state** — Create fresh state per test; never mutate shared setup
- **Testing everything with E2E** — Use unit/integration for validation and edge cases; E2E for critical journeys only
