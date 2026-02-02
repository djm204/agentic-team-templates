# Project Management Development Guide

Principal-level guidelines for managing projects from initiation through closure, with emphasis on scope control, risk management, stakeholder alignment, and disciplined execution.

---

## Overview

This guide applies to:

- Project initiation and charter development
- Work Breakdown Structure (WBS) creation
- Schedule and timeline planning
- Risk identification and management
- Status reporting and dashboards
- Stakeholder communication and RACI matrices
- Change management and scope control
- Lessons learned and project closure

### Key Principles

1. **Plan the Work, Work the Plan** - Rigorous upfront planning prevents costly downstream changes
2. **Scope Discipline** - Every addition has a cost; guard the baseline relentlessly
3. **Risk Forward** - Identify and mitigate risks before they become issues
4. **Transparent Reporting** - Bad news early is better than bad news late
5. **Stakeholder Alignment** - Misaligned expectations are the root of most project failures

### Core Frameworks

| Framework | Purpose |
|-----------|---------|
| WBS | Decompose deliverables into manageable work packages |
| Critical Path Method | Identify the longest sequence of dependent tasks |
| RAID Log | Track Risks, Assumptions, Issues, Dependencies |
| RACI Matrix | Clarify roles and responsibilities |
| Earned Value Management | Measure project performance objectively |
| Change Control | Govern scope modifications formally |

---

## Project Initiation

### Project Charter Template

```markdown
# Project Charter: [Project Name]

## Project Overview
- **Sponsor**: [Name, Title]
- **Project Manager**: [Name]
- **Date**: [Date]
- **Version**: [1.0]

## Business Case
[2-3 sentences: Why is this project being undertaken? What business problem does it solve?]

## Objectives
1. [Specific, measurable objective 1]
2. [Specific, measurable objective 2]
3. [Specific, measurable objective 3]

## Scope Summary
### In Scope
- [Deliverable 1]
- [Deliverable 2]

### Out of Scope
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

## Key Stakeholders
| Name | Role | Interest Level | Influence Level |
|------|------|----------------|-----------------|
| [Name] | Sponsor | High | High |
| [Name] | End User | High | Medium |

## High-Level Timeline
| Milestone | Target Date |
|-----------|-------------|
| Project Kickoff | [Date] |
| Phase 1 Complete | [Date] |
| Final Delivery | [Date] |

## Budget
- Estimated budget: [$X]
- Funding source: [Source]
- Contingency: [X%]

## Success Criteria
1. [Criterion 1 - measurable]
2. [Criterion 2 - measurable]

## Assumptions
1. [Assumption 1]
2. [Assumption 2]

## Constraints
1. [Constraint 1]
2. [Constraint 2]

## Approval
| Name | Role | Signature | Date |
|------|------|-----------|------|
| [Name] | Sponsor | | |
| [Name] | PM | | |
```

---

## Work Breakdown Structure (WBS)

### WBS Decomposition Approach

```
Project Name (Level 0)
├── Phase 1: Initiation (Level 1)
│   ├── 1.1 Project Charter (Level 2)
│   │   ├── 1.1.1 Draft charter (Level 3 - Work Package)
│   │   ├── 1.1.2 Review with sponsor
│   │   └── 1.1.3 Obtain approval
│   └── 1.2 Stakeholder Analysis
│       ├── 1.2.1 Identify stakeholders
│       └── 1.2.2 Create communication plan
├── Phase 2: Planning (Level 1)
│   ├── 2.1 Requirements Gathering
│   ├── 2.2 Schedule Development
│   └── 2.3 Risk Planning
├── Phase 3: Execution (Level 1)
│   ├── 3.1 Deliverable 1
│   ├── 3.2 Deliverable 2
│   └── 3.3 Deliverable 3
├── Phase 4: Monitoring & Control (Level 1)
│   ├── 4.1 Status Reporting
│   └── 4.2 Change Management
└── Phase 5: Closure (Level 1)
    ├── 5.1 Final Acceptance
    └── 5.2 Lessons Learned
```

### WBS Best Practices

- **100% Rule**: WBS must capture 100% of project scope, including project management
- **Decompose to work packages**: Lowest level should be estimable (8-80 hour rule)
- **Deliverable-oriented**: Organize by deliverables, not activities
- **Mutually exclusive**: No overlap between branches
- **WBS Dictionary**: Each work package gets a description, owner, estimate, and acceptance criteria

### WBS Dictionary Entry

```markdown
## WBS Element: [1.2.3 Element Name]

- **Description**: [What this work package produces]
- **Owner**: [Responsible person]
- **Effort Estimate**: [Hours/days]
- **Duration**: [Calendar time]
- **Dependencies**: [Predecessor WBS elements]
- **Acceptance Criteria**: [How we know it is complete]
- **Risks**: [Associated risks]
```

---

## Schedule Planning

### Task Dependencies

| Type | Code | Example |
|------|------|---------|
| Finish-to-Start | FS | Design must finish before development starts |
| Start-to-Start | SS | Testing starts when development starts |
| Finish-to-Finish | FF | Documentation finishes when development finishes |
| Start-to-Finish | SF | New system starts before old system finishes (rare) |

### Critical Path Method

```
Task A (5d) ──→ Task C (3d) ──→ Task E (4d) ──→ Task G (2d)
                                                        │
Task B (3d) ──→ Task D (6d) ──→ Task F (2d) ──────────┘

Critical Path: B → D → F → G = 13 days (longest path)
Non-Critical: A → C → E → G = 14 days (actually this is critical)

Float for Task B path: 14 - 13 = 1 day
```

### Milestone Planning Template

| Milestone | Target Date | Dependencies | Owner | Status |
|-----------|-------------|--------------|-------|--------|
| Requirements Approved | [Date] | Stakeholder sign-off | PM | Not Started |
| Design Complete | [Date] | Requirements Approved | Lead Designer | Not Started |
| Development Complete | [Date] | Design Complete | Tech Lead | Not Started |
| UAT Complete | [Date] | Development Complete | QA Lead | Not Started |
| Go-Live | [Date] | UAT Complete | PM | Not Started |

### Buffer Management

- **Project buffer**: 10-20% of total duration at the end of the project
- **Feeding buffers**: 50% of non-critical path duration where it joins critical path
- **Resource buffers**: Alert resource managers before critical-path tasks start

### Resource Leveling Checklist

1. Identify resource over-allocations
2. Delay non-critical tasks within float
3. Split tasks where possible
4. Adjust task assignments
5. Negotiate additional resources if critical path is affected

---

## Risk Management

### Risk Register Template

| ID | Risk Description | Category | Probability | Impact | Score | Response Strategy | Owner | Status |
|----|-----------------|----------|-------------|--------|-------|-------------------|-------|--------|
| R-001 | Key developer leaves mid-project | Resource | High (4) | High (4) | 16 | Mitigate: Cross-train team | PM | Open |
| R-002 | Vendor delivers late | External | Medium (3) | High (4) | 12 | Transfer: Contractual penalties | PM | Open |
| R-003 | Requirements change after approval | Scope | High (4) | Medium (3) | 12 | Avoid: Formal change control | PM | Open |

### Probability-Impact Matrix

```
              Impact
              Low(1)  Med(2)  High(3)  Critical(4)
Probability
High(4)     │  4    │   8    │  12    │   16     │
Med(3)      │  3    │   6    │   9    │   12     │
Low(2)      │  2    │   4    │   6    │    8     │
Rare(1)     │  1    │   2    │   3    │    4     │
```

### Risk Response Strategies

| Strategy | When to Use | Example |
|----------|-------------|---------|
| **Avoid** | Eliminate the threat entirely | Change project approach to remove risk |
| **Transfer** | Shift impact to third party | Insurance, contractual penalties, outsourcing |
| **Mitigate** | Reduce probability or impact | Cross-training, prototyping, parallel paths |
| **Accept** | Risk is low or unavoidable | Document and set aside contingency budget |
| **Escalate** | Beyond PM authority | Notify sponsor, request organizational action |

### RAID Log

```markdown
## RAID Log: [Project Name]

### Risks
| ID | Description | Owner | Status | Action |
|----|-------------|-------|--------|--------|

### Assumptions
| ID | Assumption | Validated? | Impact if Wrong |
|----|------------|-----------|-----------------|
| A-001 | Budget approved by Q1 | No | Project delayed 6 weeks |

### Issues
| ID | Description | Priority | Owner | Resolution | Target Date |
|----|-------------|----------|-------|------------|-------------|
| I-001 | Server environment not available | P1 | IT Lead | Requested provisioning | [Date] |

### Dependencies
| ID | Description | Owner | Status | Date Needed |
|----|-------------|-------|--------|-------------|
| D-001 | API from Partner Team | Partner PM | In Progress | [Date] |
```

---

## Status Reporting

### Weekly Status Report (RAG)

```markdown
## Project Status Report: [Project Name]
**Date**: [Date] | **PM**: [Name] | **Overall Status**: GREEN/AMBER/RED

### Executive Summary
[2-3 sentences: Current state, key accomplishments, critical items]

### RAG Status
| Area | Status | Commentary |
|------|--------|------------|
| Scope | GREEN | On track, no change requests |
| Schedule | AMBER | Task X delayed 3 days, mitigation in place |
| Budget | GREEN | 45% consumed, on plan |
| Quality | GREEN | No critical defects |
| Resources | AMBER | Need additional QA resource in Sprint 4 |

### Accomplishments This Period
1. [Accomplishment 1]
2. [Accomplishment 2]

### Planned Next Period
1. [Activity 1]
2. [Activity 2]

### Risks & Issues
| Type | Description | Impact | Action | Owner |
|------|-------------|--------|--------|-------|
| Risk | [Description] | [Impact] | [Action] | [Name] |
| Issue | [Description] | [Impact] | [Action] | [Name] |

### Milestones
| Milestone | Planned | Forecast | Status |
|-----------|---------|----------|--------|
| [Milestone 1] | [Date] | [Date] | Complete |
| [Milestone 2] | [Date] | [Date] | On Track |
| [Milestone 3] | [Date] | [Date] | At Risk |

### Decisions Needed
1. [Decision needed from sponsor/steering committee]

### Budget Summary
| Category | Budget | Actual | Forecast | Variance |
|----------|--------|--------|----------|----------|
| Labor | $X | $Y | $Z | +/-$W |
| Vendor | $X | $Y | $Z | +/-$W |
| Total | $X | $Y | $Z | +/-$W |
```

### RAG Status Definitions

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| GREEN | On track, no significant issues | Continue monitoring |
| AMBER | At risk, issues identified but manageable | PM action, stakeholder awareness |
| RED | Off track, requires escalation | Sponsor/steering committee intervention |

### Earned Value Management Basics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Planned Value (PV) | Budgeted cost of work scheduled | What should be done by now |
| Earned Value (EV) | Budgeted cost of work performed | What has been done |
| Actual Cost (AC) | Actual cost of work performed | What it cost |
| Schedule Variance (SV) | EV - PV | Negative = behind schedule |
| Cost Variance (CV) | EV - AC | Negative = over budget |
| Schedule Performance Index (SPI) | EV / PV | < 1.0 = behind schedule |
| Cost Performance Index (CPI) | EV / AC | < 1.0 = over budget |
| Estimate at Completion (EAC) | BAC / CPI | Projected total cost |

---

## Stakeholder Management

### RACI Matrix Template

| Activity | Sponsor | PM | Tech Lead | Designer | QA | Business Owner |
|----------|---------|-----|-----------|----------|-----|----------------|
| Project Charter | A | R | C | - | - | I |
| Requirements | I | A | C | C | C | R |
| Design | I | A | C | R | I | C |
| Development | I | A | R | C | I | - |
| Testing | I | A | C | - | R | C |
| Deployment | A | R | R | - | C | I |
| Sign-off | R | A | I | I | I | R |

**R** = Responsible (does the work) | **A** = Accountable (final authority) | **C** = Consulted (provides input) | **I** = Informed (kept updated)

### Communication Plan

| Stakeholder | Information Need | Format | Frequency | Sender |
|-------------|-----------------|--------|-----------|--------|
| Sponsor | Overall status, decisions | 1:1 meeting | Weekly | PM |
| Steering Committee | Strategic status | Presentation | Monthly | PM |
| Project Team | Tasks, blockers | Standup | Daily | Scrum Master |
| End Users | Progress, training | Newsletter | Bi-weekly | PM |
| Vendors | Requirements, timelines | Email/Call | As needed | PM |

### Expectation Management

```markdown
## Setting Expectations Checklist

1. **Define success criteria upfront** - Written, measurable, agreed upon
2. **Communicate constraints honestly** - Budget, timeline, resources
3. **Share risks proactively** - Don't wait for risks to become issues
4. **Provide regular updates** - No surprises; consistent cadence
5. **Document all agreements** - Email confirmation of verbal decisions
6. **Manage scope formally** - All changes go through change control
```

---

## Change Management

### Change Request Template

```markdown
## Change Request: [CR-XXX]

**Requested By**: [Name]
**Date**: [Date]
**Priority**: Critical / High / Medium / Low

### Description
[What is being requested]

### Justification
[Why this change is needed]

### Impact Assessment
| Area | Impact |
|------|--------|
| Scope | [Description of scope change] |
| Schedule | [+/- X days/weeks] |
| Budget | [+/- $X] |
| Quality | [Impact on quality/testing] |
| Resources | [Additional resources needed] |
| Risk | [New risks introduced] |

### Options
1. **Approve as-is**: [Consequences]
2. **Approve with modifications**: [Description]
3. **Defer**: [When to revisit]
4. **Reject**: [Rationale]

### Recommendation
[PM recommendation with justification]

### Approval
| Name | Role | Decision | Date |
|------|------|----------|------|
| [Name] | Sponsor | | |
| [Name] | Change Board | | |
```

### Change Control Process

```
Change Requested
    ↓
PM Logs and Assesses Impact
    ↓
Impact Analysis Complete
    ↓
Change Board Reviews (if significant)
    ↓
Decision: Approve / Defer / Reject
    ↓
If Approved → Update Baseline → Communicate → Execute
If Rejected → Document Rationale → Notify Requestor
```

---

## Lessons Learned

### Lessons Learned Template

```markdown
## Lessons Learned: [Project Name]
**Date**: [Date]
**Facilitator**: [Name]
**Participants**: [Names]

### What Went Well
| Area | Description | Recommendation |
|------|-------------|----------------|
| Planning | WBS decomposition was thorough | Continue using WBS dictionary for all projects |
| Communication | Weekly standups kept team aligned | Standardize standup format |

### What Could Improve
| Area | Description | Root Cause | Recommendation |
|------|-------------|------------|----------------|
| Estimation | Development took 30% longer | Insufficient spike time | Add prototyping phase for unknowns |
| Scope | 4 change requests in Phase 2 | Incomplete requirements | Invest more in discovery phase |

### Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Update estimation template | PM | [Date] | Open |
| Create requirements checklist | BA | [Date] | Open |
```

### Project Closure Checklist

- [ ] All deliverables accepted by stakeholder
- [ ] Final status report submitted
- [ ] Budget reconciliation completed
- [ ] Lessons learned session conducted
- [ ] Project documentation archived
- [ ] Team members released and thanked
- [ ] Vendor contracts closed
- [ ] Outstanding risks transferred or closed
- [ ] Post-implementation review scheduled

---

## Common Pitfalls

### 1. Planning Without Decomposition

Wrong: Jump straight to a Gantt chart with high-level tasks.

Right: Build a WBS first, decompose to work packages, then schedule from the bottom up.

### 2. Ignoring the Critical Path

Wrong: Treat all tasks equally; scramble when the project is late.

Right: Identify the critical path early. Protect it. Add buffers to feeding paths.

### 3. Optimistic Estimation

Wrong: "How long will it take?" "Two weeks." (Always two weeks.)

Right: Use three-point estimation: (Optimistic + 4 x Most Likely + Pessimistic) / 6

### 4. Change Requests Without Impact Analysis

Wrong: Stakeholder asks for a change, PM says "sure" without assessing impact.

Right: Every change goes through formal assessment of scope, schedule, budget, and risk impact.

### 5. Status Reports That Hide Problems

Wrong: Report GREEN until the project is suddenly RED.

Right: Use AMBER early and often. Escalate risks before they become issues.

### 6. RACI Without Accountability

Wrong: Create a RACI matrix, put it in a drawer, never reference it.

Right: Review RACI at kickoff, reference it when conflicts arise, update it when roles change.

---

## Resources

- [PMBOK Guide - PMI](https://www.pmi.org/pmbok-guide-standards)
- [Critical Chain - Eliyahu Goldratt](https://www.toc-goldratt.com/)
- [The Deadline - Tom DeMarco](https://www.goodreads.com/book/show/123716.The_Deadline)
- [Making Things Happen - Scott Berkun](https://scottberkun.com/making-things-happen/)
- [Agile Estimating and Planning - Mike Cohn](https://www.mountaingoatsoftware.com/books/agile-estimating-and-planning)
