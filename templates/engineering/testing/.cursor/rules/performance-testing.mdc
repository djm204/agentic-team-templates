---
description: Performance testing—smoke, load, stress, spike, soak. k6 stages and thresholds; baseline and regression; run in CI or on schedule.
alwaysApply: false
---

# Performance Testing

Guidelines for load and performance validation.

## Test Types

- **Smoke**: Minimal load (e.g. 1–5 VUs, 1–2 min); verify system responds. Run on every deploy or PR.
- **Load**: Expected traffic (e.g. 50–100 VUs, 10–30 min); validate latency and error rate under normal load.
- **Stress**: Ramp until failure; find breaking point and recovery.
- **Spike**: Sudden surge; validate behavior when load jumps.
- **Soak**: Steady load for hours; find leaks and degradation over time.

## k6 Basics

- **Options**: `vus`, `duration`, or `stages` (ramp up, sustain, ramp down). Set `thresholds`: e.g. `http_req_duration: ['p(95)<500']`, `http_req_failed: ['rate<0.01']`.
- **Default function**: Each VU runs the function in a loop; use `check()` for assertions; `sleep()` for think time.
- **Output**: JSON or cloud for reporting; fail run if thresholds breached.

## Baselines and Regression

- Establish baseline (e.g. p95 latency, error rate) from a known-good run. In CI or nightly, compare current run to baseline; fail or alert on regression (e.g. p95 > 1.2× baseline).
- Store baseline in repo or artifact; update when intentional changes are made.

## Definition of Done (Perf Tests)

- [ ] Smoke test in pipeline; load/stress run on main or schedule.
- [ ] Thresholds and (optional) baseline defined; failures block or alert.
- [ ] Results stored for trend analysis.

## Common Pitfalls

- **No thresholds** - Tests run but don’t fail on degradation; always set thresholds.
- **Only happy path** - Include error paths and high load; validate under failure.
- **Ignoring environment** - Run against staging or dedicated env; document so results are comparable.
