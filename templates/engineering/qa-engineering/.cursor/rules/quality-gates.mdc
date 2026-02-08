---
description: Quality Gates
alwaysApply: false
---

# Quality Gates

Standards for release readiness at each stage.

## Gate Stages

### Development Gate (Code Complete)
- Code compiles, code review approved, no critical static analysis issues
- Unit tests passing (100%), coverage meets 80%+ threshold
- Feature branch merged, build pipeline green

### QA Gate (Test Complete)
- All planned tests executed, pass rate > 95%, all P0/P1 tests passing
- No open P0/P1 defects, P2 defects < threshold
- New features have automated tests, no new flaky tests

### Staging Gate (Pre-Production)
- Smoke, integration, and E2E critical paths passing
- Performance benchmarks met, security scan clean, accessibility audit passed
- Monitoring dashboards configured, rollback procedure tested
- QA lead, dev lead, product owner, and ops sign-off

### Production Gate (Go-Live)
- All lower gates passed, release notes prepared, support team briefed
- Deployment successful, smoke tests passing, no error spikes
- Monitor 30 min post-deploy, verify key metrics stable

## Thresholds

| Metric | QA Gate | Staging | Production |
|--------|---------|---------|------------|
| Smoke pass rate | 100% | 100% | 100% |
| Regression pass rate | 95% | 98% | 100% |
| P0/P1 open defects | 0 | 0 | 0 |
| Response time (p95) | — | < 500ms | < 500ms |
| Error rate | — | < 0.5% | < 0.1% |
| Security critical/high | 0 | 0 | 0 |

## Exception Process

Exceptions may be considered when risk is low, mitigation is in place, and a remediation plan with owner and timeline exists. **Never** grant exceptions for security vulnerabilities, data integrity risks, or compliance requirements.

Required approvals: QA lead, dev lead, product owner.

## Anti-Patterns

- **Skipping gates under deadline pressure** — Gates exist to prevent costly production incidents
- **Manual-only gates** — Automate gate checks in CI/CD to prevent human error
- **No exception tracking** — Every exception should be logged with remediation deadline
