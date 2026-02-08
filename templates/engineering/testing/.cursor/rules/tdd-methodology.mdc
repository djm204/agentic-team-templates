---
description: TDD Methodology
alwaysApply: false
---

# TDD Methodology

## Red-Green-Refactor Cycle

1. **RED**: Write a failing test that describes desired behavior
2. **GREEN**: Write the minimum code to make it pass
3. **REFACTOR**: Improve code quality while keeping tests green

Each cycle should take 2-10 minutes. If stuck in red >10 minutes, the slice is too big.

## Best Practices

- **One test at a time** — write one failing test, make it pass, refactor, repeat
- **Start with the simplest case** — empty input, zero, null, then add complexity
- **Test the API, not the implementation** — test public interface, not private methods
- **Commit after each green** — small, atomic commits

## TDD Patterns

### Triangulation
Use multiple examples to drive toward a general solution. Two specific cases reveal the pattern.

### Test List
Before coding, write a list of tests you expect to need. Work through the list, adding tests you discover along the way.

### Spike and Stabilize
For exploratory work: spike first, delete it, then TDD the real implementation.

## When TDD Adds Maximum Value

- Complex business logic and algorithms
- State machines and edge-heavy code
- Financial calculations and security logic
- Integration points (APIs, databases, queues)

## When to Adapt

- **Rapid prototypes**: Spike first, discard, then TDD
- **Outside-In (London)**: Start with E2E test, mock dependencies, work inward
- **Inside-Out (Chicago)**: Start with domain logic, build up from units

## Common Mistakes

- **Skipping RED**: If you write code before the test, you don't know if the test works
- **Writing too many tests at once**: Defeats the purpose — one test, one cycle
- **Not refactoring**: The refactor step is not optional
- **Giant leaps**: If your test requires lots of code, break it into smaller tests
