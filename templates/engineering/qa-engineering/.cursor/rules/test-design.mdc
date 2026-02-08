---
description: Test Design
alwaysApply: false
---

# Test Design

Best practices for designing effective, reproducible test cases.

## Test Case Essentials

Every test case needs: clear title, priority, preconditions, specific steps with expected results, and traceability to a requirement. Vague tests like "check if it works" are useless.

## Design Techniques

### Equivalence Partitioning
Divide inputs into groups that behave identically. Test one value per partition:
- Valid partitions (standard, edge-of-valid)
- Invalid partitions (missing, empty, malformed, out-of-range)

### Boundary Value Analysis
Test at the edges of valid ranges. For a field accepting 1-100: test 0, 1, 2, 99, 100, 101.

### State Transition Testing
Map valid/invalid state transitions. Test that invalid transitions (e.g., Shipped -> Created) are rejected.

### Decision Table Testing
For complex business rules with multiple conditions, enumerate condition combinations and verify correct actions for each.

### Pairwise Testing
For features with many input combinations, use pairwise to reduce combinatorial explosion while covering all two-way interactions.

## Common Edge Cases

| Category | Examples |
|----------|----------|
| Empty/Null | Empty string, null, undefined, whitespace only |
| Boundaries | Zero, negative, max int, min int |
| Format | Wrong type, wrong encoding, special characters |
| Timing | Concurrent requests, timeouts, race conditions |
| State | Already exists, doesn't exist, locked, expired |
| Permissions | Unauthorized, wrong role, expired token |

## Test Data Best Practices

- **Externalize** — Store data outside tests for reuse
- **Isolate** — Each test manages and cleans up its own data
- **Seed consistently** — Deterministic starting state
- **Version control** — Track test data changes

## Traceability

Maintain a requirement-to-test mapping. Flag requirements with no coverage for prioritization. Every acceptance criterion should have at least one test case.

## Anti-Patterns

- **Vague steps** — "Login and check" tells nobody anything; be specific about inputs and expected outputs
- **Missing preconditions** — Tests that fail because setup was assumed, not documented
- **No negative testing** — Only testing happy paths misses where most bugs live
