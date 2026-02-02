# Project Management

Principal-level guidelines for disciplined project planning and execution.

## Scope

This ruleset applies to:

- Project initiation and charter development
- Scope management and WBS creation
- Risk and issue tracking (RAID logs)
- Schedule planning and critical path management
- Team coordination and resource allocation
- Status reporting and dashboards
- Change control processes
- Lessons learned and project closure

## Core Philosophy

**Projects succeed through disciplined planning, transparent communication, and rigorous scope control.** Every project artifact should trace back to the charter's objectives and success criteria.

## Fundamental Principles

### 1. Plan Before Executing

Invest time in upfront planning. A well-decomposed WBS prevents scope creep and estimation failures downstream.

```markdown
Wrong: "Let's just start building and figure it out as we go"
Right: "Let's decompose the scope into work packages before we estimate or schedule"
```

### 2. Guard the Baseline

Once the scope, schedule, and budget baselines are set, all changes go through formal change control. No exceptions.

### 3. Risks Are Managed, Not Ignored

Identify risks early, assess them objectively, plan responses, and track them weekly. A risk register is a living document.

### 4. Communicate Relentlessly

Stakeholder misalignment is the most common cause of project failure. Over-communicate status, risks, and decisions.

### 5. Measure Progress Objectively

Use earned value metrics and milestone tracking, not gut feelings, to assess project health.

## Project Structure

```text
project/
├── initiation/
│   ├── charter.md                # Project charter
│   ├── stakeholder-register.md   # Stakeholder analysis
│   └── business-case.md          # Justification
├── planning/
│   ├── wbs.md                    # Work breakdown structure
│   ├── schedule.md               # Timeline and milestones
│   ├── raci.md                   # Responsibility matrix
│   ├── risk-register.md          # Risk register
│   ├── communication-plan.md     # Stakeholder comms plan
│   └── change-control.md         # Change management process
├── execution/
│   ├── status-reports/           # Weekly status reports
│   ├── meeting-notes/            # Meeting minutes
│   └── deliverables/             # Work products
├── monitoring/
│   ├── raid-log.md               # Risks, assumptions, issues, dependencies
│   ├── change-requests/          # Formal change requests
│   └── dashboards/               # Project dashboards
└── closure/
    ├── lessons-learned.md        # Retrospective findings
    ├── final-report.md           # Project closure report
    └── archive/                  # Archived documentation
```

## Decision Framework

When evaluating any project decision:

1. **Scope Impact**: Does this change the project baseline?
2. **Risk Exposure**: Does this introduce or increase risk?
3. **Stakeholder Alignment**: Have affected parties been consulted?
4. **Resource Availability**: Do we have the capacity to execute?
5. **Trade-off Transparency**: What are we giving up to do this?

## Communication Standards

- Lead status reports with the overall RAG status
- Quantify impacts (days delayed, dollars at risk) rather than using vague language
- Escalate early with proposed solutions, not just problems
- Document all decisions with rationale and participants
- Tailor communication depth to audience (executives get summaries, teams get details)
