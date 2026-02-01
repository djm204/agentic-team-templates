# Scheduling

Guidelines for building, managing, and defending project schedules.

## Core Principles

### Schedule From the WBS

Never build a schedule without a Work Breakdown Structure. The WBS defines what needs to be done; the schedule defines when and in what order.

```markdown
Wrong: Open a Gantt tool and start listing tasks from memory
Right: Decompose the WBS → identify dependencies → estimate durations → build the schedule
```

### Protect the Critical Path

The critical path is the longest chain of dependent tasks. Any delay on the critical path delays the entire project. Every scheduling decision should consider its impact on the critical path.

## Task Dependencies

### Dependency Types

| Type | Abbreviation | Description | Example |
|------|-------------|-------------|---------|
| Finish-to-Start | FS | B starts after A finishes | Design finishes → Development starts |
| Start-to-Start | SS | B starts when A starts | Coding starts → Testing starts |
| Finish-to-Finish | FF | B finishes when A finishes | Coding finishes → Documentation finishes |
| Start-to-Finish | SF | B finishes when A starts | New system starts → Old system finishes |

### Dependency Best Practices

```markdown
Do:
- Use FS (Finish-to-Start) as the default; it is the most common and clearest
- Document the reason for every non-FS dependency
- Identify external dependencies early (other teams, vendors, approvals)
- Review dependencies with task owners, not just the PM

Don't:
- Create circular dependencies (A → B → C → A)
- Use SF dependencies unless absolutely necessary (they confuse teams)
- Assume dependencies exist when tasks can actually run in parallel
- Forget approval gates as dependencies (design review before development)
```

### Dependency Log

| ID | Predecessor | Successor | Type | Lag | Notes |
|----|-------------|-----------|------|-----|-------|
| DEP-001 | Design Review | Frontend Dev | FS | 0 | Approval required |
| DEP-002 | Backend API | Frontend Integration | FS | +2d | API needs staging deploy |
| DEP-003 | Dev Start | QA Test Plan | SS | +3d | QA starts writing plans once dev begins |

## Critical Path Management

### Identifying the Critical Path

```text
Example network diagram:

A(5d) → C(3d) → E(4d) → G(2d) = 14 days
B(3d) → D(6d) → F(2d) → G(2d) = 13 days

Critical Path: A → C → E → G (14 days)
Float on path B-D-F: 14 - 13 = 1 day
```

### Critical Path Rules

| Rule | Rationale |
|------|-----------|
| Never add non-essential tasks to the critical path | Every task on the critical path is a potential delay |
| Staff critical-path tasks with your best resources | Reduce risk of delay |
| Monitor critical-path tasks daily | Early warning of slippage |
| Add feeding buffers where non-critical paths join the critical path | Protect against delays propagating |
| Re-calculate the critical path after every schedule change | The critical path can shift |

### Fast-Tracking vs. Crashing

| Technique | Description | Risk | When to Use |
|-----------|-------------|------|-------------|
| **Fast-tracking** | Overlap tasks that would normally be sequential | Increased rework risk | Tasks can be partially parallelized |
| **Crashing** | Add resources to shorten task duration | Increased cost; diminishing returns | Critical tasks with flexible resource needs |

```markdown
Example - Fast-tracking:
Before: Design (10d) → Development (20d) → Testing (10d) = 40 days
After:  Design (10d) → [Dev starts after 7d of Design] → Testing starts after 15d of Dev
                        Overlap saves ~8 days, but rework risk increases

Example - Crashing:
Before: Development (20d, 2 developers) = 20 days
After:  Development (14d, 3 developers) = 14 days, +50% cost
```

## Estimation

### Three-Point Estimation

```text
Expected Duration = (Optimistic + 4 x Most Likely + Pessimistic) / 6

Example:
Optimistic (O): 5 days (everything goes perfectly)
Most Likely (M): 8 days (normal conditions)
Pessimistic (P): 15 days (major obstacles)

Expected = (5 + 4(8) + 15) / 6 = 52 / 6 = 8.7 days
Standard Deviation = (P - O) / 6 = (15 - 5) / 6 = 1.67 days
```

### Estimation Best Practices

| Practice | Rationale |
|----------|-----------|
| Estimate with the team, not for the team | Those doing the work estimate most accurately |
| Include all work (meetings, reviews, rework) | Underestimation comes from forgetting overhead |
| Use historical data when available | Past performance predicts future performance |
| Add contingency for unknowns | 10-20% for known unknowns; more for novel work |
| Re-estimate as you learn more | Estimates improve as uncertainty decreases |

### Estimation Anti-Patterns

```markdown
Wrong: PM estimates all tasks alone
Right: Task owners estimate; PM aggregates and validates

Wrong: "It'll take 2 weeks" (always 2 weeks)
Right: Three-point estimate with documented assumptions

Wrong: Cutting estimates to fit the desired timeline
Right: Present honest estimates; negotiate scope, not effort

Wrong: Estimating large tasks without decomposition
Right: Break tasks into 1-5 day work packages, then estimate
```

## Resource Leveling

### Over-Allocation Detection

```text
Week 1 Schedule (before leveling):
Developer A:  Task 1 (40h) + Task 2 (20h) = 60h  ← Over-allocated
Developer B:  Task 3 (30h) = 30h                   ← Under-utilized

Week 1 Schedule (after leveling):
Developer A:  Task 1 (40h) = 40h
Developer B:  Task 3 (30h) + Task 2 (10h) = 40h
Week 2:
Developer B:  Task 2 remaining (10h)
```

### Leveling Strategies

| Strategy | Impact | When to Use |
|----------|--------|-------------|
| Delay non-critical tasks | Uses float, no cost impact | Non-critical path tasks with float |
| Split tasks | Extends duration of individual tasks | Tasks that can be paused and resumed |
| Reassign work | May affect quality or speed | Interchangeable team members |
| Add resources | Increases cost | Critical-path tasks, budget available |
| Reduce scope | Changes deliverables | Negotiable with stakeholders |

## Buffer Management

### Types of Buffers

| Buffer Type | Purpose | Size Guideline |
|-------------|---------|----------------|
| **Project buffer** | Protects the project end date | 25-50% of critical path duration |
| **Feeding buffer** | Protects critical path from non-critical delays | 50% of feeding chain duration |
| **Resource buffer** | Alerts resource managers before critical tasks | Warning 2 weeks before task start |

### Buffer Consumption Tracking

```text
Project Buffer: 20 days

Status at Week 8:
├── Buffer consumed: 5 days (25%)
├── Project completion: 40%
├── Buffer health: GREEN (consumption < % complete)
│
│ Interpretation:
│ If buffer consumed % < project complete %  → GREEN
│ If buffer consumed % ≈ project complete %  → AMBER
│ If buffer consumed % > project complete %  → RED
```

## Milestone Planning

### Milestone Types

| Type | Description | Example |
|------|-------------|---------|
| **Delivery milestone** | Deliverable completed | "API v2 deployed to staging" |
| **Decision milestone** | Approval or go/no-go | "Sponsor approves design" |
| **External milestone** | Dependency from outside | "Vendor delivers hardware" |
| **Phase gate** | Transition between phases | "Planning phase complete" |

### Milestone Criteria

Every milestone should have:

```markdown
## Milestone: [Name]

**Target Date**: [Date]
**Owner**: [Name]
**Type**: Delivery / Decision / External / Phase Gate

### Entry Criteria
- [What must be true before this milestone can be attempted]

### Completion Criteria
- [Specific, measurable conditions that define "done"]

### Dependencies
- [Preceding milestones or deliverables]

### Verification Method
- [How completion is verified: review, demo, sign-off]
```

### Milestone Best Practices

```markdown
Do:
- Space milestones 2-4 weeks apart for regular progress visibility
- Include both technical and business milestones
- Define clear, measurable completion criteria
- Track baseline vs. forecast dates

Don't:
- Set milestones without completion criteria
- Place all milestones at the end of the project
- Ignore milestone slippage (a milestone delayed is a red flag)
- Use milestones as deadlines without buffer
```

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Student syndrome | Work starts at the last minute | Use feeding buffers; track early starts |
| Parkinson's law | Work expands to fill time allocated | Set aggressive but realistic milestones |
| Ignoring float consumption | Non-critical tasks become critical | Track float weekly; alert when float < 2 days |
| Not re-planning after changes | Schedule becomes fiction | Re-baseline after every approved change |
| Single-point estimates | False precision, no risk awareness | Use three-point estimation consistently |
| Resource conflicts across projects | Shared resources create bottlenecks | Coordinate with portfolio/resource manager early |
