# Quality Gates

Standards for release readiness and quality control.

## Gate Definitions

### Development Gate (Code Complete)

Before code is considered ready for QA:

```markdown
## Development Gate Checklist

### Code Quality
- [ ] Code compiles without errors
- [ ] Code review approved
- [ ] No critical static analysis issues
- [ ] Self-tested by developer

### Unit Testing
- [ ] Unit tests written for new code
- [ ] Unit tests passing (100%)
- [ ] Code coverage meets threshold (80%+)
- [ ] No regressions in existing tests

### Documentation
- [ ] Code comments where needed
- [ ] API documentation updated
- [ ] README updated if applicable

### Integration
- [ ] Feature branch merged to develop
- [ ] No merge conflicts
- [ ] Build pipeline passing
```

### QA Gate (Test Complete)

Before code is promoted to staging:

```markdown
## QA Gate Checklist

### Test Execution
- [ ] All planned test cases executed
- [ ] Pass rate > 95%
- [ ] All P0/P1 tests passing
- [ ] Regression suite passing

### Defect Status
- [ ] No open P0 defects
- [ ] No open P1 defects (or approved exceptions)
- [ ] P2 defects < threshold (5)
- [ ] All defects triaged

### Automation
- [ ] New features have automated tests
- [ ] Automated regression passing
- [ ] No new flaky tests introduced

### Sign-off
- [ ] QA lead approval
- [ ] Test summary report generated
```

### Staging Gate (Pre-Production)

Before code is promoted to production:

```markdown
## Staging Gate Checklist

### Functional Verification
- [ ] Smoke tests passing in staging
- [ ] Integration tests passing
- [ ] E2E critical paths verified
- [ ] Cross-browser testing complete

### Non-Functional Testing
- [ ] Performance benchmarks met
- [ ] Security scan clean
- [ ] Accessibility audit passed
- [ ] Load testing completed (if applicable)

### Operational Readiness
- [ ] Monitoring dashboards configured
- [ ] Alerting rules in place
- [ ] Runbook updated
- [ ] Rollback procedure tested

### Stakeholder Approval
- [ ] Product owner sign-off
- [ ] QA lead sign-off
- [ ] Engineering lead sign-off
- [ ] Operations sign-off (if applicable)
```

### Production Gate (Go-Live)

Final checks before release:

```markdown
## Production Gate Checklist

### Pre-Deployment
- [ ] All lower environment gates passed
- [ ] Release notes prepared
- [ ] Customer communication ready
- [ ] Support team briefed

### Deployment Verification
- [ ] Deployment successful
- [ ] Smoke tests passing in production
- [ ] No error spikes in monitoring
- [ ] Feature flags configured correctly

### Post-Deployment
- [ ] Monitor for 30 minutes
- [ ] Verify key metrics stable
- [ ] Confirm no customer complaints
- [ ] Update deployment log
```

## Threshold Definitions

### Test Pass Rate Thresholds

| Gate | Smoke | Regression | New Features |
|------|-------|------------|--------------|
| QA Complete | 100% | 95% | 90% |
| Staging | 100% | 98% | 95% |
| Production | 100% | 100% | 100% |

### Defect Thresholds

| Severity | QA Gate | Staging Gate | Production Gate |
|----------|---------|--------------|-----------------|
| P0 | 0 open | 0 open | 0 open |
| P1 | 0 open | 0 open | 0 open |
| P2 | < 10 open | < 5 open | < 3 open |
| P3 | No limit | < 20 open | < 10 open |

### Coverage Thresholds

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| Code Coverage | 70% | 80% | 90% |
| Branch Coverage | 60% | 70% | 80% |
| Requirement Coverage | 90% | 100% | 100% |

## Performance Gates

### Response Time Thresholds

| Endpoint Type | Warning | Critical | Block Release |
|---------------|---------|----------|---------------|
| API (p50) | > 100ms | > 200ms | > 500ms |
| API (p95) | > 300ms | > 500ms | > 1000ms |
| Page Load (p50) | > 1s | > 2s | > 3s |
| Page Load (p95) | > 2s | > 3s | > 5s |

### Reliability Thresholds

| Metric | Warning | Critical | Block Release |
|--------|---------|----------|---------------|
| Error Rate | > 0.1% | > 0.5% | > 1% |
| Availability | < 99.9% | < 99.5% | < 99% |
| Timeout Rate | > 0.5% | > 1% | > 2% |

### Load Test Thresholds

| Metric | Baseline | +20% Load | +50% Load |
|--------|----------|-----------|-----------|
| Response Time | < 200ms | < 300ms | < 500ms |
| Error Rate | < 0.1% | < 0.5% | < 1% |
| Throughput | 1000 rps | 1200 rps | 1500 rps |

## Security Gates

### Vulnerability Thresholds

| Severity | Development | Staging | Production |
|----------|-------------|---------|------------|
| Critical | Block merge | Block deploy | Block release |
| High | Block merge | Block deploy | Block release |
| Medium | Warning | Block deploy | Review required |
| Low | Warning | Warning | Warning |

### Security Scan Requirements

```markdown
## Security Gate Requirements

### Static Analysis (SAST)
- [ ] No critical/high vulnerabilities
- [ ] No hardcoded secrets
- [ ] No SQL injection patterns
- [ ] No XSS vulnerabilities

### Dependency Scanning
- [ ] No critical vulnerabilities in dependencies
- [ ] No known malicious packages
- [ ] Dependencies up to date (< 2 major versions behind)

### Dynamic Analysis (DAST)
- [ ] No critical findings
- [ ] No authentication bypasses
- [ ] No injection vulnerabilities
- [ ] HTTPS enforced

### Container Scanning (if applicable)
- [ ] Base image from approved list
- [ ] No critical vulnerabilities in image
- [ ] Non-root user configured
- [ ] Minimal attack surface
```

## Exception Process

### Requesting an Exception

```markdown
## Quality Gate Exception Request

**Requestor**: [Name]
**Date**: [Date]
**Gate**: [Which gate]
**Release**: [Version]

### Exception Details
**Criterion not met**: [Specific criterion]
**Current state**: [What it is]
**Required state**: [What it should be]

### Business Justification
[Why this release cannot wait for the criterion to be met]

### Risk Assessment
**Impact if released**: [What could go wrong]
**Likelihood**: [High/Medium/Low]
**Mitigation**: [How we'll handle issues]

### Remediation Plan
**Fix timeline**: [When will it be fixed]
**Owner**: [Who is responsible]
**Verification**: [How we'll verify the fix]

### Approval
| Approver | Role | Date | Decision |
|----------|------|------|----------|
| [Name] | QA Lead | | |
| [Name] | Dev Lead | | |
| [Name] | Product Owner | | |
```

### Exception Criteria

Exceptions may be considered when:

- Fix would delay critical business deadline
- Risk is low and well-understood
- Mitigation plan is in place
- Remediation is scheduled
- Stakeholders accept the risk

Exceptions are NOT appropriate when:

- Security vulnerability exists
- Data integrity at risk
- User safety concerns
- Compliance requirements
- No remediation plan

## Gate Automation

### CI/CD Gate Implementation

```yaml
# Example: GitHub Actions quality gates
name: Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  development-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
          
      - name: Run static analysis
        run: npm run lint
        
      - name: Security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  qa-gate:
    needs: development-gate
    runs-on: ubuntu-latest
    steps:
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Check test results
        run: |
          PASS_RATE=$(cat test-results.json | jq '.passRate')
          if (( $(echo "$PASS_RATE < 95" | bc -l) )); then
            echo "Pass rate $PASS_RATE% is below 95% threshold"
            exit 1
          fi

  staging-gate:
    needs: qa-gate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: ./deploy.sh staging
        
      - name: Run smoke tests
        run: npm run test:smoke -- --env=staging
        
      - name: Run performance tests
        run: npm run test:performance -- --env=staging
        
      - name: Check performance thresholds
        run: ./check-performance-thresholds.sh
```

### Quality Dashboard

```markdown
## Quality Gate Dashboard

### Current Release: v2.5.0

| Gate | Status | Details |
|------|--------|---------|
| Development | ✅ Passed | All criteria met |
| QA | ✅ Passed | 97.2% pass rate |
| Staging | 🔄 In Progress | Performance testing |
| Production | ⏳ Pending | Awaiting staging |

### Blocking Issues
None

### Warnings
- P2 defect count at threshold (5)
- One flaky test identified (being fixed)

### Next Actions
1. Complete performance testing (ETA: 2 hours)
2. Fix flaky test before staging gate
3. Schedule production deployment window
```
