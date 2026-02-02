# Status Reporting

Guidelines for transparent, actionable project reporting and dashboards.

## Core Principles

### Report for Decisions, Not Documentation

Every report should enable a decision or action. If nobody will act on the information, do not include it.

```markdown
Wrong: 500-word narrative describing what happened last week
Right: RAG status with specific metrics, blockers, and decisions needed
```

### Bad News Early

```markdown
Wrong: Report GREEN → GREEN → GREEN → suddenly RED
Right: Report GREEN → AMBER (with mitigation plan) → back to GREEN
```

## RAG Status Framework

### Definitions

| Status | Definition | Criteria |
|--------|------------|----------|
| GREEN | On track | Schedule, budget, scope, and quality within tolerance |
| AMBER | At risk | One or more areas approaching tolerance limits; PM-level action in progress |
| RED | Off track | One or more areas beyond tolerance; sponsor/steering committee intervention needed |

### Tolerance Thresholds

| Dimension | GREEN | AMBER | RED |
|-----------|-------|-------|-----|
| Schedule | Within 5% of plan | 5-15% deviation | > 15% deviation |
| Budget | Within 5% of plan | 5-10% deviation | > 10% deviation |
| Scope | No uncontrolled changes | Minor changes under review | Significant uncontrolled changes |
| Quality | All criteria met | Some criteria at risk | Critical criteria failing |
| Resources | Fully staffed | Minor gaps with mitigation | Key roles unfilled |

### When to Change Status

```markdown
GREEN → AMBER:
- A risk trigger has fired but mitigation is underway
- A dependency is at risk but alternatives exist
- Schedule slippage is within buffer but trending

AMBER → RED:
- Mitigation is not working
- Critical path is impacted with no recovery plan
- Budget overrun exceeds contingency
- Key stakeholder escalation is needed

RED → AMBER:
- Recovery plan is approved and in progress
- Key blocker is resolved
- Additional resources secured

AMBER → GREEN:
- Risk has been mitigated or retired
- Schedule recovered to within tolerance
- Issue resolved with no lasting impact
```

## Weekly Status Report

### Structure

```markdown
## Project Status: [Project Name]
**Period**: [Date Range] | **PM**: [Name] | **Overall**: GREEN/AMBER/RED

### Executive Summary
[2-3 sentences maximum. Lead with the most important item.]

### Status by Dimension
| Dimension | Status | Trend | Commentary |
|-----------|--------|-------|------------|
| Schedule | GREEN | → | On track for March milestone |
| Budget | AMBER | ↓ | Vendor costs 8% above estimate; negotiating |
| Scope | GREEN | → | No change requests this period |
| Quality | GREEN | ↑ | Defect rate declining |
| Resources | GREEN | → | Team fully staffed |

### Key Accomplishments
1. [Deliverable/milestone completed]
2. [Risk resolved or mitigated]

### Planned Activities (Next Period)
1. [Key activity and expected outcome]
2. [Key activity and expected outcome]

### Risks & Issues (Top 3)
| ID | Type | Description | Impact | Owner | Action |
|----|------|-------------|--------|-------|--------|
| R-003 | Risk | [Description] | Schedule +1wk | [Name] | [Action] |
| I-007 | Issue | [Description] | Quality | [Name] | [Action] |

### Milestones
| Milestone | Baseline | Forecast | Variance | Status |
|-----------|----------|----------|----------|--------|
| Design Review | Mar 15 | Mar 15 | 0 days | GREEN |
| Dev Complete | Apr 30 | May 7 | +7 days | AMBER |
| Go-Live | Jun 1 | Jun 1 | 0 days | GREEN |

### Decisions Needed
1. [Decision]: [Context] - Needed by [Date]

### Budget Summary
| Category | Budget | Spent | Forecast | Variance |
|----------|--------|-------|----------|----------|
| Internal Labor | $50K | $22K | $48K | -$2K |
| External Vendor | $30K | $18K | $33K | +$3K |
| **Total** | **$80K** | **$40K** | **$81K** | **+$1K** |
```

## Milestone Tracking

### Milestone Report

```text
Milestone Timeline (Visual)

Q1 2025                    Q2 2025
Jan     Feb     Mar       Apr     May     Jun
─────────────────────────────────────────────────
  ◆ Kickoff                ◆ Dev Complete
          ◆ Design Review          ◆ UAT Complete
                  ◆ Dev Start              ◆ Go-Live

◆ = On Track    ◇ = At Risk    ○ = Missed    ● = Complete
```

### Milestone Health Rules

| Scenario | Status | Action |
|----------|--------|--------|
| On track, no blockers | GREEN | Continue monitoring |
| Predecessor delayed, but float exists | GREEN | Monitor float consumption |
| Predecessor delayed, float consumed | AMBER | Escalate; identify acceleration options |
| Critical path milestone at risk | RED | Recovery plan required immediately |
| Milestone missed | RED | Re-baseline with sponsor approval |

## Earned Value Management

### Core Metrics

```text
Example: Project budget $100K, 10-month duration, end of Month 5

Planned Value (PV):    $50K  (50% of work should be done)
Earned Value (EV):     $45K  (45% of work is done)
Actual Cost (AC):      $55K  (spent $55K so far)

Schedule Variance:     EV - PV = $45K - $50K = -$5K (behind schedule)
Cost Variance:         EV - AC = $45K - $55K = -$10K (over budget)
SPI:                   EV / PV = 0.90 (90% schedule efficiency)
CPI:                   EV / AC = 0.82 (82% cost efficiency)
EAC:                   BAC / CPI = $100K / 0.82 = $122K (projected total cost)
```

### EVM Interpretation Guide

| Metric | Good | Warning | Bad |
|--------|------|---------|-----|
| SPI | > 1.0 | 0.9 - 1.0 | < 0.9 |
| CPI | > 1.0 | 0.9 - 1.0 | < 0.9 |
| SV | Positive | Slightly negative | Significantly negative |
| CV | Positive | Slightly negative | Significantly negative |

### When to Use EVM

- Projects with defined budgets and schedules
- Multi-month projects where trends matter
- Executive reporting that requires objectivity
- Projects with contractual cost/schedule obligations

## Executive Summaries

### One-Page Executive Summary

```markdown
## [Project Name] - Executive Status

**Overall**: GREEN/AMBER/RED | **Date**: [Date] | **PM**: [Name]

### Bottom Line
[One sentence: project state and most critical item]

### Key Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Schedule (SPI) | 0.95 | 1.0 | AMBER |
| Budget (CPI) | 1.02 | 1.0 | GREEN |
| Scope | 0 open CRs | < 3 | GREEN |

### Top Risk
[One sentence describing the highest-priority risk and its response]

### Decision Needed
[One sentence describing the decision, options, and deadline]

### Next Milestone
[Milestone name] - [Date] - [Status]
```

### Audience-Specific Reporting

| Audience | Content | Detail Level | Frequency |
|----------|---------|--------------|-----------|
| Steering Committee | Strategic status, decisions, escalations | High-level | Monthly |
| Sponsor | Overall health, risks, budget | Summary | Weekly |
| Project Team | Tasks, blockers, dependencies | Detailed | Daily/Weekly |
| PMO | Portfolio-level metrics | Standardized | Monthly |
| External Stakeholders | Milestones, deliverables | Curated | As agreed |

## Dashboard Design

### Dashboard Structure

```text
Project Dashboard
┌──────────────────────────────────────────────┐
│ Overall Status: [RAG]  |  SPI: X  |  CPI: X │
├──────────────────────────────────────────────┤
│ Milestone Timeline (Gantt/visual)            │
├──────────────┬───────────────────────────────┤
│ Budget       │ Risks & Issues               │
│ - Planned    │ - Top 3 risks                │
│ - Actual     │ - Open issues                │
│ - Forecast   │ - Trending                   │
├──────────────┴───────────────────────────────┤
│ Team Velocity / Throughput                   │
└──────────────────────────────────────────────┘
```

### Dashboard Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Too many metrics | Information overload | Focus on 5-7 key metrics |
| No context | Numbers without meaning | Include targets and trends |
| Stale data | Decisions based on old info | Automate updates; show "as of" date |
| Vanity metrics | Impressive but not actionable | Every metric should inform a decision |
| Missing trends | Can't see direction of change | Include trend arrows or sparklines |

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Watermelon reporting | Green on outside, red inside | Mandate dimension-level RAG, not just overall |
| Report without action | Reports filed, never discussed | Require "Decisions Needed" section |
| Inconsistent format | Every PM reports differently | Standardize templates across the PMO |
| Too much detail for executives | Eyes glaze over | Separate executive summary from detailed report |
| No trend tracking | Can't see if things are getting better or worse | Include trend indicators on every metric |
| Reporting effort exceeds value | PM spends Friday writing reports | Automate where possible; keep reports concise |
