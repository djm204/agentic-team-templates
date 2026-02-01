# Logistics

Guidelines for transportation management, route optimization, and freight cost control.

## Core Principle

**Logistics is the physical execution of supply chain strategy.** The right mode, the right carrier, the right route, at the right cost. Every logistics decision balances speed, cost, reliability, and compliance.

## Transportation Mode Selection

### Mode Comparison

| Mode | Cost/kg | Transit Time | Reliability | Best For |
|------|---------|-------------|-------------|----------|
| Ocean (FCL) | $0.02-0.05 | 14-45 days | Medium | Bulk, non-urgent intercontinental |
| Ocean (LCL) | $0.05-0.15 | 21-50 days | Medium-Low | Small intercontinental shipments |
| Rail | $0.03-0.08 | 3-15 days | Medium-High | Heavy goods, continental |
| Truck (FTL) | $0.05-0.15 | 1-5 days | High | Full loads, regional/national |
| Truck (LTL) | $0.10-0.30 | 2-7 days | Medium-High | Partial loads, regional |
| Air | $1.00-5.00 | 1-3 days | High | Urgent, high-value, perishable |
| Parcel | $0.50-3.00 | 1-5 days | High | Small packages, B2C |

### Decision Framework

```text
Question 1: What is the time constraint?
├── < 3 days → Air freight or express parcel
├── 3-14 days → Truck (FTL/LTL) or rail
└── > 14 days → Ocean or rail (for cost optimization)

Question 2: What is the shipment size?
├── < 150 lbs → Parcel carrier
├── 150-10,000 lbs → LTL truck
├── > 10,000 lbs → FTL truck or intermodal
└── Container load → Ocean FCL or rail

Question 3: What is the value density?
├── High (> $50/kg) → Air freight justified
├── Medium ($5-50/kg) → Truck or intermodal
└── Low (< $5/kg) → Ocean or rail (minimize freight %)
```

### Intermodal Strategies

| Combination | Use Case | Savings vs Pure |
|-------------|----------|-----------------|
| Ocean + Truck | Import to inland destination | Standard import routing |
| Rail + Truck | Long-haul domestic + last mile | 20-40% vs FTL over 500+ miles |
| Air + Truck | Urgent international + domestic | Standard for air freight |
| Ocean + Rail | Port to inland warehouse | 10-20% vs ocean + truck |

## Route Optimization

### Milk Run Configuration

```text
Traditional (point-to-point):
  Supplier A → Warehouse: 1 truck
  Supplier B → Warehouse: 1 truck
  Supplier C → Warehouse: 1 truck
  Total: 3 trucks, 3 trips

Milk Run:
  Warehouse → Supplier A → Supplier B → Supplier C → Warehouse
  Total: 1 truck, 1 trip

Savings: 40-60% reduction in transportation cost
Best for: Multiple suppliers in same geographic area
```

### Hub-and-Spoke Model

```text
       [Supplier A]
            \
[Supplier B] → [Regional Hub] → [Distribution Center]
            /
       [Supplier C]

Benefits:
- Consolidation reduces long-haul shipments
- Better truck utilization
- Reduced per-unit freight cost

Trade-offs:
- Added handling and hub costs
- Slightly longer total transit time
- Requires sufficient volume to justify hub
```

### Last-Mile Optimization

| Strategy | Description | Cost Impact |
|----------|-------------|-------------|
| Route optimization software | Algorithm-based routing | -15-25% fuel/labor |
| Delivery windows | Customer picks time slot | -10-15% failed deliveries |
| Locker/pickup points | Customer collects from locker | -30-40% per delivery |
| Zone-based delivery | Set days per zone | -20% route miles |
| Crowdsourced delivery | Gig drivers for peak | Flexible capacity |

## Freight Cost Management

### Cost Structure Breakdown

```text
Typical Freight Cost Components:
├── Base rate (distance x weight/volume)      60-70%
├── Fuel surcharge                            10-15%
├── Accessorial charges                       5-10%
│   ├── Liftgate delivery
│   ├── Inside delivery
│   ├── Residential delivery
│   ├── Detention/demurrage
│   └── Re-delivery
├── Insurance                                 1-2%
└── Administrative fees                       2-5%
```

### Cost Reduction Strategies

| Strategy | Potential Savings | Implementation Effort |
|----------|------------------|----------------------|
| Consolidate shipments | 15-25% | Medium |
| Negotiate volume contracts | 10-20% | Low |
| Mode shift (air to ocean) | 50-80% | Medium |
| Optimize packaging (reduce DIM weight) | 5-15% | Medium |
| Freight audit and payment | 2-5% (error recovery) | Low |
| Backhaul utilization | 20-30% on return legs | Medium |
| Carrier bid events (annual) | 5-15% | Medium |

### Dimensional Weight Calculation

```text
DIM Weight = (Length x Width x Height) / DIM Factor

DIM Factors:
  Domestic truck: 3,000 (cubic inches)
  International air: 5,000 (cubic cm) or 166 (cubic inches)
  Domestic parcel: 139 (cubic inches)

Billable Weight = MAX(Actual Weight, DIM Weight)

Example:
  Box: 24" x 18" x 12" = 5,184 cubic inches
  Actual weight: 25 lbs
  DIM weight: 5,184 / 139 = 37.3 lbs
  Billable weight: 37.3 lbs (DIM weight is higher)
```

### Freight Audit Checklist

```text
For every invoice, verify:
├── Correct origin and destination
├── Correct weight and dimensions
├── Correct freight class (LTL)
├── Contracted rate applied
├── Fuel surcharge matches index
├── Accessorials are legitimate
├── No duplicate charges
└── Delivery confirmed before payment
```

## Customs and Compliance

### Import Process Overview

```text
1. Pre-shipment
   ├── Classify product (HS/HTS code)
   ├── Determine duty rate
   ├── Check for restricted/prohibited items
   ├── Arrange customs broker
   └── Prepare commercial documents

2. Documentation Required
   ├── Commercial invoice
   ├── Packing list
   ├── Bill of lading / Airway bill
   ├── Certificate of origin
   ├── Import license (if required)
   └── Product-specific certifications

3. Customs Clearance
   ├── Entry filing by customs broker
   ├── Document review
   ├── Inspection (if selected)
   ├── Duty assessment and payment
   └── Release of goods

4. Post-Entry
   ├── Record retention (5-7 years)
   ├── Duty drawback claims (if applicable)
   └── Periodic reconciliation
```

### Incoterms Quick Reference

| Term | Risk Transfer | Cost Responsibility |
|------|--------------|---------------------|
| EXW | At seller's premises | Buyer pays everything |
| FOB | When goods pass ship's rail | Seller pays to port |
| CIF | When goods pass ship's rail | Seller pays freight + insurance |
| DDP | At buyer's premises | Seller pays everything |

### Common Compliance Requirements

| Regulation | Scope | Penalty for Non-Compliance |
|------------|-------|---------------------------|
| CTPAT (US) | Import security | Loss of trusted trader status |
| AEO (EU) | Customs simplification | Increased inspections |
| USMCA | North American trade | Duty preference denial |
| Export controls (EAR/ITAR) | Controlled goods | Criminal penalties |
| Sanctions (OFAC) | Restricted parties | Severe fines, criminal charges |

## Carrier Management

### Carrier Scorecard

| Metric | Weight | Target |
|--------|--------|--------|
| On-time pickup | 20% | > 95% |
| On-time delivery | 25% | > 95% |
| Claims ratio | 20% | < 0.5% |
| Invoice accuracy | 15% | > 98% |
| Communication | 10% | Proactive updates |
| Rate competitiveness | 10% | Within 5% of market |

### Carrier Selection Strategy

```text
Primary carriers:  60-70% of volume (2-3 carriers)
Secondary carriers: 20-30% of volume (3-5 carriers)
Spot market:       5-10% of volume (overflow/special)

Review annually through competitive bid process
Rebalance quarterly based on scorecard performance
```

## Key Logistics KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| Freight cost as % of revenue | Total freight / Revenue | < 5% |
| Cost per unit shipped | Total logistics cost / Units shipped | Trending down |
| On-time delivery | On-time deliveries / Total deliveries | > 95% |
| Perfect order rate | Error-free orders / Total orders | > 95% |
| Carrier utilization | Actual capacity used / Available capacity | > 85% |
| Claims rate | Claims filed / Total shipments | < 0.5% |
| Dock-to-stock time | Receipt to available inventory | < 24 hours |

## Common Pitfalls

### 1. Choosing Mode by Default, Not by Analysis

```markdown
Wrong: "We always ship FTL because that's what we've always done"
Right: "We analyzed LTL consolidation and can save 18% by pooling Tuesday/Thursday shipments"
```

### 2. Ignoring Dimensional Weight

```markdown
Wrong: Ship product in oversized boxes, pay DIM rates
Right: Right-size packaging to minimize DIM weight; $3K/month savings on parcel alone
```

### 3. Not Auditing Freight Bills

```markdown
Wrong: Pay every carrier invoice as received
Right: Audit 100% of invoices; industry average error rate is 3-5% of freight spend
```

### 4. Single Carrier Dependency

```markdown
Wrong: 100% of volume with one carrier for "relationship pricing"
Right: Maintain 2-3 qualified carriers per lane; competitive tension improves service and rates
```

### 5. Ignoring Total Landed Cost When Selecting Origin

```markdown
Wrong: "Supplier X is cheapest per unit"
Right: "Supplier X is cheapest per unit but ships from 3,000 miles away;
        landed cost including freight, duties, and inventory carrying is 12% higher"
```

### 6. Neglecting Customs Classification

```markdown
Wrong: Use generic HS code or guess at classification
Right: Professional classification by licensed customs broker;
        wrong codes risk penalties and overpayment of duties
```
