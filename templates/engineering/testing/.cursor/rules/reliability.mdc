---
description: Test reliability—eliminate flakiness. Timing (explicit waits), isolation, no order dependency, mock time; zero flaky in CI.
alwaysApply: false
---

# Test Reliability

Guidelines for deterministic, non-flaky tests.

## Goal

**Zero flaky tests in CI.** Flakiness erodes trust and wastes time; fix or quarantine with a ticket.

## Common Causes and Fixes

- **Timing** - Tests assume something finishes in N ms. Fix: use explicit waits (e.g. `waitFor`, `expect(...).toHaveText(..., { timeout })`) or polling until condition; never bare `sleep(N)` for assertions.
- **Shared state** - One test changes DB or global state; another fails. Fix: isolate (fresh DB, new instance, or reset in `beforeEach`); no shared mutable globals.
- **Order dependency** - Tests pass only when run in sequence. Fix: each test independent; shuffle test order (e.g. Vitest `sequence.shuffle`) to catch.
- **External services** - Network or third-party flakiness. Fix: mock or use test doubles in unit/integration; or run against stable stub.
- **Time-dependent logic** - “Today” or “last 7 days” varies. Fix: fake time (`vi.useFakeTimers`, `vi.setSystemTime`) so dates are fixed.
- **Parallelism** - Shared resource (e.g. port, file) used by concurrent tests. Fix: unique port per test, or run tests that share resource sequentially.

## Practices

- **Polling**: `waitFor(() => getJob(id).then(j => j.status === 'complete' ? j : null), { timeout, interval })` instead of fixed sleep.
- **Isolation**: Vitest `isolate: true`, `pool: 'forks'`; or ensure no global/DB state leaks.
- **Quarantine**: If flaky and not immediately fixable, skip with `it.todo` or tag and link to ticket; fix soon.

## Definition of Done (Reliability)

- [ ] No flaky tests in main branch; CI green without retries.
- [ ] Explicit waits for async/UI; no arbitrary sleeps for assertions.
- [ ] Shared state removed; tests pass in any order.

## Common Pitfalls

- **Retrying flaky tests** - Hides the problem; fix root cause or quarantine.
- **Sleep instead of wait** - Use condition-based wait with timeout.
- **Shared DB without reset** - Each test or suite gets clean state.
