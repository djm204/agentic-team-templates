# Inventory Management

Frameworks and best practices for inventory optimization, classification, and control.

## Core Principle

**Inventory is a buffer against uncertainty.** The goal is not zero inventory but the right inventory in the right place at the right time. Over-stocking ties up cash; under-stocking loses sales.

## Economic Order Quantity (EOQ)

### Formula

```text
EOQ = sqrt((2 x D x S) / H)

Where:
  D = Annual demand (units)
  S = Ordering cost per order ($)
  H = Annual holding cost per unit ($)
```

### When EOQ Applies

| Scenario | EOQ Applicable? | Alternative |
|----------|----------------|-------------|
| Stable demand, constant lead time | Yes | Standard EOQ |
| Volume discounts available | Partial | Quantity discount model |
| Multiple items from same supplier | No | Joint replenishment |
| Perishable goods | No | Newsvendor model |
| Lumpy/sporadic demand | No | Min-max or manual |

### EOQ Sensitivity

```text
EOQ is most sensitive to demand (D) and least sensitive to costs.
Doubling demand increases EOQ by only 41% (sqrt of 2).
If costs are approximate, EOQ still provides a good starting point.
```

## Reorder Points and Safety Stock

### Reorder Point Formula

```text
ROP = (Average Daily Demand x Lead Time) + Safety Stock
```

### Safety Stock Calculation

```text
Basic:
  SS = Z x sigma_D x sqrt(LT)

With lead time variability:
  SS = Z x sqrt(LT x sigma_D^2 + D_avg^2 x sigma_LT^2)

Where:
  Z = Service level factor
  sigma_D = Standard deviation of daily demand
  sigma_LT = Standard deviation of lead time
  LT = Average lead time (days)
  D_avg = Average daily demand
```

### Service Level Z-Values

| Service Level | Z-Value | Typical Use |
|--------------|---------|-------------|
| 90% | 1.28 | C items, low priority |
| 95% | 1.65 | B items, standard |
| 97.5% | 1.96 | A items, important |
| 99% | 2.33 | Critical items |
| 99.9% | 3.09 | Safety-critical, no stockout tolerance |

## ABC/XYZ Classification

### ABC Analysis Steps

1. Calculate annual usage value (unit cost x annual demand) for each SKU
2. Sort descending by usage value
3. Calculate cumulative percentage
4. Classify: A = top 80% of value, B = next 15%, C = remaining 5%

### XYZ Analysis Steps

1. Calculate coefficient of variation (CoV) for each SKU's demand
2. Classify: X (CoV < 0.5), Y (0.5-1.0), Z (> 1.0)

### Combined Strategy Matrix

| Segment | Strategy | Review | Safety Stock |
|---------|----------|--------|-------------|
| AX | JIT/Kanban, tight control | Weekly | Low (predictable) |
| AY | Regular review, moderate buffer | Bi-weekly | Medium |
| AZ | Custom strategy, close monitoring | Weekly | High or make-to-order |
| BX | Automated reorder | Monthly | Standard |
| BY | Periodic review | Monthly | Medium |
| BZ | Safety stock buffer | Monthly | Above average |
| CX | Min-max automation | Quarterly | Minimal |
| CY | Periodic batch ordering | Quarterly | Standard |
| CZ | Consider eliminating or stocking on demand | Semi-annual | High or drop |

## Cycle Counting

### Counting Strategy

```text
A Items: Count every month (100% counted 12x/year)
B Items: Count every quarter (100% counted 4x/year)
C Items: Count every 6 months (100% counted 2x/year)

Daily count target = (A items / 20 working days)
                   + (B items / 60 working days)
                   + (C items / 120 working days)
```

### Accuracy Targets

| Class | Accuracy Target | Tolerance |
|-------|----------------|-----------|
| A | 99.5% | +/- 0.5% |
| B | 97% | +/- 3% |
| C | 95% | +/- 5% |

### Root Cause Categories for Discrepancies

| Category | Examples | Resolution |
|----------|----------|------------|
| Receiving | Miscounts, wrong putaway | Receiving audit, barcode scan |
| Picking | Wrong item, wrong quantity | Pick verification, zone picking |
| System | Timing errors, duplicate entries | Transaction controls |
| Damage | Breakage, spoilage | Inspection protocols |
| Theft | Shrinkage | Security, access controls |

## Warehouse Optimization

### Slotting Strategy

```text
High velocity (A items):  Place near shipping dock, waist-height
Medium velocity (B items): Middle zones
Low velocity (C items):    Far zones, upper/lower racks
Heavyweight items:         Floor level
Frequently co-picked:      Adjacent locations
```

### Key Warehouse KPIs

| KPI | Formula | Target |
|-----|---------|--------|
| Space utilization | Used cubic ft / Total cubic ft | 80-90% |
| Pick accuracy | Correct picks / Total picks | > 99.5% |
| Orders per hour | Orders completed / Labor hours | Varies by type |
| Dock-to-stock time | Receipt to putaway complete | < 24 hours |
| Order cycle time | Order received to shipped | < 24 hours |

## Common Pitfalls

### 1. Using Average Demand Without Variability

```markdown
Wrong: "Average demand is 100/day, so reorder at 100 x 7 days = 700"
Right: "Average demand is 100/day (StdDev 20), lead time 7 days (StdDev 1),
        so ROP = 700 + safety stock of Z x sqrt(7 x 400 + 10000 x 1) = 700 + SS"
```

### 2. One-Size-Fits-All Inventory Policies

```markdown
Wrong: All items have 2 weeks safety stock
Right: A-items get 99% service level, C-items get 90%, each with calculated SS
```

### 3. Ignoring Carrying Costs

```markdown
Wrong: "Buy more to get the volume discount"
Right: "Volume discount saves $5K but additional carrying cost is $8K/year - net loss"
```

### 4. Counting Accuracy Without Root Cause

```markdown
Wrong: Fix the count, move on
Right: Fix the count AND investigate why it was wrong to prevent recurrence
```

### 5. Static Safety Stock

```markdown
Wrong: Set safety stock once and forget it
Right: Recalculate quarterly as demand patterns and lead times change
```

### 6. Not Reviewing Slow Movers

```markdown
Wrong: Keep everything in stock indefinitely
Right: Flag items with no movement in 90+ days for review; consider write-down or liquidation
```
