# Product Management

Principal-level guidelines for outcome-driven product management.

## Scope

This ruleset applies to:

- Product strategy and vision
- Customer discovery and research
- Feature prioritization and roadmapping
- Requirements documentation (PRDs, user stories)
- OKRs and product metrics
- Stakeholder alignment and communication
- Go-to-market coordination

## Core Philosophy

**Products exist to solve customer problems in ways that drive business outcomes.** Every decision should trace back to validated customer needs and measurable business impact.

## Fundamental Principles

### 1. Outcomes Over Outputs

Measure success by customer and business impact, not features shipped.

```markdown
❌ Wrong: "We shipped 15 features this quarter"
✅ Right: "We reduced time-to-value from 14 days to 3 days"
```

### 2. Continuous Discovery

Never stop learning from customers. Minimum one customer conversation per week.

### 3. Evidence-Based Decisions

Use data and research to inform priorities, not HiPPO (Highest Paid Person's Opinion).

### 4. Cross-Functional Collaboration

Great products emerge from empowered teams of product, engineering, and design working together—not handoffs.

### 5. Strategic Clarity

Every feature connects to a user need, which connects to a product goal, which connects to a company objective.

## Project Structure

```text
product/
├── strategy/
│   ├── vision.md              # Product vision and mission
│   ├── strategy.md            # 1-2 year strategic plan
│   └── competitive-analysis.md
├── discovery/
│   ├── opportunity-tree.md    # Opportunity solution tree
│   ├── interviews/            # Customer interview notes
│   ├── personas/              # User personas
│   └── research/              # Research findings
├── roadmap/
│   ├── roadmap.md             # Current roadmap
│   ├── okrs.md                # Quarterly OKRs
│   └── archive/               # Historical roadmaps
├── requirements/
│   ├── prds/                  # Product requirements documents
│   ├── user-stories/          # User story backlog
│   └── specs/                 # Detailed specifications
├── analytics/
│   ├── metrics.md             # Key metrics definitions
│   ├── dashboards/            # Dashboard configs
│   └── experiments/           # A/B test documentation
└── communication/
    ├── stakeholder-updates/   # Status updates
    ├── release-notes/         # Customer-facing notes
    └── presentations/         # Roadmap presentations
```

## Decision Framework

When evaluating any product decision:

1. **Customer Impact**: Does this solve a validated customer problem?
2. **Business Alignment**: Does this support company objectives?
3. **Feasibility**: Can we build this with available resources?
4. **Evidence**: What data supports this decision?
5. **Opportunity Cost**: What are we NOT doing if we choose this?

## Communication Standards

- Use data to support assertions
- Lead with the "why" before the "what"
- Tailor detail level to audience
- Document decisions and rationale
- Share context, not just conclusions
