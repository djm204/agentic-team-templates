# QA Metrics

Guidelines for measuring and improving quality.

## Key QA Metrics

### Defect Metrics

| Metric | Formula | Target | Purpose |
|--------|---------|--------|---------|
| Defect Density | Defects / KLOC | < 1.0 | Code quality indicator |
| Defect Escape Rate | Prod Defects / Total Defects × 100 | < 5% | Testing effectiveness |
| Defect Removal Efficiency | (Pre-release Defects / Total Defects) × 100 | > 95% | QA effectiveness |
| Defect Leakage | Defects found post-release | < 5/release | Release quality |
| MTTR | Time to fix defects | < 24h (P1) | Response efficiency |
| Defect Aging | Days defect remains open | < 5 days avg | Process efficiency |

### Coverage Metrics

| Metric | Formula | Target | Purpose |
|--------|---------|--------|---------|
| Code Coverage | Lines covered / Total lines × 100 | > 80% | Test thoroughness |
| Branch Coverage | Branches covered / Total branches × 100 | > 70% | Decision path testing |
| Requirement Coverage | Requirements with tests / Total requirements × 100 | 100% | Traceability |
| Risk Coverage | High-risk areas tested / Total high-risk areas × 100 | 100% | Risk mitigation |

### Execution Metrics

| Metric | Formula | Target | Purpose |
|--------|---------|--------|---------|
| Test Pass Rate | Passed / Executed × 100 | > 95% | Test health |
| Test Execution Rate | Executed / Planned × 100 | 100% | Execution completeness |
| Automation Rate | Automated / Total tests × 100 | > 70% | Automation maturity |
| Flaky Test Rate | Flaky tests / Total automated × 100 | < 2% | Automation reliability |

## Defect Analysis

### Defect Density Calculation

```markdown
## Defect Density Report

### By Component
| Component | KLOC | Defects | Density |
|-----------|------|---------|---------|
| Auth Service | 5.2 | 3 | 0.58 |
| Payment Module | 8.1 | 12 | 1.48 |
| User API | 3.4 | 1 | 0.29 |
| Dashboard UI | 6.8 | 4 | 0.59 |

### Trend
| Sprint | KLOC (New) | Defects | Density |
|--------|------------|---------|---------|
| S1 | 4.5 | 2 | 0.44 |
| S2 | 5.1 | 3 | 0.59 |
| S3 | 6.2 | 8 | 1.29 |
| S4 | 3.8 | 2 | 0.53 |

### Action Items
- Payment Module density too high - schedule code review
- S3 spike investigation - new developer onboarding
```

### Defect Escape Rate

```markdown
## Escape Rate Analysis

### Current Period
| Stage | Defects Found | % of Total |
|-------|---------------|------------|
| Development | 45 | 45% |
| QA Testing | 40 | 40% |
| Staging | 10 | 10% |
| Production | 5 | 5% |
| **Total** | **100** | **100%** |

### Escape Rate = 5 / 100 × 100 = 5%

### Root Cause of Escapes
| Defect | Root Cause | Prevention |
|--------|------------|------------|
| DEF-101 | Edge case not in requirements | Add to test strategy |
| DEF-102 | Environment difference | Improve staging parity |
| DEF-103 | Race condition | Add concurrency tests |
| DEF-104 | Browser-specific issue | Expand browser matrix |
| DEF-105 | Data-dependent bug | Improve test data variety |
```

### Defect Removal Efficiency

```markdown
## DRE Calculation

DRE = (Defects found before release / Total defects) × 100

### Example
- Found in Dev: 50
- Found in QA: 40
- Found in Staging: 8
- Found in Production: 2
- **Total: 100**

DRE = (50 + 40 + 8) / 100 × 100 = **98%**

### DRE by Phase
| Phase | Found | Cumulative | DRE at Phase |
|-------|-------|------------|--------------|
| Development | 50 | 50 | 50% |
| QA | 40 | 90 | 90% |
| Staging | 8 | 98 | 98% |
| Production | 2 | 100 | - |
```

## Test Execution Dashboard

### Daily Report

```markdown
## Test Execution: [Date]

### Summary
| Metric | Today | Trend |
|--------|-------|-------|
| Tests Executed | 450 | +12 |
| Pass Rate | 96.2% | +0.5% |
| New Failures | 3 | -2 |
| Blockers | 1 | Same |

### By Test Type
| Type | Total | Passed | Failed | Blocked | Pass Rate |
|------|-------|--------|--------|---------|-----------|
| Smoke | 25 | 25 | 0 | 0 | 100% |
| Regression | 300 | 290 | 8 | 2 | 96.7% |
| New Features | 125 | 118 | 7 | 0 | 94.4% |

### Failed Tests
| Test | Error | Priority | Assigned |
|------|-------|----------|----------|
| checkout_payment | Timeout | P1 | @dev1 |
| user_profile_update | 500 error | P2 | @dev2 |
| search_filters | Wrong results | P2 | @dev3 |

### Blocked Tests
| Test | Blocker | ETA |
|------|---------|-----|
| admin_dashboard | DEF-456 | Tomorrow |
| export_reports | Env issue | Today PM |
```

### Sprint Report

```markdown
## Sprint Quality Report: Sprint [N]

### Goals vs. Actuals
| Goal | Target | Actual | Status |
|------|--------|--------|--------|
| Test Coverage | 80% | 82% | ✅ |
| Pass Rate | 95% | 97% | ✅ |
| P1 Defects Resolved | 100% | 100% | ✅ |
| Automation Added | 20 tests | 18 tests | ⚠️ |

### Defect Summary
| Severity | Opened | Closed | Open |
|----------|--------|--------|------|
| P0 | 0 | 0 | 0 |
| P1 | 3 | 3 | 0 |
| P2 | 8 | 6 | 2 |
| P3 | 12 | 8 | 4 |

### Quality Trends
```text
Pass Rate (last 5 sprints)
S1: ████████████████████░░░░ 85%
S2: ██████████████████████░░ 92%
S3: ███████████████████████░ 95%
S4: ████████████████████████ 98%
S5: ███████████████████████░ 97%
```

### Risks for Next Sprint
1. Large refactor planned - increase regression scope
2. New third-party integration - add integration tests
3. Performance concerns flagged - schedule load testing
```

## Quality Gates

### Release Quality Gate

```markdown
## Release Quality Gate: v[X.Y.Z]

### Mandatory Criteria
| Criterion | Threshold | Actual | Status |
|-----------|-----------|--------|--------|
| P0 Tests Pass | 100% | 100% | ✅ |
| P1 Tests Pass | 100% | 100% | ✅ |
| Open P0 Defects | 0 | 0 | ✅ |
| Open P1 Defects | 0 | 0 | ✅ |
| Regression Pass Rate | > 95% | 97.2% | ✅ |
| Code Coverage | > 80% | 84% | ✅ |
| Security Scan | 0 critical/high | 0 | ✅ |

### Performance Criteria
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| Response Time (p95) | < 500ms | 423ms | ✅ |
| Error Rate | < 0.1% | 0.02% | ✅ |
| Throughput | > 1000 rps | 1250 rps | ✅ |

### Exceptions
| Item | Justification | Approved By |
|------|---------------|-------------|
| P2 Defect DEF-789 | Low impact, fix in next sprint | Product Owner |

### Sign-off
| Role | Name | Date | Approved |
|------|------|------|----------|
| QA Lead | | | ☐ |
| Dev Lead | | | ☐ |
| Product Owner | | | ☐ |
```

## Continuous Improvement

### Metric Review Cadence

| Review | Frequency | Participants | Focus |
|--------|-----------|--------------|-------|
| Daily Standup | Daily | QA Team | Blockers, progress |
| Sprint Retrospective | Bi-weekly | Team | Process improvement |
| Quality Review | Monthly | Leadership | Trends, investments |
| Quarterly Planning | Quarterly | All | Strategy, goals |

### Improvement Actions

```markdown
## Quality Improvement Plan

### Current State
- Defect escape rate: 8%
- Automation coverage: 55%
- Average defect age: 8 days

### Target State (Q2)
- Defect escape rate: < 5%
- Automation coverage: > 70%
- Average defect age: < 5 days

### Actions
| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| Add API test coverage for payments | @qa1 | Feb 15 | In Progress |
| Implement visual regression testing | @qa2 | Feb 28 | Not Started |
| Reduce flaky tests to < 2% | @qa1 | Feb 10 | In Progress |
| Add security scanning to CI | @devops | Feb 20 | Complete |

### Success Metrics
- Track escape rate weekly
- Review automation coverage bi-weekly
- Monitor defect aging daily
```

### Trend Analysis

Track metrics over time to identify patterns:

```markdown
## 6-Month Trend Analysis

### Defect Escape Rate
| Month | Rate | Trend |
|-------|------|-------|
| Aug | 12% | - |
| Sep | 9% | ↓ |
| Oct | 7% | ↓ |
| Nov | 8% | ↑ |
| Dec | 5% | ↓ |
| Jan | 4% | ↓ |

### Insights
- Significant improvement after automation investment (Oct)
- November spike due to holiday staffing
- On track to meet < 5% target

### Recommendations
1. Maintain automation investment
2. Cross-train team for coverage
3. Document high-risk areas for new team members
```
