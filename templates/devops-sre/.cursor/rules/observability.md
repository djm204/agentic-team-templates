# Observability

Comprehensive guidelines for implementing metrics, logs, traces, and alerting.

## Core Principles

1. **Three Pillars** - Metrics, logs, and traces together provide complete visibility
2. **User-Centric** - Measure what matters to users, not just infrastructure
3. **Actionable Data** - Every dashboard and alert should drive action
4. **Correlation** - Connect signals across the stack for faster debugging

## The Three Pillars

### Metrics

```yaml
metrics_overview:
  purpose: "Numerical measurements over time"
  good_for:
    - "Trends and patterns"
    - "Alerting on thresholds"
    - "Capacity planning"
    - "SLO tracking"
  not_good_for:
    - "Understanding why something failed"
    - "Request-level debugging"
    
metric_types:
  counter:
    description: "Cumulative value that only increases"
    examples:
      - "http_requests_total"
      - "errors_total"
      - "bytes_sent_total"
    usage: "Rate of change, totals over time"
    
  gauge:
    description: "Value that can go up or down"
    examples:
      - "temperature_celsius"
      - "queue_depth"
      - "active_connections"
    usage: "Current state, point-in-time values"
    
  histogram:
    description: "Distribution of values in buckets"
    examples:
      - "http_request_duration_seconds"
      - "response_size_bytes"
    usage: "Percentiles, distribution analysis"
    
  summary:
    description: "Pre-calculated percentiles"
    examples:
      - "request_latency_quantiles"
    usage: "When you need exact percentiles, not histograms"
```

### Logs

```yaml
logs_overview:
  purpose: "Discrete events with context"
  good_for:
    - "Debugging specific issues"
    - "Audit trails"
    - "Understanding what happened"
    - "Request tracing"
  not_good_for:
    - "Aggregate trends"
    - "Real-time alerting at scale"
    
structured_logging:
  format: "JSON"
  benefits:
    - "Machine parseable"
    - "Consistent fields"
    - "Easy to query"
    - "Extensible"
    
  required_fields:
    - timestamp: "ISO 8601 format"
    - level: "debug, info, warn, error"
    - message: "Human-readable description"
    - service: "Service name"
    - trace_id: "Distributed trace ID"
    
  example: |
    {
      "timestamp": "2025-01-15T14:30:45.123Z",
      "level": "error",
      "message": "Failed to process payment",
      "service": "payment-service",
      "trace_id": "abc123def456",
      "span_id": "789xyz",
      "user_id": "user_12345",
      "payment_id": "pay_67890",
      "error": {
        "type": "PaymentDeclinedException",
        "message": "Insufficient funds",
        "code": "INSUFFICIENT_FUNDS"
      },
      "duration_ms": 234
    }
```

### Traces

```yaml
traces_overview:
  purpose: "Request flow across services"
  good_for:
    - "Understanding distributed systems"
    - "Finding bottlenecks"
    - "Debugging latency issues"
    - "Service dependency mapping"
  not_good_for:
    - "Aggregate metrics"
    - "Long-term trend analysis"
    
trace_concepts:
  trace:
    description: "End-to-end request journey"
    contains: "Multiple spans"
    
  span:
    description: "Single operation within a trace"
    attributes:
      - "Operation name"
      - "Start/end time"
      - "Status"
      - "Tags/attributes"
      
  context_propagation:
    description: "Passing trace context between services"
    headers:
      - "traceparent (W3C)"
      - "X-B3-TraceId (Zipkin)"
      
opentelemetry_example: |
  import { trace } from '@opentelemetry/api';
  
  const tracer = trace.getTracer('payment-service');
  
  async function processPayment(request) {
    return tracer.startActiveSpan('processPayment', async (span) => {
      try {
        span.setAttribute('payment.amount', request.amount);
        span.setAttribute('payment.currency', request.currency);
        
        // Downstream calls automatically get trace context
        const result = await paymentGateway.charge(request);
        
        span.setAttribute('payment.status', 'success');
        return result;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    });
  }
```

## The Four Golden Signals

```yaml
golden_signals:
  latency:
    description: "Time to service a request"
    why_important: "Users notice slow responses"
    what_to_measure:
      - "Successful request latency"
      - "Failed request latency (often faster!)"
      - "Percentiles (p50, p90, p95, p99)"
    metrics:
      - "http_request_duration_seconds (histogram)"
    alerts:
      - "p50 > 200ms"
      - "p99 > 1s"
      
  traffic:
    description: "Demand on the system"
    why_important: "Context for other metrics"
    what_to_measure:
      - "Requests per second"
      - "Concurrent users"
      - "Transactions per second"
    metrics:
      - "http_requests_total (counter)"
    alerts:
      - "Traffic drop > 50% (possible outage)"
      - "Traffic spike > 200% (possible attack/event)"
      
  errors:
    description: "Rate of failed requests"
    why_important: "Direct user impact"
    what_to_measure:
      - "HTTP 5xx rate"
      - "Application errors"
      - "Timeout rate"
    metrics:
      - "http_requests_total{status=~'5..'}"
    alerts:
      - "Error rate > 1%"
      - "Error rate > 5% (critical)"
      
  saturation:
    description: "How full the system is"
    why_important: "Predicts future problems"
    what_to_measure:
      - "CPU utilization"
      - "Memory utilization"
      - "Disk I/O"
      - "Network bandwidth"
      - "Connection pools"
    metrics:
      - "process_cpu_seconds_total"
      - "process_resident_memory_bytes"
    alerts:
      - "CPU > 80%"
      - "Memory > 85%"
      - "Disk > 90%"
```

## Metrics Best Practices

### Naming Conventions

```yaml
prometheus_naming:
  format: "{namespace}_{subsystem}_{name}_{unit}"
  
  examples:
    good:
      - "http_requests_total"
      - "http_request_duration_seconds"
      - "process_cpu_seconds_total"
      - "node_memory_bytes"
      
    bad:
      - "requests" # Too vague
      - "httpRequestsTotal" # Wrong case
      - "request_time_ms" # Use base units
      
  units:
    - "seconds (not milliseconds)"
    - "bytes (not kilobytes)"
    - "Use _total suffix for counters"

label_best_practices:
  do:
    - "Use labels for dimensions (status, method, path)"
    - "Keep cardinality bounded"
    - "Use consistent label names"
    
  dont:
    - "User IDs as labels (unbounded cardinality)"
    - "Request IDs as labels"
    - "High-cardinality values (URLs with IDs)"
    
  cardinality_guidelines:
    low: "< 10 values (method: GET, POST, etc.)"
    medium: "< 100 values (endpoint paths)"
    high: "> 100 values (AVOID - causes performance issues)"
```

### RED Method (Request-Driven)

```yaml
red_method:
  description: "For request-driven services"
  
  rate:
    what: "Requests per second"
    metric: "rate(http_requests_total[5m])"
    
  errors:
    what: "Failed requests per second"
    metric: "rate(http_requests_total{status=~'5..'}[5m])"
    
  duration:
    what: "Distribution of request latency"
    metric: "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
```

### USE Method (Resource-Driven)

```yaml
use_method:
  description: "For infrastructure resources"
  
  utilization:
    what: "Percentage of resource used"
    examples:
      - "CPU: 100 - (avg(irate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)"
      - "Memory: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes"
      - "Disk: node_filesystem_avail_bytes / node_filesystem_size_bytes"
      
  saturation:
    what: "Amount of work queued"
    examples:
      - "CPU: node_load1 / count(node_cpu_seconds_total{mode='idle'})"
      - "Disk: rate(node_disk_io_time_weighted_seconds_total[5m])"
      
  errors:
    what: "Error events"
    examples:
      - "Disk: rate(node_disk_read_errors_total[5m])"
      - "Network: rate(node_network_receive_errs_total[5m])"
```

## Logging Best Practices

### Log Levels

```yaml
log_levels:
  debug:
    when: "Detailed diagnostic information"
    examples:
      - "Function entry/exit"
      - "Variable values"
      - "SQL queries"
    production: "Usually disabled"
    
  info:
    when: "Normal operations worth noting"
    examples:
      - "Service started"
      - "Request processed"
      - "Configuration loaded"
    production: "Enabled"
    
  warn:
    when: "Something unexpected but recoverable"
    examples:
      - "Retry attempted"
      - "Deprecation warning"
      - "Resource approaching limit"
    production: "Enabled, may alert"
    
  error:
    when: "Something failed that shouldn't have"
    examples:
      - "Request failed"
      - "External service error"
      - "Unhandled exception"
    production: "Enabled, often alerts"
```

### What to Log

```yaml
always_log:
  - "Service startup/shutdown"
  - "Configuration changes"
  - "Authentication events"
  - "Authorization failures"
  - "External service calls (start, end, errors)"
  - "Business transactions"
  - "Errors and exceptions"
  
never_log:
  - "Passwords or secrets"
  - "Full credit card numbers"
  - "Personal health information"
  - "Social security numbers"
  - "Session tokens or API keys"
  - "PII without consent"
  
log_correlation:
  required_fields:
    - "trace_id: Link to distributed trace"
    - "span_id: Current operation"
    - "request_id: Unique request identifier"
    - "user_id: Who made the request (if applicable)"
```

### Log Aggregation Patterns

```yaml
log_pipeline:
  collection:
    agents:
      - "Fluentd/Fluent Bit"
      - "Vector"
      - "Filebeat"
    patterns:
      - "Sidecar container"
      - "DaemonSet"
      - "Direct shipping"
      
  processing:
    tasks:
      - "Parse structured logs"
      - "Enrich with metadata"
      - "Filter noise"
      - "Sample high-volume logs"
      
  storage:
    options:
      - "Loki (log aggregation)"
      - "Elasticsearch (full-text search)"
      - "S3 (archive)"
    retention:
      hot: "7 days (fast query)"
      warm: "30 days (slower query)"
      cold: "1 year (archive only)"
```

## Alerting Best Practices

### Alert Quality

```yaml
good_alert_characteristics:
  actionable:
    description: "Someone needs to do something"
    test: "If the on-call can't act, don't alert"
    
  urgent:
    description: "Needs attention now"
    test: "If it can wait until morning, don't page"
    
  relevant:
    description: "Indicates real user impact"
    test: "Does this affect users or business?"
    
  clear:
    description: "Alert tells you what's wrong"
    test: "Can on-call understand without context?"

alert_anti_patterns:
  flapping_alerts:
    problem: "Alert fires and resolves repeatedly"
    solution: "Add hysteresis (for: 5m in Prometheus)"
    
  noisy_alerts:
    problem: "Too many alerts, alert fatigue"
    solution: "Tune thresholds, aggregate related alerts"
    
  ambiguous_alerts:
    problem: "Alert doesn't explain what's wrong"
    solution: "Include summary, runbook link, relevant values"
    
  orphan_alerts:
    problem: "No runbook or documentation"
    solution: "Every alert must link to a runbook"
```

### Alert Structure

```yaml
prometheus_alert_template:
  example: |
    groups:
      - name: api-server
        rules:
          - alert: APIHighErrorRate
            expr: |
              sum(rate(http_requests_total{job="api-server",status=~"5.."}[5m]))
              / sum(rate(http_requests_total{job="api-server"}[5m]))
              > 0.01
            for: 5m
            labels:
              severity: warning
              team: backend
              service: api-server
            annotations:
              summary: "API error rate above 1%"
              description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"
              runbook_url: "https://wiki.example.com/runbooks/api-high-error-rate"
              dashboard_url: "https://grafana.example.com/d/api-server"
              
required_annotations:
  summary: "One-line description of the problem"
  description: "Detailed description with current values"
  runbook_url: "Link to troubleshooting guide"
  dashboard_url: "Link to relevant dashboard"
```

### Alert Routing

```yaml
alertmanager_routing:
  example: |
    route:
      receiver: 'default-slack'
      group_by: ['alertname', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      
      routes:
        # Critical alerts page immediately
        - match:
            severity: critical
          receiver: 'pagerduty-critical'
          continue: true
          
        # Warning alerts go to Slack
        - match:
            severity: warning
          receiver: 'slack-warnings'
          
        # Team-specific routing
        - match:
            team: backend
          receiver: 'backend-slack'
          routes:
            - match:
                severity: critical
              receiver: 'backend-pagerduty'
              
    receivers:
      - name: 'pagerduty-critical'
        pagerduty_configs:
          - service_key: '<key>'
            severity: critical
            
      - name: 'slack-warnings'
        slack_configs:
          - channel: '#alerts-warnings'
            title: '{{ .GroupLabels.alertname }}'
            text: '{{ .Annotations.summary }}'
```

## Dashboard Design

### Dashboard Hierarchy

```yaml
dashboard_levels:
  executive:
    audience: "Leadership, non-technical"
    content:
      - "Overall service health (green/yellow/red)"
      - "SLO status"
      - "Business metrics"
    refresh: "5 minutes"
    
  service:
    audience: "On-call engineers, service owners"
    content:
      - "Golden signals for the service"
      - "Error budget status"
      - "Recent deployments"
      - "Dependency health"
    refresh: "30 seconds"
    
  debug:
    audience: "Engineers debugging issues"
    content:
      - "Detailed metrics"
      - "Per-instance breakdowns"
      - "Resource utilization"
      - "Log links"
    refresh: "10 seconds"
```

### Dashboard Best Practices

```yaml
layout_guidelines:
  top_row: "Key indicators and health status"
  middle: "Detailed metrics and graphs"
  bottom: "Context (deployments, changes, dependencies)"
  
visualization_choices:
  stat_panel: "Current value, health indicator"
  time_series: "Trends over time"
  heatmap: "Distribution (latency buckets)"
  table: "Detailed breakdown"
  gauge: "Percentage of capacity"
  
common_mistakes:
  - "Too many panels (information overload)"
  - "No clear hierarchy"
  - "Missing time range selector"
  - "No links between dashboards"
  - "No documentation/descriptions"
  
template_variables:
  recommended:
    - "environment: dev, staging, production"
    - "service: service name"
    - "instance: specific instance"
  usage: "Allow filtering without editing dashboard"
```

## Correlation and Context

### Connecting the Pillars

```yaml
correlation_patterns:
  trace_to_logs:
    method: "Include trace_id in all log entries"
    query: "Search logs where trace_id = X"
    
  logs_to_metrics:
    method: "Extract metrics from logs"
    example: "Count ERROR logs as error_count metric"
    
  metrics_to_traces:
    method: "Exemplars link metrics to traces"
    example: "High latency metric point links to slow trace"
    
  alerting_to_dashboards:
    method: "Include dashboard links in alerts"
    example: "Alert annotation includes Grafana link"

exemplars:
  description: "Link between metrics and traces"
  usage: |
    # Prometheus histogram with exemplar
    http_request_duration_seconds_bucket{le="0.5"} 1000 # {trace_id="abc123"}
  grafana: "Click on data point to see trace"
```

### Context Propagation

```yaml
propagation_headers:
  w3c_trace_context:
    header: "traceparent"
    format: "00-{trace_id}-{span_id}-{flags}"
    
  baggage:
    header: "baggage"
    usage: "Propagate application-specific context"
    example: "user_id=123,feature_flag=new_checkout"

implementation: |
  // Middleware to propagate context
  function tracingMiddleware(req, res, next) {
    const traceId = req.headers['traceparent'] 
      ? extractTraceId(req.headers['traceparent'])
      : generateTraceId();
      
    // Add to request context
    req.traceId = traceId;
    
    // Add to response headers
    res.setHeader('traceparent', formatTraceParent(traceId));
    
    // Add to logger context
    req.logger = logger.child({ traceId });
    
    next();
  }
```

## Common Pitfalls

### Metrics Pitfalls

```yaml
pitfall_cardinality_explosion:
  problem: "Labels with unbounded values (user_id, url)"
  impact: "Memory exhaustion, slow queries"
  solution: "Keep labels bounded, use logs for high-cardinality"

pitfall_not_using_histograms:
  problem: "Calculating averages instead of percentiles"
  impact: "Missing tail latency issues"
  solution: "Use histograms, look at p95/p99"

pitfall_missing_labels:
  problem: "Can't break down by status code, method"
  impact: "Can't diagnose issues"
  solution: "Include useful dimensions as labels"
```

### Logging Pitfalls

```yaml
pitfall_log_and_throw:
  problem: "Logging error then throwing (double logging)"
  impact: "Duplicate log entries, confusion"
  solution: "Log at the handling point only"

pitfall_no_context:
  problem: "Logs don't include trace_id or request context"
  impact: "Can't correlate logs"
  solution: "Always include trace_id, request_id"

pitfall_logging_pii:
  problem: "Personal data in logs"
  impact: "Compliance violations"
  solution: "Sanitize logs, use allowlist for fields"
```

### Alerting Pitfalls

```yaml
pitfall_alert_on_causes:
  problem: "Alert on symptoms (high CPU) not impact (slow requests)"
  impact: "Alerts without user impact"
  solution: "Alert on user-facing metrics first"

pitfall_no_runbook:
  problem: "Alert fires, on-call doesn't know what to do"
  impact: "Longer MTTR"
  solution: "Every alert must have a runbook link"

pitfall_too_sensitive:
  problem: "Alert thresholds too tight"
  impact: "Alert fatigue, ignored alerts"
  solution: "Tune thresholds based on actual impact"
```
