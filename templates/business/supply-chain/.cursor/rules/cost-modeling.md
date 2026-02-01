# Cost Modeling

Guidelines for total cost analysis, landed cost calculation, and make-vs-buy decisions.

## Core Principle

**Unit price is never the full cost.** Every sourcing, manufacturing, and logistics decision must be evaluated on total cost of ownership. Hidden costs in quality, risk, inventory carrying, and administration often exceed the visible price difference between options.

## Total Cost of Ownership (TCO)

### TCO Framework

```text
TCO = Direct Costs + Indirect Costs + Hidden Costs

Direct Costs:
├── Purchase price (unit cost x volume)
├── Transportation and freight
├── Customs duties and taxes
└── Packaging

Indirect Costs:
├── Ordering and procurement costs
├── Receiving and inspection costs
├── Inventory carrying costs (15-30% of value/year)
├── Quality costs (rework, scrap, returns)
└── Administration and management overhead

Hidden Costs:
├── Risk costs (disruption, single-source premium)
├── Currency fluctuation exposure
├── Opportunity cost of tied-up capital
├── Compliance and regulatory costs
└── Supplier management overhead
```

### Inventory Carrying Cost Components

```text
Carrying Cost = 15-30% of average inventory value per year

Breakdown:
├── Cost of capital:          8-15% (weighted average cost of capital)
├── Storage and handling:     3-5%
├── Insurance:                1-2%
├── Obsolescence risk:        2-5%
├── Damage and shrinkage:     1-3%
└── Taxes:                    0-2%

Example:
  Average inventory value: $1,000,000
  Carrying cost rate: 25%
  Annual carrying cost: $250,000

  Reducing inventory by $200K saves $50K/year in carrying costs.
```

### TCO Comparison Template

```markdown
## TCO Analysis: [Item/Category]
### Analysis Period: [Annual]

| Cost Element | Option A (Domestic) | Option B (Offshore) | Option C (Nearshore) |
|-------------|--------------------|--------------------|---------------------|
| **Direct Costs** | | | |
| Unit price | $10.00 | $7.00 | $8.50 |
| Annual volume | 100,000 | 100,000 | 100,000 |
| Subtotal | $1,000,000 | $700,000 | $850,000 |
| | | | |
| **Logistics** | | | |
| Freight per unit | $0.20 | $1.50 | $0.80 |
| Customs duties | $0.00 | $0.70 | $0.25 |
| Insurance | $0.02 | $0.10 | $0.05 |
| Subtotal | $22,000 | $230,000 | $110,000 |
| | | | |
| **Inventory** | | | |
| Pipeline inventory (days) | 5 | 45 | 15 |
| Safety stock (days) | 7 | 21 | 10 |
| Carrying cost | $8,200 | $45,100 | $17,100 |
| | | | |
| **Quality** | | | |
| Defect rate | 0.2% | 1.5% | 0.5% |
| Quality cost/unit | $0.05 | $0.40 | $0.12 |
| Subtotal | $5,000 | $40,000 | $12,000 |
| | | | |
| **Administration** | | | |
| Procurement overhead | $5,000 | $25,000 | $15,000 |
| Travel for audits | $2,000 | $20,000 | $8,000 |
| | | | |
| **Risk Premium** | | | |
| Disruption risk | $5,000 | $35,000 | $15,000 |
| Currency risk | $0 | $15,000 | $5,000 |
| | | | |
| **Total TCO** | **$1,047,200** | **$1,110,100** | **$1,032,100** |
| **TCO per unit** | **$10.47** | **$11.10** | **$10.32** |

### Recommendation
Option C (Nearshore) has lowest TCO despite not having lowest unit price.
Option B saves $3/unit on price but adds $4.10/unit in logistics, quality, and risk costs.
```

## Landed Cost Calculation

### Formula

```text
Landed Cost = Product Cost
            + International Freight
            + Insurance (typically 0.3-0.5% of CIF value)
            + Customs Duties (value x duty rate based on HS code)
            + Customs Brokerage Fees (flat per entry)
            + Domestic Transportation
            + Handling and Warehousing
            + Regulatory Compliance Costs
```

### Duty Calculation

```text
Duty = Customs Value x Duty Rate

Customs Value (CIF basis for most countries):
  = Product Cost + Freight to Port + Insurance

Example:
  Product cost: $50,000
  Ocean freight: $3,000
  Insurance: $265
  CIF value: $53,265
  Duty rate (HS 8471.30): 0% (computers)

  vs.

  Product cost: $50,000
  Ocean freight: $3,000
  Insurance: $265
  CIF value: $53,265
  Duty rate (HS 6204.62): 16.6% (women's trousers)
  Duty: $8,842
```

### Free Trade Agreement Impact

| Agreement | Countries | Typical Savings |
|-----------|-----------|-----------------|
| USMCA | US, Mexico, Canada | 0-25% duty elimination |
| EU FTAs | EU + partner countries | Variable |
| CPTPP | 11 Pacific Rim nations | 0-15% duty reduction |
| RCEP | 15 Asia-Pacific nations | Variable |

```text
Requirements for FTA Duty Preference:
├── Product qualifies under rules of origin
├── Certificate of origin obtained from supplier
├── Goods shipped directly (no transshipment to non-member)
├── Documentation retained for audit (5-7 years)
└── Country-specific requirements met
```

## Make-vs-Buy Analysis

### Decision Framework

```text
                    Strategic Importance
                    Low              High
Complexity  High    Outsource        Strategic
                    (Find expert)     Insource
                                     (Core competency)
            Low     Outsource        Consider
                    (Commodity)       Both
                                     (Case by case)
```

### Cost Comparison Template

```markdown
## Make vs Buy: [Component/Process]

### Make (In-House)
| Cost Element | Annual Cost |
|-------------|------------|
| Direct materials | $X |
| Direct labor | $X |
| Equipment depreciation | $X |
| Facility allocation | $X |
| Utilities | $X |
| Quality/inspection | $X |
| Overhead allocation | $X |
| **Total Make Cost** | **$X** |
| **Per Unit** | **$X** |

### Buy (Outsource)
| Cost Element | Annual Cost |
|-------------|------------|
| Purchase price | $X |
| Freight | $X |
| Incoming inspection | $X |
| Inventory carrying | $X |
| Supplier management | $X |
| Quality risk | $X |
| **Total Buy Cost** | **$X** |
| **Per Unit** | **$X** |

### Non-Financial Factors
| Factor | Make | Buy |
|--------|------|-----|
| Lead time | [X days] | [Y days] |
| Quality control | Direct | Indirect |
| Flexibility | [Assessment] | [Assessment] |
| IP protection | High | Medium-Low |
| Scalability | Capital-limited | Supplier-limited |
| Focus | Diverts resources | Frees resources |

### Recommendation
[Make/Buy] because [rationale including both cost and strategic factors]
```

## Cost Breakdown Structure

### Product Cost Decomposition

```text
Total Product Cost
├── Raw Materials (40-60% typical)
│   ├── Primary materials
│   ├── Secondary materials
│   └── Packaging materials
├── Direct Labor (10-25% typical)
│   ├── Production labor
│   ├── Assembly labor
│   └── Quality inspection
├── Manufacturing Overhead (15-25% typical)
│   ├── Equipment depreciation
│   ├── Facility costs
│   ├── Utilities
│   ├── Maintenance
│   └── Indirect labor
├── SGA (5-15% typical)
│   ├── Sales and marketing
│   ├── Administration
│   └── R&D allocation
└── Profit Margin (5-15% typical)
```

### Should-Cost Modeling

```text
Purpose: Estimate what a product SHOULD cost based on component analysis.
Use: Validate supplier quotes, negotiate from an informed position.

Steps:
1. Decompose product into raw materials
2. Price each material at market rates
3. Estimate labor based on process times and local rates
4. Apply overhead using industry benchmarks
5. Add reasonable margin
6. Compare to supplier quote

If quote significantly exceeds should-cost:
├── Supplier is overpricing → Negotiate
├── Your model is missing something → Investigate
└── Supplier has inefficiency → Discuss improvement
```

## Target Costing

### Process

```text
Step 1: Determine market price (what customers will pay)
Step 2: Subtract required margin
Step 3: Result = target cost (maximum allowable cost)
Step 4: Design product to meet target cost
Step 5: If current cost > target, identify cost reduction opportunities

Market Price:          $100
Required Margin (20%): -$20
Target Cost:           $80
Current Estimated Cost: $92
Gap to Close:          $12 (15% reduction needed)

Cost Reduction Actions:
├── Material substitution: -$4
├── Design simplification: -$3
├── Process improvement: -$3
├── Supplier negotiation: -$2
└── Total reduction: $12 ✓
```

## Financial Impact Analysis

### Net Present Value for Supply Chain Investments

```text
NPV = -Initial Investment + SUM(Annual Savings / (1 + r)^t)

Example: Warehouse Automation
  Investment: $500,000
  Annual labor savings: $150,000
  Annual error reduction: $30,000
  Discount rate: 10%
  Horizon: 5 years

  NPV = -500,000 + 180,000/(1.1)^1 + 180,000/(1.1)^2 + ... + 180,000/(1.1)^5
  NPV = -500,000 + 682,344
  NPV = $182,344 (positive = invest)

  Payback period: $500,000 / $180,000 = 2.8 years
```

### Cost Savings Tracking

```markdown
## Cost Savings Report: [Quarter/Year]

### By Category
| Category | Target | Actual | Variance |
|----------|--------|--------|----------|
| Procurement savings | $200K | $185K | -$15K |
| Freight optimization | $75K | $92K | +$17K |
| Inventory reduction | $50K | $45K | -$5K |
| Process improvement | $30K | $38K | +$8K |
| **Total** | **$355K** | **$360K** | **+$5K** |

### Savings Classification
- Hard savings (P&L impact): $280K
- Soft savings (cost avoidance): $60K
- Productivity gains (time savings): $20K
```

## Common Pitfalls

### 1. Comparing Unit Prices Instead of TCO

```markdown
Wrong: "Supplier A is $2 cheaper per unit, switch immediately"
Right: "Supplier A is $2 cheaper per unit but requires 4x more safety stock
        and has 3x the defect rate. TCO analysis shows they are 8% MORE expensive."
```

### 2. Ignoring the Cost of Tied-Up Capital

```markdown
Wrong: "Buy 6 months of inventory to get the volume discount"
Right: "Volume discount saves $20K but carrying cost on extra inventory is $35K.
        Net cost increase of $15K."
```

### 3. Double-Counting Cost Savings

```markdown
Wrong: Count same savings in both procurement and operations budgets
Right: Define clear ownership of each savings initiative; avoid overlap
```

### 4. Assuming Current Costs are the Baseline

```markdown
Wrong: "We saved 5% vs last year's price"
Right: "We saved 5% vs last year, but market prices dropped 8%.
        We actually underperformed the market by 3%."
```

### 5. Excluding Risk from Cost Models

```markdown
Wrong: Compare options based on expected cost only
Right: Include risk-adjusted costs. A disruption probability of 5% with $500K impact
       adds $25K expected annual cost to the option.
```

### 6. Static Models for Dynamic Decisions

```markdown
Wrong: Run cost model once and treat it as permanent truth
Right: Update models quarterly with current rates, volumes, and market conditions.
       Decisions made on stale data are unreliable.
```
