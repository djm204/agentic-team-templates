# Scope Management

Guidelines for defining, decomposing, and protecting project scope.

## Core Principles

### The Triple Constraint

Scope, schedule, and budget are interconnected. Changing one affects the others. Scope management is about making those trade-offs explicit and governed.

```text
        Scope
       /     \
      /       \
Schedule ─── Budget
      \       /
       \     /
       Quality
```

### 100% Rule

The WBS must capture 100% of the work required to deliver the project, including project management activities. If it is not in the WBS, it is not in the project.

## WBS Decomposition

### Decomposition Approach

```text
Level 0: Project
Level 1: Phases or major deliverables
Level 2: Sub-deliverables
Level 3: Work packages (estimable, assignable)
```

### Work Package Criteria

Each work package should be:

| Criterion | Guideline |
|-----------|-----------|
| Duration | 8-80 hours of effort |
| Ownership | Assignable to a single person or team |
| Measurable | Clear completion criteria |
| Independent | Minimal overlap with other packages |
| Estimable | Team can provide effort and duration estimates |

### WBS Examples

**Good WBS (deliverable-oriented):**
```text
Website Redesign
├── Design
│   ├── User research report
│   ├── Wireframes
│   └── Visual design mockups
├── Development
│   ├── Frontend implementation
│   ├── CMS integration
│   └── Performance optimization
└── Launch
    ├── Content migration
    ├── QA testing
    └── DNS cutover
```

**Bad WBS (activity-oriented, missing deliverables):**
```text
Website Redesign
├── Meetings
├── Design stuff
├── Coding
└── Testing
```

## Scope Statement

### Scope Statement Template

```markdown
## Project Scope Statement: [Project Name]

### Project Objectives
[Measurable objectives derived from the charter]

### Deliverables
| Deliverable | Description | Acceptance Criteria |
|-------------|-------------|---------------------|
| [D-001] | [Description] | [How acceptance is determined] |
| [D-002] | [Description] | [How acceptance is determined] |

### In Scope
- [Specific capability or feature 1]
- [Specific capability or feature 2]

### Out of Scope
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Constraints
- [Constraint 1: budget, timeline, technology, etc.]
- [Constraint 2]
```

## Change Request Process

### When a Change Is Requested

```text
1. Log the request → Change Request form
2. Assess impact → Scope, schedule, budget, risk, quality
3. Present options → Approve, modify, defer, reject
4. Obtain decision → Change board or sponsor
5. Update baseline → If approved, revise all affected plans
6. Communicate → Notify all affected stakeholders
```

### Impact Assessment Checklist

- [ ] Scope: What deliverables are added, modified, or removed?
- [ ] Schedule: How many days/weeks are added to the timeline?
- [ ] Budget: What is the additional cost?
- [ ] Resources: Are additional people or skills required?
- [ ] Risk: What new risks does this change introduce?
- [ ] Quality: Does this affect testing or acceptance criteria?
- [ ] Dependencies: Are other teams or projects affected?

## Scope Creep Prevention

### Red Flags

| Signal | Response |
|--------|----------|
| "Can we also add..." | "Let me log that as a change request and assess the impact" |
| "It should be easy to..." | "Let me verify with the team before committing" |
| "We assumed this was included" | "Let me check the scope statement and WBS" |
| Undocumented verbal agreements | "Can we document this and run it through change control?" |
| Requirements discovered during development | "Let me assess whether this is a gap or a new requirement" |

### Prevention Strategies

```markdown
1. **Detailed scope statement** - Be explicit about what is and is not included
2. **WBS review with stakeholders** - Walk through every deliverable at kickoff
3. **Formal change control** - No scope changes without documented impact assessment
4. **Regular scope reviews** - Compare current work to baseline monthly
5. **Traceability matrix** - Link every task to a requirement to an objective
```

## Deliverable Acceptance

### Acceptance Criteria Framework

```markdown
## Deliverable: [Name]

### Description
[What this deliverable is]

### Acceptance Criteria
| Criterion | Measurement | Threshold |
|-----------|-------------|-----------|
| Functionality | [How tested] | [Pass/fail criteria] |
| Performance | [Metric] | [Acceptable range] |
| Quality | [Standard] | [Minimum standard] |

### Acceptance Process
1. PM submits deliverable with completion report
2. Stakeholder reviews against criteria (X business days)
3. Stakeholder approves, requests revisions, or rejects
4. If revisions needed, PM logs issues and re-submits
5. Final acceptance documented with sign-off
```

### Sign-Off Template

```markdown
## Deliverable Acceptance Sign-Off

**Deliverable**: [Name]
**Date Submitted**: [Date]
**Reviewed By**: [Name]

### Criteria Met
- [x] [Criterion 1]
- [x] [Criterion 2]
- [ ] [Criterion 3 - requires revision]

### Decision
- [ ] Accepted
- [ ] Accepted with conditions: [describe]
- [ ] Rejected: [reason]

### Signature
Name: ____________  Date: ____________
```

## Requirements Traceability

### Traceability Matrix

| Req ID | Requirement | WBS Element | Test Case | Status |
|--------|-------------|-------------|-----------|--------|
| REQ-001 | [Requirement] | [1.2.3] | [TC-001] | Verified |
| REQ-002 | [Requirement] | [2.1.1] | [TC-005] | In Progress |

### Traceability Rules

- Every requirement must link to at least one WBS work package
- Every WBS work package must link to at least one requirement
- Orphan work packages (no requirement) indicate scope creep
- Orphan requirements (no work package) indicate missing work

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Gold plating | Team adds unrequested features | Review deliverables against scope statement |
| Scope creep | Timeline keeps extending | Enforce formal change control process |
| Vague scope statement | Constant disagreements about what is included | Be explicit about in-scope AND out-of-scope |
| Missing WBS elements | Work discovered late in the project | Walk the WBS with the entire team at kickoff |
| No acceptance criteria | Endless revision cycles | Define measurable acceptance criteria upfront |
| Verbal scope changes | "I thought we agreed to add that" | Document everything; confirm in writing |
