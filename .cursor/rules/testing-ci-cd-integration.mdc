---
description: CI/CD test integration—pipeline order (static, unit, integration, E2E), fast feedback, coverage and artifacts. Concurrency and reporting.
alwaysApply: false
---

# CI/CD Integration

Guidelines for integrating tests into CI/CD.

## Principles

- **Fast feedback first** - Order by speed: static analysis → unit → integration → E2E. Fail fast so developers get quick signal.
- **Deterministic** - Same commit = same result; no flaky passes. Quarantine or fix flaky tests.
- **Artifacts** - Upload test results (JUnit/XML), coverage, and on failure E2E reports/playwright traces for debugging.

## Pipeline Stages

1. **Static** (seconds): Lint, type-check, format. Blocks rest if failed.
2. **Unit** (seconds–minutes): Fast tests, coverage; output JUnit for dashboards.
3. **Integration** (minutes): Real DB/services (e.g. Postgres in CI); migrate then run tests; isolate DB per run.
4. **E2E** (minutes): Playwright or similar; critical paths only; upload report/artifacts on failure.
5. **Performance** (optional, main only): k6 or similar; store baseline or results; fail on regression.

Use `concurrency: cancel-in-progress` so only latest run matters for a branch. Use `needs` so later stages run only if earlier pass.

## Configuration Snippets

- **Unit**: `npm run test -- --coverage --reporter=junit --outputFile=test-results/junit.xml`. Upload coverage to Codecov/Coveralls; enforce threshold in job or separate step.
- **Integration**: Start services (e.g. `services: postgres` in GitHub Actions); set `DATABASE_URL`; run migrations then `npm run test:integration`.
- **E2E**: Install Playwright deps, build app, run E2E; on failure upload `playwright-report/` or trace as artifact.
- **Reporting**: Vitest: `reporters: ['default', 'junit', 'html']`, `outputFile` for junit/html; coverage `reportsDirectory: 'coverage'`.

## Definition of Done (CI Tests)

- [ ] Static, unit, integration (and E2E if applicable) in pipeline; order and dependencies correct.
- [ ] Coverage uploaded and threshold enforced; test results artifact for dashboards.
- [ ] No flaky tests; failures are actionable (logs/artifacts).

## Common Pitfalls

- **E2E on every PR** - Slow; run E2E on main or nightly, or a subset on PR.
- **No artifacts on failure** - Always upload playwright report or logs so failures are debuggable.
- **Shared state** - Isolate DB and services per run; no leftover data between jobs.
