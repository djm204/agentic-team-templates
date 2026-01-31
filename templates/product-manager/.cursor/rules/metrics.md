# Product Metrics

Guidelines for defining, tracking, and acting on product metrics.

## Metrics Hierarchy

### North Star Metric

The single metric that best captures the core value your product delivers to customers.

```text
North Star Metric
├── Input Metrics (leading indicators you can influence)
│   ├── Activation rate
│   ├── Feature adoption
│   └── Engagement frequency
└── Output Metrics (lagging indicators that result)
    ├── Retention
    ├── Revenue
    └── Customer satisfaction
```

### Examples by Business Model

| Model | North Star | Input Metrics |
|-------|------------|---------------|
| SaaS | Weekly Active Users | Activation, Feature Adoption |
| Marketplace | Transactions | Listings, Buyer Visits |
| E-commerce | Revenue | Traffic, Conversion, AOV |
| Consumer App | Daily Active Users | Session Length, Features Used |
| B2B Platform | Active Accounts | Users per Account, API Calls |

## OKRs (Objectives and Key Results)

### Structure

```text
Objective: [Qualitative, inspiring, time-bound]
├── KR1: [Metric] - Baseline: X → Target: Y
├── KR2: [Metric] - Baseline: X → Target: Y
└── KR3: [Metric] - Baseline: X → Target: Y
```

### OKR Best Practices

| Practice | Rationale |
|----------|-----------|
| 3-5 Objectives per quarter | Focus enables execution |
| 2-4 Key Results per Objective | Measurable, not task lists |
| 70% achievement = success | Stretch goals drive innovation |
| Outcomes, not outputs | "Reduce churn to 5%" not "Launch retention feature" |
| Weekly check-ins | Track progress, identify blockers early |

### OKR Examples

**Good:**
```text
Objective: Become the preferred tool for enterprise teams

KR1: Increase enterprise NPS from 32 to 50
KR2: Reduce time-to-first-value from 14 days to 3 days
KR3: Grow enterprise accounts from 50 to 150
```

**Bad:**
```text
Objective: Build enterprise features

KR1: Launch SSO
KR2: Build admin dashboard
KR3: Create 10 case studies
```
(These are outputs/tasks, not measurable outcomes)

### OKR Scoring

| Score | Interpretation |
|-------|----------------|
| 0.0-0.3 | Failed to make progress |
| 0.4-0.6 | Made progress but fell short |
| 0.7-0.9 | Hit our stretch goal |
| 1.0 | Achieved everything (goal may have been too easy) |

## Pirate Metrics (AARRR)

### Framework

| Stage | Question | Example Metrics |
|-------|----------|-----------------|
| **A**cquisition | How do users find us? | Traffic, CAC, Channel Performance |
| **A**ctivation | Do users have a great first experience? | Signup Rate, Onboarding Completion |
| **R**etention | Do users come back? | D1/D7/D30 Retention, Churn Rate |
| **R**evenue | How do we make money? | ARPU, LTV, Conversion to Paid |
| **R**eferral | Do users tell others? | NPS, Viral Coefficient, Referrals |

### Funnel Analysis

```text
Visitors    →  Signups    →  Activated  →  Retained   →  Paid
100,000        10,000         6,000         4,000         1,000
         10%          60%          67%           25%
```

### Identifying Funnel Problems

| Pattern | Diagnosis | Focus Area |
|---------|-----------|------------|
| Low visitor-to-signup | Messaging/positioning issue | Acquisition |
| Low signup-to-activated | Onboarding friction | Activation |
| Low activated-to-retained | Core value not delivered | Product/Value |
| Low retained-to-paid | Pricing or value perception | Monetization |

## Metric Definitions

### Retention Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| D1 Retention | Users active on Day 1 / New users | Early activation signal |
| D7 Retention | Users active on Day 7 / New users | Short-term retention |
| D30 Retention | Users active on Day 30 / New users | Medium-term retention |
| Weekly Retention | Users active this week / Users active last week | Cohort health |
| Logo Churn | Accounts lost / Total accounts | B2B health |
| Revenue Churn | MRR lost / Total MRR | Revenue health |
| Net Revenue Retention | (Start MRR + Expansion - Churn) / Start MRR | Growth efficiency |

### Engagement Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| DAU/MAU | Daily Active / Monthly Active | Stickiness |
| Session Length | Time in app per session | Depth of engagement |
| Sessions per Day | Sessions / DAU | Frequency |
| Feature Adoption | Users using feature / Total users | Feature success |
| Time to Value | Time from signup to "aha moment" | Onboarding efficiency |

### Revenue Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| MRR | Monthly recurring revenue | Revenue health |
| ARR | MRR × 12 | Annual planning |
| ARPU | Revenue / Users | Revenue efficiency |
| LTV | ARPU × Average lifetime | Customer value |
| CAC | Acquisition cost / New customers | Acquisition efficiency |
| LTV:CAC | LTV / CAC | Unit economics (target: 3:1+) |

## Instrumentation Standards

### Event Naming Convention

```text
object_action

Examples:
- user_signed_up
- feature_used
- subscription_upgraded
- report_exported
```

### Event Properties

```javascript
analytics.track('feature_used', {
  // Required
  feature_name: 'search',
  timestamp: '2025-01-28T12:00:00Z',
  
  // User context
  user_id: '123',
  account_id: 'abc',
  user_role: 'admin',
  
  // Session context
  session_id: 'xyz',
  platform: 'web',
  
  // Feature-specific
  query: 'product roadmap',
  results_count: 15,
  time_to_results_ms: 234
});
```

### Standard Events to Track

| Event | When to Fire | Key Properties |
|-------|--------------|----------------|
| `user_signed_up` | Registration complete | signup_method, referrer |
| `user_activated` | Completed activation criteria | time_to_activate |
| `feature_used` | Core feature interaction | feature_name, context |
| `upgrade_started` | Began upgrade flow | plan_from, plan_to |
| `upgrade_completed` | Payment successful | plan, revenue |
| `support_contacted` | Reached out for help | channel, topic |

## Dashboards

### Executive Dashboard

```text
┌─────────────────────────────────────────────────────────┐
│ NORTH STAR: Weekly Active Users                         │
│ ████████████████████████░░░░░░  45,000 / 50,000 (90%)  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────┐
│ Revenue                 │ Retention               │
│ MRR: $125K (+8%)        │ D30: 42% (+3pp)        │
│ ARR: $1.5M              │ Churn: 4.2% (-0.5pp)   │
└─────────────────────────┴─────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ OKR Progress                                            │
│ Q1 Obj 1: ████████░░ 80%                               │
│ Q1 Obj 2: █████░░░░░ 50%                               │
│ Q1 Obj 3: ███████░░░ 70%                               │
└─────────────────────────────────────────────────────────┘
```

### Product Dashboard

```text
┌─────────────────────────────────────────────────────────┐
│ Funnel (Last 7 Days)                                    │
│ Visitors → Signups → Activated → Retained → Paid       │
│ 100K    →  10K    →   6K      →   4K     → 1K         │
│          10%       60%         67%        25%          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────┐
│ Feature Adoption        │ Recent Experiments      │
│ Search: 78%             │ New onboarding: +12%    │
│ Export: 45%             │ Pricing test: -3%       │
│ Integrations: 23%       │ Dark mode: neutral      │
└─────────────────────────┴─────────────────────────┘
```

## Experimentation

### A/B Test Framework

```markdown
## Experiment: [Name]

### Hypothesis
If we [change], then [metric] will [improve/decrease] because [reason].

### Metrics
- Primary: [Metric to optimize]
- Secondary: [Metrics to monitor]
- Guardrails: [Metrics that shouldn't regress]

### Variants
- Control: [Current experience]
- Treatment: [New experience]

### Sample Size & Duration
- Minimum detectable effect: [X%]
- Required sample: [N users per variant]
- Estimated duration: [X weeks]

### Results
| Metric | Control | Treatment | Lift | Significance |
|--------|---------|-----------|------|--------------|
| Primary | X | Y | +Z% | p < 0.05 |

### Decision
[Ship / Iterate / Kill] - [Reasoning]
```

### Statistical Significance

| Confidence Level | When to Use |
|------------------|-------------|
| 90% | Exploratory tests, low-risk changes |
| 95% | Standard product decisions |
| 99% | High-stakes changes, revenue impact |

### Experiment Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Peeking | Stopping early inflates false positives | Set duration upfront, stick to it |
| Multiple testing | Increases false positive rate | Adjust for multiple comparisons |
| Underpowered | Can't detect real effects | Calculate sample size before starting |
| Metric gaming | Optimizing wrong behavior | Include guardrail metrics |

## Metric Reviews

### Weekly Metrics Review

```markdown
## Weekly Metrics Review: [Date]

### North Star
- Current: [Value]
- WoW Change: [+/-X%]
- Status: [On Track / At Risk / Off Track]

### Key Changes
1. [Metric 1] [increased/decreased] by [X%] because [reason]
2. [Metric 2] [increased/decreased] by [X%] because [reason]

### Experiments Update
- [Experiment 1]: [Status] - [Key finding]
- [Experiment 2]: [Status] - [Key finding]

### Actions
- [ ] [Action item 1] - Owner: [Name]
- [ ] [Action item 2] - Owner: [Name]
```

### Monthly Metrics Deep Dive

- Cohort analysis: How are different user groups performing?
- Segment analysis: Which segments are growing/shrinking?
- Feature impact: How did recent launches affect metrics?
- Competitive benchmarking: How do we compare to industry?
