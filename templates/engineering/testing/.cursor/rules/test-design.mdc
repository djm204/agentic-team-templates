---
description: Test design—AAA, Given-When-Then, isolation, one assertion focus. Test behavior; use factories; avoid shared state and implementation coupling.
alwaysApply: false
---

# Test Design Patterns

Guidelines for clear, maintainable tests.

## Arrange-Act-Assert (AAA)

- **Arrange**: Set up data and dependencies (use factories); keep minimal.
- **Act**: One call or operation under test.
- **Assert**: Verify outcome; prefer one logical assertion per test (multiple expects for one behavior is fine).
- Separate sections with blank lines; no logic in assert beyond the check.

## Given-When-Then (BDD)

- **Given**: Precondition (state, data).
- **When**: Action (user or system).
- **Then**: Expected outcome. Use for acceptance-style tests; keeps scenarios readable.

## Isolation

- Each test independent; no shared mutable state. Use `beforeEach` to reset DB or create fresh instances; or use factories per test.
- Run order must not matter; shuffle test order occasionally to catch dependencies.
- Isolate I/O and time: mock external services; fake time for date-dependent behavior.

## What to Test

- **Behavior**: Input → expected output; error cases; boundaries. Not implementation details (e.g. “calls private method X”).
- **One concern per test**: Name describes the scenario; failure points to single cause.
- **Public API**: Test through public interface; avoid testing internals.

## Definition of Done (Design)

- [ ] AAA or Given-When-Then used consistently; tests readable.
- [ ] No shared mutable state; tests pass in any order.
- [ ] Tests focus on behavior; no brittle implementation coupling.

## Common Pitfalls

- **Testing implementation** - Assert on outcome, not on “this internal function was called.”
- **Multiple acts** - One logical act per test; split into multiple tests if needed.
- **Shared state** - One test mutating global or DB breaks others; isolate per test.
