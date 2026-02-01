# Risk Management

Guidelines for identifying, assessing, and responding to project risks.

## Core Principles

### Risk vs. Issue

| Concept | Definition | Action |
|---------|------------|--------|
| **Risk** | Uncertain event that may occur in the future | Plan a response before it happens |
| **Issue** | Problem that has already occurred | Resolve it now |

A risk becomes an issue when it materializes. Good risk management prevents most issues.

### Proactive Over Reactive

```markdown
Wrong: Wait for problems to appear, then firefight
Right: Identify potential problems early, plan responses, monitor triggers
```

## Risk Identification

### Identification Techniques

| Technique | Description | When to Use |
|-----------|-------------|-------------|
| Brainstorming | Team generates risks freely | Project kickoff |
| Checklist review | Review common risk categories | Every phase gate |
| Expert interviews | Consult experienced stakeholders | Complex or novel projects |
| Assumption analysis | Test each assumption for risk | Planning phase |
| SWOT analysis | Strengths, weaknesses, opportunities, threats | Strategic projects |
| Lessons learned review | Check past project risks | Similar projects |

### Risk Categories

```text
Project Risks
├── Technical
│   ├── Technology maturity
│   ├── Integration complexity
│   └── Performance requirements
├── External
│   ├── Vendor reliability
│   ├── Regulatory changes
│   └── Market conditions
├── Organizational
│   ├── Resource availability
│   ├── Stakeholder alignment
│   └── Funding stability
├── Project Management
│   ├── Estimation accuracy
│   ├── Scope definition
│   └── Communication gaps
└── Quality
    ├── Requirements completeness
    ├── Testing coverage
    └── Acceptance criteria clarity
```

### Risk Statement Format

```markdown
Good: "Due to [cause], [risk event] may occur, resulting in [impact]."

Example: "Due to the vendor's limited track record with our platform,
the integration may require additional custom development,
resulting in a 3-week schedule delay and $15K additional cost."

Bad: "Vendor might be late." (No cause, no specific impact)
```

## Risk Assessment

### Qualitative Analysis

**Probability Scale:**
| Rating | Label | Description |
|--------|-------|-------------|
| 5 | Almost Certain | > 80% likelihood |
| 4 | Likely | 60-80% |
| 3 | Possible | 40-60% |
| 2 | Unlikely | 20-40% |
| 1 | Rare | < 20% |

**Impact Scale:**
| Rating | Label | Schedule | Budget | Quality |
|--------|-------|----------|--------|---------|
| 5 | Critical | > 4 weeks delay | > 20% overrun | Unacceptable to sponsor |
| 4 | Major | 2-4 weeks delay | 10-20% overrun | Major rework required |
| 3 | Moderate | 1-2 weeks delay | 5-10% overrun | Significant rework |
| 2 | Minor | < 1 week delay | < 5% overrun | Minor rework |
| 1 | Negligible | < 1 day delay | < 1% overrun | Cosmetic only |

**Risk Score = Probability x Impact**

### Risk Priority Matrix

```text
              Impact
              1    2    3    4    5
Probability
    5       │  5 │ 10 │ 15 │ 20 │ 25 │  ← Immediate action
    4       │  4 │  8 │ 12 │ 16 │ 20 │  ← Active management
    3       │  3 │  6 │  9 │ 12 │ 15 │  ← Monitor closely
    2       │  2 │  4 │  6 │  8 │ 10 │  ← Watch list
    1       │  1 │  2 │  3 │  4 │  5 │  ← Accept and monitor
```

| Score Range | Priority | Review Frequency |
|-------------|----------|------------------|
| 15-25 | Critical | Daily |
| 10-14 | High | Twice weekly |
| 5-9 | Medium | Weekly |
| 1-4 | Low | Bi-weekly |

### Quantitative Analysis (When Warranted)

For high-value projects, use:

- **Expected Monetary Value (EMV)**: Probability x Dollar Impact
- **Three-Point Estimate**: (Optimistic + 4 x Most Likely + Pessimistic) / 6
- **Monte Carlo Simulation**: Model schedule and cost uncertainty

## Risk Response Strategies

### For Threats (Negative Risks)

| Strategy | Description | Example |
|----------|-------------|---------|
| **Avoid** | Change plan to eliminate risk | Use proven technology instead of experimental |
| **Transfer** | Shift impact to third party | Fixed-price contract with vendor, insurance |
| **Mitigate** | Reduce probability or impact | Cross-train team members, add prototyping phase |
| **Accept (Active)** | Set aside contingency | Reserve budget and schedule buffer |
| **Accept (Passive)** | Acknowledge and do nothing | Document for awareness only |
| **Escalate** | Beyond PM's authority | Raise to sponsor or steering committee |

### For Opportunities (Positive Risks)

| Strategy | Description | Example |
|----------|-------------|---------|
| **Exploit** | Ensure opportunity is realized | Assign best resources to critical tasks |
| **Enhance** | Increase probability or impact | Invest in training to accelerate delivery |
| **Share** | Partner with others to capture benefit | Joint venture for new market |
| **Accept** | Take advantage if it occurs | No special action needed |

### Response Planning Template

```markdown
## Risk Response: [R-XXX]

**Risk**: [Description]
**Strategy**: [Avoid/Transfer/Mitigate/Accept/Escalate]

**Response Actions**:
1. [Action 1] - Owner: [Name] - Due: [Date]
2. [Action 2] - Owner: [Name] - Due: [Date]

**Trigger**: [What indicates this risk is materializing]

**Contingency Plan**: [What to do if risk occurs despite response]

**Residual Risk**: [Risk remaining after response is implemented]
```

## Risk Register

### Register Template

| ID | Risk | Category | Prob | Impact | Score | Strategy | Response | Owner | Trigger | Status |
|----|------|----------|------|--------|-------|----------|----------|-------|---------|--------|
| R-001 | [Description] | Technical | 4 | 3 | 12 | Mitigate | [Action] | [Name] | [Trigger] | Open |

### Risk Review Cadence

```text
Weekly Risk Review (15 min in team standup):
├── Review open risks and status
├── Check for new risks
├── Assess if any triggers have fired
└── Update scores based on new information

Monthly Risk Deep-Dive (30 min):
├── Re-assess all risk scores
├── Review effectiveness of responses
├── Identify emerging risk patterns
└── Update risk register and report to sponsor
```

## Issue Escalation

### Escalation Framework

```text
Level 1: Team Level
├── PM and team attempt resolution
├── Timeframe: 1-2 business days
└── Example: Task dependency conflict

Level 2: Functional Management
├── Escalate to department heads
├── Timeframe: 3-5 business days
└── Example: Resource conflict between projects

Level 3: Sponsor/Steering Committee
├── Escalate to project sponsor
├── Timeframe: Requires decision within 1 week
└── Example: Budget increase needed, major scope change

Level 4: Executive Leadership
├── Escalate to C-suite
├── Timeframe: Urgent, same-day response needed
└── Example: Project cancellation risk, regulatory issue
```

### Escalation Template

```markdown
## Issue Escalation: [I-XXX]

**Escalated By**: [Name] | **Date**: [Date] | **Urgency**: High/Critical

### Issue
[Description of the problem]

### Impact
- Schedule: [X days/weeks delay if unresolved]
- Budget: [$X additional cost]
- Quality: [Impact on deliverables]

### Actions Taken
1. [What has been tried]
2. [Why it did not resolve the issue]

### Options
| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| A | [Pros] | [Cons] | |
| B | [Pros] | [Cons] | Recommended |

### Decision Needed By
[Date] - [Consequence of delayed decision]
```

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Risks identified but never reviewed | Stale risk register | Schedule weekly risk reviews |
| All risks scored as "medium" | No differentiation | Calibrate scoring with team; use concrete criteria |
| No risk owners | Nobody acts on risks | Assign every risk an individual owner |
| Risks without response plans | Risks sit as "open" indefinitely | Require response plan within 1 week of identification |
| Ignoring positive risks | Missed opportunities | Include opportunity assessment in risk reviews |
| Confusing risks and issues | Reactive management | Clarify definitions at kickoff; maintain separate logs |
