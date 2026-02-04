---
description: Test data—factories, fixtures, isolation, determinism. Realistic but minimal; no production data; Faker with seed for reproducibility.
alwaysApply: false
---

# Test Data Management

Guidelines for test data.

## Principles

1. **Realistic** - Resemble production shape and constraints (e.g. valid email, sane ranges).
2. **Isolated** - Each test creates what it needs; no shared mutable state.
3. **Minimal** - Only the data required for the scenario.
4. **Deterministic** - Seed Faker (e.g. `faker.seed(12345)`) so runs are reproducible.
5. **No production data** - Never use real user or sensitive data.

## Factories

- **Per entity**: Factory function (e.g. `user(overrides)`, `order(overrides)`) returning full object; use Faker for defaults; merge overrides for specific tests.
- **Builders** (optional): Fluent API for complex objects when many optional fields.
- **Co-locate** in `tests/factories` or `tests/fixtures`; export one place.

## Fixtures and DB

- **Fixtures**: Static JSON or seed scripts for reference data (e.g. product catalog). Load in `beforeAll` or per test if isolated.
- **DB**: Reset or truncate in `beforeEach` (or per-test DB) so tests don’t depend on order. Create only needed entities via factories.
- **Snapshots**: Use sparingly for stable, complex output; prefer explicit assertions for most cases.

## Determinism

- **Faker**: Set `faker.seed(...)` once in test setup so same sequence every run.
- **Dates**: Use fake time (e.g. `vi.setSystemTime`) for time-dependent behavior.
- **IDs**: Factories can use Faker UUIDs; or fixed IDs in fixtures when relationship matters.

## Definition of Done (Test Data)

- [ ] Factories for main entities; overrides for scenario-specific data.
- [ ] No shared mutable state; DB or store reset between tests.
- [ ] Faker (or equivalent) seeded for deterministic runs.

## Common Pitfalls

- **Shared state** - One test mutating data another expects; isolate or reset.
- **Brittle snapshots** - Large or frequently changing output; prefer targeted assertions.
- **Production copy** - Never copy prod DB; use anonymized/synthetic data only.
