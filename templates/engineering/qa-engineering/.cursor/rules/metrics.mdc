---
description: QA Metrics
alwaysApply: false
---

# QA Metrics

Measure and improve quality with actionable metrics.

## Key Metrics

### Defect Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Defect Density | Defects / KLOC | < 1.0 |
| Defect Escape Rate | Prod Defects / Total Defects | < 5% |
| Defect Removal Efficiency | Pre-release Defects / Total Defects | > 95% |
| MTTR | Time to fix defects | < 24h for P1 |

### Coverage & Execution Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Code Coverage | > 80% | Test thoroughness |
| Branch Coverage | > 70% | Decision path testing |
| Test Pass Rate | > 95% | Test health |
| Automation Rate | > 70% | Automation maturity |
| Flaky Test Rate | < 2% | Automation reliability |

## Defect Removal Efficiency (DRE)

```text
DRE = (Defects found before release / Total defects) × 100

Example: 50 dev + 40 QA + 8 staging + 2 prod = 100 total
DRE = 98/100 = 98%   Target: > 95%
```

## Escape Rate Analysis

When defects escape to production, track root cause and add prevention:
- Edge case not in requirements -> update test strategy
- Environment difference -> improve staging parity
- Race condition -> add concurrency tests
- Browser-specific -> expand browser matrix

## Reporting Cadence

| Review | Frequency | Focus |
|--------|-----------|-------|
| Daily standup | Daily | Blockers, test progress |
| Sprint retro | Per sprint | Defect trends, process improvement |
| Quality review | Monthly | Metric trends, investments |
| Strategy review | Quarterly | Goals, approach effectiveness |

## Continuous Improvement

- Track defect density by component — high-density areas need code review
- Monitor escape rate weekly — below 5% means testing is effective
- Review automation coverage bi-weekly — aim for steady increase
- Investigate spikes immediately — don't let trends establish

## Anti-Patterns

- **Vanity metrics** — "We ran 10,000 tests" means nothing without pass rate and escape rate context
- **Ignoring trends** — A single sprint spike is noise; three sprints is a pattern that needs action
- **Coverage as sole metric** — 100% coverage with weak assertions catches nothing
