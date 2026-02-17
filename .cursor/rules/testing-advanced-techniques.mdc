---
description: Advanced testing—property-based, mutation, contract (Pact), chaos. Invariants over examples; test quality; consumer-driven contracts.
alwaysApply: false
---

# Advanced Testing Techniques

Guidelines for property-based, mutation, contract, and chaos-oriented tests.

## Property-Based Testing

Test **properties** that hold for all inputs (e.g. sort length unchanged, idempotent trim). Use fast-check or similar; generate many inputs; fail with minimal counterexample.

- **Roundtrip**: `parse(serialize(x)) === x`.
- **Invariant**: e.g. `sort(arr).length === arr.length`.
- **Idempotence**: `f(f(x)) === f(x)`.
- **Bounds**: output in expected range for all generated inputs.

One short example per property; avoid redundant example-based tests for the same behavior.

## Mutation Testing

Mutate code (e.g. change `>=` to `>`, constants) and run tests; if tests still pass, they may not cover that behavior. Use Stryker or similar; aim for mutation score (e.g. 70%+); fix or add tests for surviving mutants. Run in CI on main or weekly to avoid slow PRs.

## Contract Testing (Pact)

Consumer defines expected request/response; provider verification ensures provider satisfies it. Use for service boundaries; avoid heavy E2E for “does provider match consumer expectation.” One contract per consumer–provider pair; verify in provider CI.

## Chaos / Resilience

Inject latency or failures (e.g. timeout, 503) into dependencies; assert retries, fallbacks, or graceful degradation. Use small blast radius; restore after test. Complements normal tests by validating “when dependency fails, we do X.”

## Definition of Done (Advanced)

- [ ] Property-based tests for critical invariants where useful.
- [ ] Mutation score tracked; surviving mutants reviewed.
- [ ] Contracts for key consumer–provider pairs; verified in CI.
- [ ] Chaos/resilience tests only where business need is clear.

## Common Pitfalls

- **Property tests for everything** - Use where invariants are clear and valuable; not a replacement for focused example tests.
- **Mutation as gate on every PR** - Can be slow; run on main or periodically.
- **Contract drift** - Keep contracts in sync with real usage; verify provider regularly.
