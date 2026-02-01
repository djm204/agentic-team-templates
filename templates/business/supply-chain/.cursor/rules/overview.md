# Supply Chain Management

Principal-level guidelines for end-to-end supply chain optimization.

## Scope

This ruleset applies to:

- Inventory management and optimization
- Demand planning and forecasting
- Supplier evaluation and relationships
- Logistics and transportation
- Cost optimization and modeling
- Risk mitigation and business continuity

## Core Philosophy

**Supply chains compete, not companies.** The organization with the most responsive, cost-effective, and resilient supply chain wins. Every decision must balance cost, speed, quality, and risk.

## Fundamental Principles

### 1. End-to-End Visibility

You cannot optimize what you cannot see. Every node, every flow, every cost must be measured.

```markdown
Wrong: "We track inventory at our warehouse"
Right: "We track inventory from supplier raw materials through to customer delivery"
```

### 2. Demand-Driven Planning

Pull-based systems reduce waste. Let actual demand signal drive replenishment.

### 3. Total Cost Thinking

Unit price is one component. True cost includes transportation, quality, risk, and carrying costs.

### 4. Risk Diversification

Single points of failure are not acceptable for critical materials or routes.

### 5. Continuous Improvement

Measure baseline, set targets, implement changes, verify results, standardize.

## Project Structure

```text
supply-chain/
├── inventory/
│   ├── abc-analysis.md           # SKU classification
│   ├── safety-stock-params.md    # Safety stock calculations
│   ├── reorder-points.md         # ROP by item class
│   └── cycle-count-schedule.md   # Counting calendar
├── demand/
│   ├── forecast-models.md        # Active forecast methods
│   ├── accuracy-tracking.md      # MAPE and bias reports
│   ├── consensus-plan.md         # S&OP demand plan
│   └── demand-signals.md         # Leading indicators
├── suppliers/
│   ├── scorecards/               # Per-supplier scorecards
│   ├── contracts/                # Active agreements
│   ├── rfq-templates/            # RFQ documents
│   └── risk-profiles/            # Supplier risk assessments
├── logistics/
│   ├── carrier-contracts/        # Carrier agreements
│   ├── route-optimization/       # Routing models
│   ├── freight-analysis/         # Cost analysis
│   └── compliance/               # Customs and regulatory
├── cost-models/
│   ├── tco-analyses/             # Total cost of ownership
│   ├── landed-costs/             # Landed cost calculations
│   ├── make-vs-buy/              # Sourcing decisions
│   └── budget-tracking/          # Cost vs budget
├── risk/
│   ├── risk-register.md          # Active risk log
│   ├── bcp-plans/                # Business continuity plans
│   └── mitigation-tracker.md     # Action items
└── s-and-op/
    ├── meeting-minutes/          # Monthly S&OP notes
    ├── consensus-plan.md         # Approved plan
    └── kpi-dashboard.md          # Performance metrics
```

## Decision Framework

When evaluating any supply chain decision:

1. **Total Cost**: What is the full cost including hidden and indirect costs?
2. **Service Impact**: How does this affect customer delivery and fill rates?
3. **Risk Exposure**: Does this create or mitigate supply chain risk?
4. **Capacity**: Do we have the resources and infrastructure to execute?
5. **Flexibility**: Does this improve or reduce our ability to respond to change?

## Communication Standards

- Use data to support every recommendation
- Quantify trade-offs in dollars and service levels
- Present scenarios (best case, likely, worst case)
- Document assumptions behind every model
- Share risks alongside opportunities
