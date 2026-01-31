# Capacity Planning

Comprehensive guidelines for planning, testing, and scaling system capacity.

## Core Principles

1. **Measure First** - Base capacity decisions on data, not guesses
2. **Plan Ahead** - Provision for growth before you need it
3. **Test Limits** - Know your breaking points before users find them
4. **Right-Size** - Neither over-provision (waste) nor under-provision (outage)

## Capacity Dimensions

### Resource Types

```yaml
compute:
  metrics:
    - "cpu_utilization_percent"
    - "memory_utilization_percent"
    - "pod_count"
    - "node_count"
  scaling:
    vertical: "Larger instances"
    horizontal: "More instances"
  planning_factors:
    - "Request processing requirements"
    - "Background job load"
    - "Peak vs average usage"

storage:
  metrics:
    - "disk_usage_percent"
    - "iops_utilization"
    - "throughput_mbps"
    - "latency_ms"
  scaling:
    vertical: "Faster/larger disks"
    horizontal: "Sharding, distribution"
  planning_factors:
    - "Data growth rate"
    - "Retention requirements"
    - "Backup storage"

network:
  metrics:
    - "bandwidth_utilization"
    - "packet_rate"
    - "connection_count"
    - "latency_ms"
  scaling:
    vertical: "Faster network"
    horizontal: "Multiple paths"
  planning_factors:
    - "Traffic patterns"
    - "Geographic distribution"
    - "External API calls"

database:
  metrics:
    - "connection_pool_usage"
    - "query_latency_p99"
    - "transactions_per_second"
    - "replication_lag"
  scaling:
    vertical: "Larger instance"
    horizontal: "Read replicas, sharding"
  planning_factors:
    - "Query complexity"
    - "Data volume"
    - "Read/write ratio"
```

### Capacity Thresholds

```yaml
threshold_definitions:
  nominal:
    range: "0-60%"
    status: "Healthy operation"
    action: "Monitor"
    
  elevated:
    range: "60-75%"
    status: "Above normal"
    action: "Plan scaling"
    
  warning:
    range: "75-85%"
    status: "Approaching limits"
    action: "Scale soon"
    alert: "Warning severity"
    
  critical:
    range: "85-95%"
    status: "Near capacity"
    action: "Scale immediately"
    alert: "Critical severity"
    
  saturated:
    range: "95-100%"
    status: "At capacity"
    action: "Emergency scaling"
    impact: "Performance degradation likely"

resource_specific_thresholds:
  cpu:
    warning: 75%
    critical: 85%
    note: "Sustained high CPU causes latency"
    
  memory:
    warning: 80%
    critical: 90%
    note: "OOM kills happen above 90%"
    
  disk:
    warning: 80%
    critical: 90%
    note: "Leave space for operations, logs"
    
  connections:
    warning: 70%
    critical: 85%
    note: "Connection storms can spike quickly"
```

## Load Testing

### Testing Types

```yaml
smoke_test:
  purpose: "Verify system handles minimal load"
  duration: "5-10 minutes"
  load: "10-20 concurrent users"
  when: "Every deployment"
  success_criteria:
    - "No errors"
    - "Response times normal"
    - "All endpoints accessible"

load_test:
  purpose: "Verify system handles expected load"
  duration: "30-60 minutes"
  load: "Expected peak * 1.5"
  when: "Weekly, before releases"
  success_criteria:
    - "Error rate < 1%"
    - "P99 latency within SLO"
    - "No resource saturation"

stress_test:
  purpose: "Find breaking point"
  duration: "Until failure"
  load: "Ramp up continuously"
  when: "Monthly, architecture changes"
  success_criteria:
    - "Identify failure point"
    - "Graceful degradation"
    - "Recovery after load removed"

soak_test:
  purpose: "Find issues over time"
  duration: "24-72 hours"
  load: "Expected average"
  when: "Before major releases"
  success_criteria:
    - "No memory leaks"
    - "No connection leaks"
    - "Performance stable over time"

spike_test:
  purpose: "Verify handling of sudden load"
  duration: "30 minutes"
  load: "Sudden 10x spike"
  when: "Before events, campaigns"
  success_criteria:
    - "Autoscaling responds"
    - "No cascading failures"
    - "Recovery after spike"
```

### k6 Load Testing

```javascript
// load-test.js - k6 load test example
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up
    { duration: '10m', target: 100 },   // Stay at peak
    { duration: '2m', target: 200 },    // Spike
    { duration: '5m', target: 200 },    // Sustained spike
    { duration: '2m', target: 100 },    // Return to normal
    { duration: '5m', target: 100 },    // Sustained normal
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

export default function () {
  // Simulate user flow
  
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check passed': (r) => r.status === 200,
  });

  // 2. List items (most common operation)
  const listRes = http.get(`${BASE_URL}/api/v1/items`, {
    headers: { 'Authorization': `Bearer ${__ENV.API_TOKEN}` },
  });
  
  check(listRes, {
    'list items succeeded': (r) => r.status === 200,
    'list returned data': (r) => JSON.parse(r.body).data.length > 0,
  });
  
  errorRate.add(listRes.status !== 200);
  apiDuration.add(listRes.timings.duration);

  // 3. Get single item (simulate user clicking)
  if (listRes.status === 200) {
    const items = JSON.parse(listRes.body).data;
    const itemId = items[Math.floor(Math.random() * items.length)].id;
    
    const itemRes = http.get(`${BASE_URL}/api/v1/items/${itemId}`, {
      headers: { 'Authorization': `Bearer ${__ENV.API_TOKEN}` },
    });
    
    check(itemRes, {
      'get item succeeded': (r) => r.status === 200,
    });
    
    errorRate.add(itemRes.status !== 200);
  }

  // Think time between requests
  sleep(Math.random() * 3 + 1);
}

// Summary output
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Running Load Tests

```yaml
load_test_process:
  preparation:
    - "Notify stakeholders"
    - "Ensure monitoring is active"
    - "Verify test environment matches production"
    - "Prepare rollback plan if testing production"
    
  execution:
    - "Start with smoke test"
    - "Gradually increase load"
    - "Monitor dashboards during test"
    - "Collect metrics and screenshots"
    
  analysis:
    - "Compare results to baseline"
    - "Identify bottlenecks"
    - "Document findings"
    - "Create action items"

k6_commands:
  smoke_test: |
    k6 run --vus 10 --duration 5m load-test.js
    
  load_test: |
    k6 run load-test.js
    
  stress_test: |
    k6 run --vus 500 --duration 30m load-test.js
    
  with_output: |
    k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 load-test.js
```

## Scaling Strategies

### Horizontal vs Vertical

```yaml
horizontal_scaling:
  description: "Add more instances"
  pros:
    - "No downtime for scaling"
    - "Better fault tolerance"
    - "Theoretically unlimited"
  cons:
    - "Application must be stateless"
    - "More complex architecture"
    - "Coordination overhead"
  best_for:
    - "Stateless web servers"
    - "API services"
    - "Workers/processors"
    
vertical_scaling:
  description: "Make instances bigger"
  pros:
    - "Simple implementation"
    - "Works with stateful apps"
    - "No architecture changes"
  cons:
    - "Hard limits on instance size"
    - "Usually requires downtime"
    - "Single point of failure"
  best_for:
    - "Databases"
    - "Legacy applications"
    - "Quick fixes"
```

### Kubernetes Autoscaling

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 50
  
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
          
    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
          
    # Custom metrics (requests per second)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
          
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
        - type: Percent
          value: 10               # Scale down 10% at a time
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0    # Scale up immediately
      policies:
        - type: Percent
          value: 100              # Can double
          periodSeconds: 15
        - type: Pods
          value: 4                # Or add 4 pods
          periodSeconds: 15
      selectPolicy: Max
```

### Database Scaling

```yaml
read_replicas:
  when: "Read-heavy workload"
  approach:
    - "Primary handles writes"
    - "Replicas handle reads"
    - "Application routes queries"
  considerations:
    - "Replication lag"
    - "Consistency requirements"
    - "Connection pooling"
    
connection_pooling:
  when: "Connection limits reached"
  tools:
    - "PgBouncer (PostgreSQL)"
    - "ProxySQL (MySQL)"
  benefits:
    - "Multiplexes connections"
    - "Reduces database load"
    - "Handles connection storms"
    
sharding:
  when: "Data too large for single instance"
  strategies:
    - "Hash-based: Distribute by user_id % N"
    - "Range-based: Data by date ranges"
    - "Geography-based: Data by region"
  considerations:
    - "Cross-shard queries are complex"
    - "Rebalancing is difficult"
    - "Application complexity increases"
```

## Capacity Forecasting

### Data Collection

```yaml
metrics_to_track:
  traffic:
    - "requests_per_second"
    - "active_users"
    - "daily_active_users"
    - "monthly_active_users"
    
  resources:
    - "cpu_utilization"
    - "memory_utilization"
    - "disk_usage"
    - "network_throughput"
    
  business:
    - "new_signups"
    - "transactions"
    - "data_ingestion_rate"

historical_analysis:
  timeframes:
    - "Daily patterns (peak hours)"
    - "Weekly patterns (weekday vs weekend)"
    - "Monthly patterns (billing cycles)"
    - "Yearly patterns (seasonal)"
    
  identify:
    - "Growth trends"
    - "Cyclical patterns"
    - "Anomalies"
    - "Correlation with business metrics"
```

### Forecasting Methods

```yaml
linear_projection:
  description: "Simple trend extrapolation"
  formula: "future_usage = current + (growth_rate * time)"
  good_for: "Steady, predictable growth"
  example: |
    Current: 1000 requests/sec
    Growth: 10% per month
    In 6 months: 1000 * (1.1^6) = 1771 requests/sec
    
exponential_growth:
  description: "Compound growth projection"
  formula: "future = current * (1 + rate)^periods"
  good_for: "Rapidly growing services"
  warning: "Can overestimate"
  
event_based:
  description: "Specific events that drive load"
  examples:
    - "Marketing campaign: +50% traffic"
    - "Product launch: +100% traffic"
    - "Holiday season: +200% traffic"
  approach: "Add event-based capacity on top of baseline"
```

### Capacity Planning Process

```yaml
quarterly_planning:
  step_1_review:
    - "Analyze last quarter's usage"
    - "Compare forecast vs actual"
    - "Identify forecast errors"
    
  step_2_forecast:
    - "Project next quarter growth"
    - "Account for known events"
    - "Add safety margin (20-50%)"
    
  step_3_capacity:
    - "Map usage to resource requirements"
    - "Identify bottlenecks"
    - "Plan scaling actions"
    
  step_4_budget:
    - "Calculate infrastructure costs"
    - "Compare with reserved instances"
    - "Get budget approval"
    
  step_5_execute:
    - "Schedule capacity additions"
    - "Test new capacity"
    - "Monitor after scaling"

capacity_buffer:
  purpose: "Headroom for unexpected growth"
  typical_values:
    normal: "20% above projected peak"
    critical_services: "50% above projected peak"
    before_events: "100% above normal capacity"
```

## Cost Optimization

### Right-Sizing

```yaml
right_sizing_process:
  identify_waste:
    - "Instances with < 20% CPU utilization"
    - "Over-provisioned memory"
    - "Unused reserved capacity"
    
  analyze:
    - "Peak vs average usage"
    - "Scaling patterns"
    - "Cost per request"
    
  optimize:
    - "Downsize underutilized instances"
    - "Use autoscaling instead of static"
    - "Consider spot/preemptible instances"

instance_selection:
  compute_optimized:
    when: "CPU-bound workloads"
    examples: "c5, c6i instances"
    
  memory_optimized:
    when: "Memory-bound workloads"
    examples: "r5, r6i instances"
    
  general_purpose:
    when: "Balanced workloads"
    examples: "m5, m6i instances"
    
  burstable:
    when: "Low baseline, occasional spikes"
    examples: "t3, t4g instances"
```

### Cost Efficiency Metrics

```yaml
cost_metrics:
  cost_per_request:
    formula: "monthly_cost / monthly_requests"
    target: "Should decrease over time (efficiency)"
    
  cost_per_user:
    formula: "monthly_cost / monthly_active_users"
    target: "Should be stable or decreasing"
    
  utilization_efficiency:
    formula: "actual_usage / provisioned_capacity"
    target: "60-80% (leaves headroom)"
    
  reserved_coverage:
    formula: "reserved_capacity / baseline_usage"
    target: "70-80% of baseline on reserved"
```

### Reserved vs On-Demand

```yaml
capacity_mix:
  reserved:
    coverage: "60-70% of baseline"
    discount: "30-60% vs on-demand"
    commitment: "1-3 years"
    use_for: "Steady-state workloads"
    
  on_demand:
    coverage: "Peak above baseline"
    discount: "None"
    commitment: "None"
    use_for: "Variable/spiky workloads"
    
  spot_preemptible:
    coverage: "Fault-tolerant workloads"
    discount: "60-90% vs on-demand"
    commitment: "None (can be terminated)"
    use_for: "Batch jobs, stateless workers"
    
strategy: |
  Base load: Reserved instances (predictable cost)
  Normal peaks: On-demand (flexibility)
  Batch/background: Spot instances (cost savings)
  Emergency: On-demand ready to scale
```

## Common Pitfalls

```yaml
pitfall_planning_for_average:
  problem: "Provisioning for average load"
  impact: "Outages during peaks"
  solution: "Plan for peak + headroom"

pitfall_ignoring_dependencies:
  problem: "Scaling service but not database"
  impact: "Database becomes bottleneck"
  solution: "Consider all dependencies when scaling"

pitfall_no_testing:
  problem: "Assuming capacity without testing"
  impact: "Surprises under real load"
  solution: "Regular load testing to validate"

pitfall_sudden_scaling:
  problem: "Scaling from 10 to 100 instances instantly"
  impact: "Thundering herd, cold cache"
  solution: "Scale gradually, warm caches"

pitfall_cost_blindness:
  problem: "Scaling without considering cost"
  impact: "Surprise cloud bills"
  solution: "Monitor cost metrics alongside performance"
```
