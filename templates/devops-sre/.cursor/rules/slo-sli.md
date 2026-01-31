# SLOs, SLIs, and Error Budgets

Comprehensive guidelines for defining, measuring, and using Service Level Objectives.

## Core Concepts

### Definitions

```yaml
sli:
  name: "Service Level Indicator"
  definition: "A quantitative measure of some aspect of the service"
  characteristics:
    - "Measurable and objective"
    - "Expressed as a ratio or percentage"
    - "Reflects user experience"
  example: "Proportion of requests that complete successfully"

slo:
  name: "Service Level Objective"
  definition: "A target value or range for an SLI"
  characteristics:
    - "Sets expectations for reliability"
    - "Defines acceptable performance"
    - "Basis for error budgets"
  example: "99.9% of requests succeed over a 30-day window"

sla:
  name: "Service Level Agreement"
  definition: "A contract with consequences for missing the SLO"
  characteristics:
    - "External commitment to customers"
    - "Usually less strict than internal SLO"
    - "Has financial/legal implications"
  example: "99.5% availability, credits if breached"

error_budget:
  name: "Error Budget"
  definition: "The allowed amount of unreliability"
  characteristics:
    - "Calculated from SLO (1 - SLO)"
    - "Consumed by incidents and errors"
    - "Balances reliability with velocity"
  example: "0.1% = 43.2 minutes of downtime per month"
```

### The SLO Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     SLA (External)                         │
│   Contractual commitment: 99.5% availability               │
│   Consequence: Service credits if breached                 │
├─────────────────────────────────────────────────────────────┤
│                     SLO (Internal)                         │
│   Target: 99.9% availability                               │
│   Buffer above SLA for safety margin                       │
├─────────────────────────────────────────────────────────────┤
│                     SLI (Measurement)                      │
│   Metric: successful_requests / total_requests             │
│   Measured at the load balancer                            │
└─────────────────────────────────────────────────────────────┘
```

## Choosing Good SLIs

### SLI Categories

```yaml
availability:
  question: "Is the service up and responding?"
  measurement: "Successful requests / Total requests"
  good_for:
    - "APIs and web services"
    - "User-facing applications"
    - "Critical dependencies"
  examples:
    - "HTTP 2xx/3xx responses"
    - "Non-timeout responses"
    - "Valid responses (not error pages)"

latency:
  question: "How fast is the service responding?"
  measurement: "Requests faster than threshold / Total requests"
  good_for:
    - "Real-time applications"
    - "Interactive user experiences"
    - "API response times"
  examples:
    - "Requests < 200ms at p50"
    - "Requests < 1s at p99"
    - "Time to first byte < 500ms"

throughput:
  question: "How much work is being done?"
  measurement: "Work units completed per time period"
  good_for:
    - "Batch processing systems"
    - "Data pipelines"
    - "Message queues"
  examples:
    - "Messages processed per second"
    - "Records transformed per hour"
    - "Jobs completed per day"

correctness:
  question: "Is the service returning correct results?"
  measurement: "Correct responses / Total responses"
  good_for:
    - "Data processing"
    - "Financial calculations"
    - "Search results"
  examples:
    - "Search results with relevant items"
    - "Transactions with correct amounts"
    - "Data exports with valid format"

freshness:
  question: "How current is the data?"
  measurement: "Data age at query time"
  good_for:
    - "Real-time dashboards"
    - "Cache-dependent systems"
    - "Event-driven systems"
  examples:
    - "Data < 5 minutes old"
    - "Index updated within 1 hour"
    - "Cache miss rate < 10%"

durability:
  question: "Is the data safe?"
  measurement: "Data successfully persisted / Data submitted"
  good_for:
    - "Storage systems"
    - "Databases"
    - "Backup systems"
  examples:
    - "Writes acknowledged and durable"
    - "Backup success rate"
    - "Replication lag < threshold"
```

### SLI Specification

```yaml
# Good SLI specification template
sli_specification:
  name: "api_availability"
  description: "Proportion of API requests that succeed"
  
  measurement:
    what: "HTTP requests returning 2xx or 3xx status"
    where: "Measured at the load balancer"
    excludes:
      - "Health check endpoints (/health, /ready)"
      - "Internal endpoints (/metrics, /debug)"
      - "Requests from automated scanners"
    
  calculation: |
    sum(http_requests_total{status=~"2..|3..", endpoint!~"/health|/ready|/metrics"})
    /
    sum(http_requests_total{endpoint!~"/health|/ready|/metrics"})
    
  notes:
    - "4xx errors are counted as success (client errors)"
    - "5xx errors are counted as failures"
    - "Timeouts (no response) counted as failures"
```

## Setting SLO Targets

### How to Choose Targets

```yaml
target_setting_approach:
  step_1_baseline:
    action: "Measure current performance"
    duration: "2-4 weeks of data"
    questions:
      - "What is current availability?"
      - "What is current latency distribution?"
      - "What do users experience today?"
      
  step_2_user_expectations:
    action: "Understand user needs"
    questions:
      - "What reliability do users expect?"
      - "What do competitors offer?"
      - "What does business require?"
      
  step_3_cost_benefit:
    action: "Evaluate reliability vs cost"
    considerations:
      - "Each 9 costs exponentially more"
      - "99.99% requires very different architecture than 99.9%"
      - "Error budget must be usable"
      
  step_4_iterate:
    action: "Start conservative, adjust based on data"
    guidance:
      - "Better to exceed SLO than miss it"
      - "Tighten after consistent achievement"
      - "Loosen if budget is never used"

reliability_cost_reality:
  ninety_percent:
    downtime_per_month: "72 hours"
    effort: "Minimal - basic monitoring"
    
  ninety_nine_percent:
    downtime_per_month: "7.2 hours"
    effort: "Moderate - good practices"
    
  three_nines:
    downtime_per_month: "43 minutes"
    effort: "Significant - redundancy required"
    
  four_nines:
    downtime_per_month: "4.3 minutes"
    effort: "Major - multi-region, auto-failover"
    
  five_nines:
    downtime_per_month: "26 seconds"
    effort: "Extreme - specialized expertise required"
```

### SLO Window Selection

```yaml
window_types:
  rolling:
    description: "Last N days from now"
    example: "99.9% over rolling 30 days"
    pros:
      - "Always current"
      - "Continuous feedback"
      - "No reset-day gaming"
    cons:
      - "Bad day stays in window for full period"
      
  calendar:
    description: "Current calendar period"
    example: "99.9% this month"
    pros:
      - "Aligns with business cycles"
      - "Clean reset for planning"
    cons:
      - "End-of-period gaming possible"
      - "Sudden reset loses context"

recommended_windows:
  short_term: "7 days - for operational alerting"
  standard: "30 days - for SLO tracking"
  long_term: "90 days - for trend analysis"
```

## Error Budgets

### Calculating Error Budgets

```python
# Error budget calculation examples

def calculate_error_budget(slo_target: float, window_days: int) -> dict:
    """Calculate error budget in various units."""
    
    # Error budget as percentage
    error_budget_percent = 1 - slo_target
    
    # Convert to time
    window_minutes = window_days * 24 * 60
    error_budget_minutes = window_minutes * error_budget_percent
    
    # Convert to requests (example: 1M requests/day)
    daily_requests = 1_000_000
    total_requests = daily_requests * window_days
    error_budget_requests = total_requests * error_budget_percent
    
    return {
        "percentage": error_budget_percent,
        "minutes": error_budget_minutes,
        "requests": error_budget_requests,
    }

# Examples:
# 99.9% SLO over 30 days
# = 0.1% error budget
# = 43.2 minutes of downtime
# = 30,000 failed requests (at 1M/day)

# 99% SLO over 30 days  
# = 1% error budget
# = 432 minutes (7.2 hours) of downtime
# = 300,000 failed requests
```

### Error Budget Policy

```yaml
error_budget_policy:
  purpose: "Define actions based on error budget consumption"
  
  thresholds:
    healthy:
      budget_remaining: ">50%"
      development_velocity: "Full speed"
      deployment_frequency: "Normal (daily+)"
      risk_tolerance: "High - experimentation encouraged"
      actions:
        - "Ship new features"
        - "Run experiments"
        - "Accept reasonable risk"
        - "Focus on velocity"
      
    caution:
      budget_remaining: "25-50%"
      development_velocity: "Moderate"
      deployment_frequency: "Normal with extra scrutiny"
      risk_tolerance: "Medium"
      actions:
        - "Review recent reliability trends"
        - "Prioritize reliability improvements"
        - "Extra review for risky changes"
        - "Consider postponing high-risk features"
        
    critical:
      budget_remaining: "10-25%"
      development_velocity: "Reduced"
      deployment_frequency: "Limited to fixes and critical features"
      risk_tolerance: "Low"
      actions:
        - "Feature freeze for non-critical work"
        - "Reliability improvements prioritized"
        - "All changes require reliability review"
        - "Mandatory rollback plans"
        - "Increased monitoring during deploys"
        
    exhausted:
      budget_remaining: "<10%"
      development_velocity: "Minimal"
      deployment_frequency: "Emergency fixes only"
      risk_tolerance: "None"
      actions:
        - "Full feature freeze"
        - "All engineering on reliability"
        - "Post-incident review before any deploy"
        - "Consider service degradation for stability"
        - "Executive escalation"
        
  budget_replenishment:
    note: "Budget replenishes as time passes in rolling window"
    example: "A 30-day window means yesterday's errors age out in 30 days"
```

### Burn Rate Alerting

```yaml
burn_rate_concept:
  definition: "Rate at which error budget is being consumed"
  formula: "actual_error_rate / tolerated_error_rate"
  
  example:
    slo: "99.9% over 30 days"
    tolerated_error_rate: "0.1%"
    actual_error_rate: "0.3%"
    burn_rate: "3x (budget consumed 3x faster than allowed)"
    
multi_window_burn_rate:
  purpose: "Balance between fast detection and noise reduction"
  
  windows:
    fast_burn:
      short_window: "5m"
      long_window: "1h"
      burn_rate: "14.4x"
      budget_consumed: "2% in 1 hour"
      severity: "Page immediately"
      
    medium_burn:
      short_window: "30m"
      long_window: "6h"
      burn_rate: "6x"
      budget_consumed: "5% in 6 hours"
      severity: "Page during business hours"
      
    slow_burn:
      short_window: "2h"
      long_window: "24h"
      burn_rate: "3x"
      budget_consumed: "10% in 24 hours"
      severity: "Ticket"
      
    very_slow_burn:
      short_window: "6h"
      long_window: "3d"
      burn_rate: "1x"
      budget_consumed: "Budget on track to exhaust"
      severity: "Review in standup"

prometheus_burn_rate_rules: |
  # Fast burn - 2% of 30-day budget in 1 hour
  groups:
    - name: slo-burn-rate
      rules:
        - alert: SLOFastBurn
          expr: |
            (
              sum(rate(http_requests_total{status=~"5.."}[5m])) 
              / sum(rate(http_requests_total[5m]))
              > 14.4 * 0.001
            )
            and
            (
              sum(rate(http_requests_total{status=~"5.."}[1h]))
              / sum(rate(http_requests_total[1h]))
              > 14.4 * 0.001
            )
          labels:
            severity: critical
          annotations:
            summary: "SLO burn rate critical - paging"
            
        - alert: SLOMediumBurn
          expr: |
            (
              sum(rate(http_requests_total{status=~"5.."}[30m]))
              / sum(rate(http_requests_total[30m]))
              > 6 * 0.001
            )
            and
            (
              sum(rate(http_requests_total{status=~"5.."}[6h]))
              / sum(rate(http_requests_total[6h]))
              > 6 * 0.001
            )
          labels:
            severity: warning
          annotations:
            summary: "SLO burn rate elevated"
```

## SLO Examples by Service Type

### API Service SLOs

```yaml
api_service_slos:
  availability:
    sli: "Proportion of non-5xx responses"
    target: "99.9%"
    window: "30 days rolling"
    measurement: |
      sum(rate(http_requests_total{status!~"5.."}[5m]))
      / sum(rate(http_requests_total[5m]))
      
  latency_p50:
    sli: "Median response time under threshold"
    target: "99%"
    threshold: "100ms"
    window: "30 days rolling"
    
  latency_p99:
    sli: "99th percentile response time under threshold"
    target: "99%"
    threshold: "500ms"
    window: "30 days rolling"
```

### Database SLOs

```yaml
database_slos:
  availability:
    sli: "Proportion of successful queries"
    target: "99.99%"
    window: "30 days rolling"
    
  read_latency:
    sli: "Read queries under latency threshold"
    target: "99%"
    threshold: "50ms at p99"
    
  write_latency:
    sli: "Write queries under latency threshold"
    target: "99%"
    threshold: "100ms at p99"
    
  replication_lag:
    sli: "Replica within lag threshold"
    target: "99.9%"
    threshold: "1 second"
```

### Batch Processing SLOs

```yaml
batch_processing_slos:
  completeness:
    sli: "Jobs completing successfully"
    target: "99%"
    window: "7 days rolling"
    
  timeliness:
    sli: "Jobs completing within SLA"
    target: "95%"
    threshold: "Job completes within 2x expected duration"
    
  freshness:
    sli: "Data processed within freshness requirement"
    target: "99%"
    threshold: "Data no more than 1 hour old"
```

## SLO Dashboard Design

### Essential Dashboard Elements

```yaml
slo_dashboard_sections:
  summary:
    - "Current SLO status (meeting/at risk/breaching)"
    - "Error budget remaining (percentage and time)"
    - "Burn rate trend"
    
  detailed_metrics:
    - "SLI value over time"
    - "Error budget consumption over time"
    - "Burn rate over time"
    
  context:
    - "Recent incidents affecting SLO"
    - "Recent deployments"
    - "Traffic patterns"
    
  historical:
    - "SLO achievement by month"
    - "Error budget consumption by cause"
    - "Trend analysis"

grafana_panel_examples:
  current_slo_status: |
    # Stat panel showing current SLI
    100 * (
      sum(rate(http_requests_total{status!~"5.."}[30d]))
      / sum(rate(http_requests_total[30d]))
    )
    
  error_budget_remaining: |
    # Gauge showing budget remaining
    1 - (
      sum(increase(http_requests_total{status=~"5.."}[30d]))
      / (sum(increase(http_requests_total[30d])) * 0.001)
    )
    
  burn_rate: |
    # Graph showing burn rate over time
    (
      sum(rate(http_requests_total{status=~"5.."}[1h]))
      / sum(rate(http_requests_total[1h]))
    ) / 0.001
```

## Common Pitfalls

### SLI Pitfalls

```yaml
pitfall_measuring_wrong_thing:
  wrong: "Server thinks request succeeded"
  right: "User actually got the response they needed"
  example: "Measure at the edge, not just the server"

pitfall_excluding_too_much:
  wrong: "Exclude retries, certain error codes, specific endpoints"
  right: "Measure what users experience"
  note: "If users see it, it counts"

pitfall_internal_metrics:
  wrong: "CPU usage, memory usage, queue depth"
  right: "Request success rate, latency, user-visible outcomes"
  note: "Internal metrics are useful but not SLIs"
```

### SLO Pitfalls

```yaml
pitfall_100_percent:
  wrong: "Our SLO is 100% availability"
  right: "Our SLO is 99.9% availability with clear error budget"
  reason: "100% is unachievable and prevents any change"

pitfall_too_many_slos:
  wrong: "50 SLOs covering every metric"
  right: "3-5 SLOs covering critical user journeys"
  reason: "Too many SLOs means none are meaningful"

pitfall_slo_without_teeth:
  wrong: "We have SLOs but nothing happens when we miss them"
  right: "Error budget policy drives real decisions"
  reason: "SLOs without consequences are just reports"
```

### Error Budget Pitfalls

```yaml
pitfall_budget_as_target:
  wrong: "We must use all our error budget"
  right: "Error budget is a limit, not a goal"
  
pitfall_hoarding_budget:
  wrong: "Never deploy because we might use error budget"
  right: "Use budget to enable velocity and experimentation"
  
pitfall_ignoring_budget:
  wrong: "Budget is exhausted but we keep shipping"
  right: "Follow error budget policy strictly"
```
