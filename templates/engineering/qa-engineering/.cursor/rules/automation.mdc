---
description: Test Automation
alwaysApply: false
---

# Test Automation

Best practices for building maintainable test automation.

## What to Automate vs. Keep Manual

- **Automate**: Regression, smoke tests, API tests, data-driven tests, performance baselines
- **Manual**: Exploratory testing, usability testing, new/changing features, visual/UX assessment

## Test Structure

Use **Arrange-Act-Assert** for clarity:

```javascript
it('calculates total with discount', () => {
  // Arrange
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, quantity: 2 });
  cart.applyDiscount('SAVE10');
  // Act
  const total = cart.getTotal();
  // Assert
  expect(total).toBe(180);
});
```

## Page Object Pattern

Encapsulate UI locators and actions in page objects. Tests call page methods, never raw selectors. Each page class owns its locators, exposes action methods, and optionally assertion helpers.

## Test Data Management

- **Factories** — `createUser(overrides)` for dynamic, unique test data
- **Fixtures** — Static reference data for known states
- **Isolation** — Each test creates and cleans up its own data
- **No production data** — Always use synthetic or sanitized data

## Flaky Test Prevention

| Cause | Solution |
|-------|----------|
| Timing issues | Explicit waits for conditions, never `sleep` |
| Shared state | Each test manages its own data |
| External services | Mock or stub dependencies |
| Race conditions | Wait for specific responses, not timeouts |

```javascript
// Bad: arbitrary sleep
await page.waitForTimeout(5000);

// Good: wait for specific condition
await page.waitForSelector('[data-testid="success"]');
```

## CI/CD Integration

- Run unit tests on every push, integration on every PR, E2E daily and pre-release
- Fail the build on test failures — no exceptions
- Upload artifacts (screenshots, traces) on failure for debugging
- Enable parallel execution to keep suite under 5 minutes

## Anti-Patterns

- **Automating unstable features** — Wait for stability before investing in automation
- **Ignoring flaky tests** — Fix or quarantine immediately; flaky tests erode all confidence
- **No test maintenance** — Review and prune quarterly; remove obsolete tests
