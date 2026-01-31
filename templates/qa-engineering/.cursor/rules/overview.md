# QA Engineering

Principal-level guidelines for quality assurance and test engineering.

## Scope

This ruleset applies to:

- Test strategy and planning
- Test case design and execution
- Test automation architecture
- Quality metrics and reporting
- Release quality gates
- Defect management
- QA process governance

## Core Philosophy

**Quality is a team responsibility; QA enables it.** Testing doesn't create quality—it reveals the quality that development created. QA's role is to provide fast, accurate feedback that enables confident delivery.

## Fundamental Principles

### 1. Shift Left

Find defects early when they're cheapest to fix.

```text
Cost to fix defect:
Requirements  →  Design  →  Development  →  Testing  →  Production
    $1            $10         $100           $500        $10,000
```

### 2. Risk-Based Testing

Not all features are equally important. Focus testing effort on:

- High business impact (revenue, compliance, security)
- High user impact (frequently used, critical workflows)
- High technical risk (complex, new technology, integrations)

### 3. Test Pyramid

More unit tests, fewer E2E tests:

```text
       ┌─────┐
       │ E2E │  10% - Slow, expensive, high confidence
       ├─────┤
       │ Int │  30% - Medium speed, component interaction
       ├─────┤
       │Unit │  60% - Fast, cheap, immediate feedback
       └─────┘
```

### 4. Automation as Accelerator

Automate the repeatable; humans do the creative:

- Automate: Regression, smoke tests, data-driven tests
- Manual: Exploratory, usability, edge cases

### 5. Continuous Quality Feedback

Quality metrics should be:

- Visible: Everyone sees the current state
- Actionable: Drive specific improvements
- Timely: Available immediately, not end of sprint

## Project Structure

```text
tests/
├── unit/                  # Fast, isolated tests
│   ├── components/
│   ├── utils/
│   └── services/
├── integration/           # Component interaction tests
│   ├── api/
│   └── database/
├── e2e/                   # End-to-end user flows
│   ├── specs/
│   ├── pages/             # Page objects
│   └── fixtures/          # Test data
├── performance/           # Load and stress tests
├── security/              # Security scan configs
└── test-utils/            # Shared test utilities
    ├── factories/         # Test data factories
    ├── mocks/             # Mock implementations
    └── helpers/           # Common test helpers

docs/
├── test-strategy.md       # Overall test strategy
├── test-plan.md           # Current release plan
└── runbooks/              # Test execution guides
```

## Quality Standards

### Code Coverage Targets

| Type | Target | Rationale |
|------|--------|-----------|
| Unit tests | 80%+ | Core logic covered |
| Branch coverage | 70%+ | Decision paths tested |
| Critical paths | 100% | No untested critical code |

### Defect Standards

| Severity | Response Time | Resolution Target |
|----------|---------------|-------------------|
| P0 (Critical) | Immediate | Same day |
| P1 (Major) | < 4 hours | 24-48 hours |
| P2 (Moderate) | < 24 hours | Current sprint |
| P3 (Minor) | < 48 hours | Next sprint |

### Release Quality Gate

No release without:

- [ ] All P0/P1 tests passing
- [ ] No open P0/P1 defects
- [ ] Regression suite > 95% pass
- [ ] Security scan clean
- [ ] Performance thresholds met
