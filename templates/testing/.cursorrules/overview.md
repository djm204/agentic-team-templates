# Testing Best Practices

Comprehensive guidelines for building world-class, principal-level test suites.

## Scope

This ruleset applies to:
- Unit testing
- Integration testing
- End-to-end (E2E) testing
- Performance and load testing
- Contract testing
- Property-based testing
- Mutation testing
- Chaos engineering tests

## Core Philosophy

**Tests are a first-class deliverable.** A feature without tests is incomplete. Tests provide confidence to ship, enable rapid iteration, and serve as executable documentation.

## Testing Trophy (Not Pyramid)

The Testing Trophy prioritizes integration tests over unit tests for maximum real-world value:

```
         ┌─────────────┐
         │     E2E     │  ~10% - Critical user journeys only
         ├─────────────┤
         │             │
         │ Integration │  ~60% - Maximum confidence/cost ratio
         │             │
         ├─────────────┤
         │    Unit     │  ~20% - Pure functions and logic
         ├─────────────┤
         │   Static    │  ~10% - Types, linting, formatting
         └─────────────┘
```

## Key Principles

### 1. Test Behavior, Not Implementation

Tests should verify what the system does, not how it does it. This allows refactoring without breaking tests.

```ts
// Bad: Tests implementation
it('calls repository.save', () => {
  const spy = vi.spyOn(repo, 'save');
  service.createUser(data);
  expect(spy).toHaveBeenCalled();
});

// Good: Tests behavior
it('persists user to database', async () => {
  await service.createUser(data);
  const user = await db.user.findUnique({ where: { email: data.email } });
  expect(user).toBeDefined();
});
```

### 2. Fast Feedback Loops

Tests must run quickly to be useful. Slow tests get skipped or ignored.

| Test Type | Target Time |
|-----------|-------------|
| Unit tests | < 10ms each |
| Integration tests | < 500ms each |
| E2E tests | < 30s each |
| Full suite | < 5 minutes |

### 3. Deterministic Results

Same inputs must produce same outputs, always. No flaky tests allowed.

- Mock time-dependent code
- Isolate test data
- Reset state between tests
- Use explicit waits, not sleeps

### 4. Tests as Documentation

Tests describe system behavior. Anyone should be able to understand what the code does by reading its tests.

```ts
describe('OrderService', () => {
  describe('when cart has items', () => {
    it('creates order with correct total');
    it('decrements inventory for each item');
    it('sends confirmation email to user');
    it('returns order confirmation number');
  });

  describe('when cart is empty', () => {
    it('throws EmptyCartError');
    it('does not create order record');
  });
});
```

### 5. Write Tests First (TDD)

For complex logic, write the test before the implementation:

1. **Red** - Write a failing test
2. **Green** - Write minimal code to pass
3. **Refactor** - Improve code quality

## Technology Stack

### Recommended Tools

| Purpose | Tool | Why |
|---------|------|-----|
| Unit/Integration | Vitest | Fast, modern, ESM native |
| E2E | Playwright | Cross-browser, reliable |
| Performance | k6 | Developer-friendly, scriptable |
| Contract | Pact | Consumer-driven, battle-tested |
| Property | fast-check | Finds edge cases automatically |
| Mutation | Stryker | Validates test quality |
| Mocking | MSW | Network-level mocking |

### Vitest Configuration

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/test/**'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 90,
      },
    },
    sequence: {
      shuffle: true, // Catch order dependencies
    },
  },
});
```

## Definition of Done

A test suite is complete when:

- [ ] Critical paths have integration tests
- [ ] Pure functions have unit tests
- [ ] Edge cases are explicitly tested
- [ ] Error paths are tested
- [ ] Tests are deterministic
- [ ] No flaky tests
- [ ] Coverage meets thresholds
- [ ] Tests run in under 5 minutes
- [ ] Documentation is current
