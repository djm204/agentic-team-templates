# Demand Forecasting

Guidelines for accurate demand planning using statistical, causal, and collaborative methods.

## Core Principle

**All forecasts are wrong; the goal is to be less wrong and to plan for the uncertainty.** A good forecasting process combines quantitative methods with market intelligence and measures accuracy rigorously.

## Time Series Methods

### Simple Moving Average

```text
Forecast = (Sum of last N periods) / N

Best for: Stable demand with no trend or seasonality
Typical N: 3-6 months for monthly data

Example (3-month moving average):
  Jan: 100, Feb: 110, Mar: 105
  April forecast = (100 + 110 + 105) / 3 = 105
```

### Weighted Moving Average

```text
Forecast = (W1 x D1 + W2 x D2 + ... + Wn x Dn) / (W1 + W2 + ... + Wn)

Assign higher weights to more recent periods.

Example:
  Weights: Current month 3, Previous 2, Two months ago 1
  Jan: 100 (w=1), Feb: 110 (w=2), Mar: 105 (w=3)
  April forecast = (100x1 + 110x2 + 105x3) / 6 = 106.7
```

### Exponential Smoothing

```text
Simple Exponential Smoothing:
  F(t+1) = alpha x A(t) + (1 - alpha) x F(t)

  alpha (smoothing constant): 0.1-0.3 for stable demand, 0.4-0.6 for volatile

Holt's Method (trend):
  Level:  L(t) = alpha x A(t) + (1 - alpha) x (L(t-1) + T(t-1))
  Trend:  T(t) = beta x (L(t) - L(t-1)) + (1 - beta) x T(t-1)
  Forecast: F(t+m) = L(t) + m x T(t)

Holt-Winters (trend + seasonality):
  Adds seasonal component S(t) with gamma parameter
  Best for data with both trend and seasonal patterns
```

### Method Selection Guide

| Pattern | Recommended Method |
|---------|-------------------|
| Flat, stable | Simple moving average or simple exponential smoothing |
| Upward/downward trend | Holt's double exponential smoothing |
| Trend + seasonality | Holt-Winters or ARIMA with seasonal component |
| Complex patterns | ARIMA, Prophet, or machine learning |
| New product (no history) | Analogous product comparison or judgment |

## Causal Models

### Regression-Based Forecasting

```text
Demand = f(Price, Promotions, Season, Economic Indicators, ...)

Example:
  Demand = 5000 - 200(Price) + 1500(Promo) + 300(Season_Q4)

Use when:
- External factors clearly drive demand
- Sufficient historical data with variable changes
- Need to model "what if" scenarios
```

### Common Causal Variables

| Variable | Impact Direction | Data Source |
|----------|-----------------|-------------|
| Price changes | Inverse (usually) | Internal pricing |
| Promotions | Positive (temporary) | Marketing calendar |
| Competitor actions | Variable | Market intelligence |
| Economic indicators | Directional | Government data |
| Weather | Product-specific | Weather services |
| Calendar events | Seasonal spikes | Fixed calendar |

## Collaborative Forecasting

### CPFR Process

```text
Step 1: Statistical Baseline
        Generate automated forecast from historical data

Step 2: Sales Input
        Account managers adjust for known opportunities/risks

Step 3: Marketing Input
        Add promotional lifts, new product launches, campaigns

Step 4: Finance Overlay
        Align with revenue targets and budget constraints

Step 5: Supply Chain Adjustment
        Adjust for capacity constraints and lead times

Step 6: Consensus Review
        Executive sign-off on final demand plan
```

### Best Practices for Forecast Collaboration

```markdown
Do:
- Start with a statistical baseline; adjust with intelligence
- Track who makes adjustments and whether they improve accuracy
- Keep adjustment reasons documented
- Review forecast value add (did human adjustments help or hurt?)

Don't:
- Let politics override data
- Accept "stretch targets" as forecasts
- Ignore statistical signals in favor of gut feel
- Adjust forecasts without documented rationale
```

## Forecast Accuracy Metrics

### Key Formulas

```text
MAPE (Mean Absolute Percentage Error):
  MAPE = (1/n) x SUM(|Actual - Forecast| / Actual) x 100
  Lower is better. <10% is excellent, 10-20% is good.

Weighted MAPE (for product mix):
  wMAPE = SUM(|Actual - Forecast|) / SUM(Actual) x 100
  Better for products with varying volumes.

Bias (Tracking Signal):
  Bias = SUM(Actual - Forecast) / SUM(|Actual - Forecast|)
  Range: -1 to +1
  Near 0 = balanced. Positive = under-forecasting. Negative = over-forecasting.

MAD (Mean Absolute Deviation):
  MAD = (1/n) x SUM(|Actual - Forecast|)
  Useful for safety stock calculations.
```

### Accuracy Reporting Template

```markdown
## Forecast Accuracy Report: [Month/Quarter]

### Summary
| Metric | This Period | Last Period | Trend |
|--------|------------|------------|-------|
| MAPE | 15% | 18% | Improving |
| Bias | +0.05 | +0.12 | Improving |
| Items within 20% accuracy | 78% | 72% | Improving |

### By Product Category
| Category | MAPE | Bias | Volume |
|----------|------|------|--------|
| Category A | 8% | -0.02 | 50K |
| Category B | 22% | +0.15 | 20K |
| Category C | 35% | +0.30 | 5K |

### Root Causes of Error
1. [Cause 1]: Unplanned promotion in Category B
2. [Cause 2]: Supplier delay shifted demand to next period
3. [Cause 3]: New product launch exceeded expectations

### Actions
- [ ] Improve promotion calendar integration
- [ ] Add supplier delay adjustment to model
```

## Demand Sensing

### Near-Term Signal Integration

| Signal | Latency | Adjustment Window | Method |
|--------|---------|-------------------|--------|
| POS/sell-through data | Daily | 1-7 days | Proportional adjustment |
| Order pipeline | Real-time | 1-14 days | Direct input |
| Web traffic/search | Daily | 7-21 days | Correlation model |
| Weather forecast | 3-10 days | Product-specific | Regression adjustment |
| Social media trends | Variable | 7-30 days | Sentiment scoring |
| Economic releases | Monthly | 30-90 days | Index adjustment |

### Demand Sensing vs Traditional Forecasting

```text
Traditional Forecasting:
  Monthly buckets → Updated monthly → 1-18 month horizon → Statistical models

Demand Sensing:
  Daily/weekly buckets → Updated daily → 1-6 week horizon → Real-time signals

Use both: Traditional for planning horizon, Sensing for execution horizon
```

## New Product Forecasting

### Methods When No History Exists

| Method | Description | Accuracy |
|--------|-------------|----------|
| Analogous products | Base on similar past launches | Medium |
| Market sizing | TAM → SAM → SOM approach | Low-Medium |
| Test market | Pilot in limited geography | Medium-High |
| Pre-orders/waitlist | Measure actual interest | High |
| Expert judgment | Delphi method with stakeholders | Low-Medium |

### New Product Forecast Template

```markdown
## New Product Forecast: [Product Name]

### Analogous Products
| Product | Launch Year | Y1 Sales | Similarity Score |
|---------|-------------|----------|-----------------|
| [Product A] | 2023 | 50K | High |
| [Product B] | 2024 | 30K | Medium |

### Market Sizing
- TAM: [Total addressable market]
- SAM: [Serviceable addressable market]
- SOM: [Serviceable obtainable market]
- Year 1 Target: [Conservative estimate]

### Assumptions
1. [Assumption 1]
2. [Assumption 2]

### Scenarios
| Scenario | Y1 Units | Confidence |
|----------|----------|------------|
| Pessimistic | [X] | 90% we beat this |
| Base | [Y] | 50% probability |
| Optimistic | [Z] | 10% we reach this |
```

## Common Pitfalls

### 1. Forecasting at the Wrong Level

```markdown
Wrong: Forecast total demand, then allocate to SKUs
Right: Forecast at the level decisions are made (SKU-location for replenishment)
```

### 2. Not Separating Base Demand from Events

```markdown
Wrong: Include promotional spikes in base demand history
Right: Decompose history into base demand + promotional lift + one-time events
```

### 3. Confusing Forecasts with Targets

```markdown
Wrong: "Sales target is $10M so forecast $10M"
Right: "Statistical forecast is $8M; achieving $10M requires these additional actions..."
```

### 4. Ignoring Forecast Uncertainty

```markdown
Wrong: "Forecast is 1,000 units" (point estimate only)
Right: "Forecast is 1,000 units +/- 200 (80% confidence interval)"
```

### 5. Over-Fitting Models to Historical Noise

```markdown
Wrong: Complex model that perfectly fits history but fails on new data
Right: Simple model validated with holdout data; prioritize out-of-sample accuracy
```
