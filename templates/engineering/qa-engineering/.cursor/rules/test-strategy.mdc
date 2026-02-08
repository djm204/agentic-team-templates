---
description: Test Strategy
alwaysApply: false
---

# Test Strategy

Guidelines for creating and maintaining effective test strategies.

## Strategy Components

### Scope Definition
- Define what is and isn't being tested, with coverage level per feature
- Document assumptions and constraints explicitly

### Risk Assessment
Prioritize testing effort by risk:

| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Business Impact | Revenue, compliance | User experience | Cosmetic |
| User Impact | Many users, critical flow | Some users | Few users, edge case |
| Technical Risk | New tech, complex logic | Moderate complexity | Well-understood |

### Test Levels

| Level | Automation | Responsibility | When |
|-------|------------|----------------|------|
| Unit | 100% | Developers | Every commit |
| Integration | 90%+ | Dev + QA | Every PR |
| E2E | 70%+ | QA | Daily + release |
| Performance | 100% | QA + DevOps | Weekly + release |
| Exploratory | 0% | QA | Per feature |

### Environment Strategy
- **Local**: Mocked data, on-demand refresh
- **Dev**: Synthetic data, daily refresh
- **Staging**: Sanitized prod data, weekly refresh — must match prod topology
- **Production**: Smoke tests only, restricted access

## Entry Criteria (Ready for Testing)
- Code complete, unit tests passing (80%+), code review approved
- Build deployed to test environment, test data available

## Exit Criteria (Ready for Release)
- All P0/P1 tests passed, no open P0/P1 defects
- Regression suite > 95% pass rate
- Security scan clean, performance thresholds met
- QA lead, dev lead, and product owner sign-off

## Test Types

- **Smoke**: < 5 min, critical paths only, run on every deployment
- **Regression**: Comprehensive, automated, prioritized by risk, reviewed quarterly
- **Integration**: API contracts, DB interactions, service communication
- **E2E**: Realistic user workflows, limited to critical paths
- **Performance**: Load (every release), stress (quarterly), spike (before events), soak (monthly)
- **Security**: SAST, DAST, dependency scanning, pen testing

## Strategy Maintenance

Trigger review when: major product changes, new technology adoption, significant defect trends, team structure changes, or repeated customer complaints.
