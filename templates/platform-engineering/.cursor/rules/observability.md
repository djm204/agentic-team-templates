# Observability

Guidelines for implementing comprehensive observability across the platform.

## Core Principles

1. **Three Pillars** - Metrics, logs, and traces working together
2. **SLO-Driven** - Define what matters before instrumenting everything
3. **Context Propagation** - Trace requests across service boundaries
4. **Actionable Alerts** - Every alert should have a clear response

## The Three Pillars

### Metrics (Prometheus)

```yaml
# ServiceMonitor for automatic discovery
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: api-server
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: api-server
  namespaceSelector:
    matchNames:
      - production
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
      scrapeTimeout: 10s
      
      # Relabeling
      relabelings:
        - sourceLabels: [__meta_kubernetes_pod_label_app_kubernetes_io_version]
          targetLabel: version
      
      # Metric relabeling (drop high-cardinality)
      metricRelabelings:
        - sourceLabels: [__name__]
          regex: 'go_gc_.*'
          action: drop
```

### RED Method (Request-oriented)

```go
// Instrument HTTP handlers with RED metrics
var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
        },
        []string{"method", "path"},
    )
    
    requestsInFlight = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_requests_in_flight",
            Help: "Current number of HTTP requests being processed",
        },
    )
)

func instrumentHandler(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestsInFlight.Inc()
        defer requestsInFlight.Dec()
        
        start := time.Now()
        wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
        
        next.ServeHTTP(wrapped, r)
        
        duration := time.Since(start).Seconds()
        path := normalizePath(r.URL.Path)  // Avoid high cardinality
        
        requestsTotal.WithLabelValues(r.Method, path, strconv.Itoa(wrapped.statusCode)).Inc()
        requestDuration.WithLabelValues(r.Method, path).Observe(duration)
    })
}
```

### USE Method (Resource-oriented)

```yaml
# Resource utilization metrics
groups:
  - name: resource-metrics
    rules:
      # CPU Utilization
      - record: instance:node_cpu_utilization:ratio
        expr: |
          1 - avg by (instance) (
            rate(node_cpu_seconds_total{mode="idle"}[5m])
          )
      
      # Memory Utilization
      - record: instance:node_memory_utilization:ratio
        expr: |
          1 - (
            node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
          )
      
      # Disk Utilization
      - record: instance:node_disk_utilization:ratio
        expr: |
          1 - (
            node_filesystem_avail_bytes{mountpoint="/"} / 
            node_filesystem_size_bytes{mountpoint="/"}
          )
```

### Logs (Loki)

```yaml
# Promtail configuration for log collection
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
    
    positions:
      filename: /tmp/positions.yaml
    
    clients:
      - url: http://loki:3100/loki/api/v1/push
    
    scrape_configs:
      - job_name: kubernetes-pods
        kubernetes_sd_configs:
          - role: pod
        
        relabel_configs:
          # Keep only pods with logging enabled
          - source_labels: [__meta_kubernetes_pod_annotation_logging_enabled]
            action: keep
            regex: true
          
          # Add namespace label
          - source_labels: [__meta_kubernetes_namespace]
            target_label: namespace
          
          # Add pod name label
          - source_labels: [__meta_kubernetes_pod_name]
            target_label: pod
          
          # Add container name label
          - source_labels: [__meta_kubernetes_pod_container_name]
            target_label: container
          
          # Add app label
          - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
            target_label: app
        
        pipeline_stages:
          # Parse JSON logs
          - json:
              expressions:
                level: level
                message: msg
                trace_id: trace_id
                span_id: span_id
          
          # Add labels from parsed JSON
          - labels:
              level:
              trace_id:
          
          # Parse timestamp
          - timestamp:
              source: time
              format: RFC3339Nano
```

### Structured Logging

```go
// Always use structured logging
import "go.uber.org/zap"

logger, _ := zap.NewProduction()
defer logger.Sync()

// Good - structured with context
logger.Info("request processed",
    zap.String("method", r.Method),
    zap.String("path", r.URL.Path),
    zap.Int("status", status),
    zap.Duration("duration", duration),
    zap.String("trace_id", traceID),
    zap.String("user_id", userID),
)

// Bad - unstructured
logger.Info(fmt.Sprintf("processed %s %s in %v", r.Method, r.URL.Path, duration))
```

### Log Levels

```go
// Use appropriate log levels
logger.Debug("detailed debugging info")           // Development/troubleshooting
logger.Info("normal operation events")            // Request processed, job completed
logger.Warn("recoverable issues")                 // Retry succeeded, deprecated API used
logger.Error("errors requiring attention",         // Request failed, connection lost
    zap.Error(err))
// Fatal/Panic - avoid in production; let orchestrator handle restarts
```

### Traces (OpenTelemetry)

```go
// OpenTelemetry setup
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/trace"
)

func initTracer() (*trace.TracerProvider, error) {
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("tempo:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }
    
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceNameKey.String("api-server"),
            semconv.ServiceVersionKey.String(version),
            semconv.DeploymentEnvironmentKey.String(env),
        )),
        trace.WithSampler(trace.ParentBased(
            trace.TraceIDRatioBased(0.1),  // 10% sampling
        )),
    )
    
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))
    
    return tp, nil
}

// Create spans for operations
func handleRequest(ctx context.Context, req *Request) (*Response, error) {
    ctx, span := tracer.Start(ctx, "handleRequest",
        trace.WithAttributes(
            attribute.String("request.id", req.ID),
            attribute.String("request.type", req.Type),
        ),
    )
    defer span.End()
    
    // Database call with child span
    ctx, dbSpan := tracer.Start(ctx, "database.query")
    result, err := db.QueryContext(ctx, query)
    if err != nil {
        dbSpan.RecordError(err)
        dbSpan.SetStatus(codes.Error, err.Error())
    }
    dbSpan.End()
    
    // HTTP call to another service
    req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))
    
    return result, nil
}
```

## SLOs and SLIs

### SLO Definition (Sloth)

```yaml
apiVersion: sloth.slok.dev/v1
kind: PrometheusServiceLevel
metadata:
  name: api-server
  namespace: monitoring
spec:
  service: "api-server"
  labels:
    team: platform
    tier: "1"
  
  slos:
    # Availability SLO
    - name: "requests-availability"
      objective: 99.9  # 99.9% success rate
      description: "99.9% of requests should succeed"
      sli:
        events:
          errorQuery: |
            sum(rate(http_requests_total{
              job="api-server",
              status=~"5.."
            }[{{.window}}]))
          totalQuery: |
            sum(rate(http_requests_total{
              job="api-server"
            }[{{.window}}]))
      alerting:
        name: APIServerHighErrorRate
        labels:
          category: availability
        annotations:
          summary: "API Server error rate is too high"
          runbook: "https://runbooks.example.com/api-server/high-error-rate"
        pageAlert:
          labels:
            severity: critical
            notify: pagerduty
        ticketAlert:
          labels:
            severity: warning
            notify: slack
    
    # Latency SLO
    - name: "requests-latency"
      objective: 99.0  # 99% under 500ms
      description: "99% of requests should complete within 500ms"
      sli:
        events:
          errorQuery: |
            sum(rate(http_request_duration_seconds_bucket{
              job="api-server",
              le="0.5"
            }[{{.window}}]))
          totalQuery: |
            sum(rate(http_request_duration_seconds_count{
              job="api-server"
            }[{{.window}}]))
      alerting:
        name: APIServerHighLatency
        labels:
          category: latency
        pageAlert:
          labels:
            severity: critical
        ticketAlert:
          labels:
            severity: warning
```

### Error Budget Dashboard

```yaml
# Grafana dashboard for error budget
panels:
  - title: "Error Budget Remaining"
    type: gauge
    targets:
      - expr: |
          1 - (
            sum(rate(http_requests_total{status=~"5.."}[30d]))
            /
            sum(rate(http_requests_total[30d]))
          ) / (1 - 0.999)
    thresholds:
      - value: 0
        color: red
      - value: 0.25
        color: orange
      - value: 0.5
        color: yellow
      - value: 0.75
        color: green
  
  - title: "Error Budget Burn Rate"
    type: graph
    targets:
      - expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[1h]))
            /
            sum(rate(http_requests_total[1h]))
          ) / (1 - 0.999)
        legendFormat: "1h burn rate"
      - expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[6h]))
            /
            sum(rate(http_requests_total[6h]))
          ) / (1 - 0.999)
        legendFormat: "6h burn rate"
```

## Alerting

### Alert Rules

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: api-server-alerts
spec:
  groups:
    - name: api-server.rules
      rules:
        # High error rate (immediate)
        - alert: APIServerHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="api-server",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="api-server"}[5m]))
            > 0.01
          for: 5m
          labels:
            severity: critical
            team: platform
          annotations:
            summary: "API Server error rate > 1%"
            description: "Error rate is {{ $value | humanizePercentage }}"
            runbook_url: "https://runbooks.example.com/api-server/high-error-rate"
            dashboard_url: "https://grafana.example.com/d/api-server"
        
        # High latency
        - alert: APIServerHighLatency
          expr: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{job="api-server"}[5m])) by (le)
            ) > 1
          for: 10m
          labels:
            severity: warning
            team: platform
          annotations:
            summary: "API Server P99 latency > 1s"
            description: "P99 latency is {{ $value | humanizeDuration }}"
        
        # Pod crash looping
        - alert: APIServerPodCrashLooping
          expr: |
            rate(kube_pod_container_status_restarts_total{
              namespace="production",
              pod=~"api-server.*"
            }[15m]) > 0
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "API Server pod is crash looping"
            description: "Pod {{ $labels.pod }} has restarted {{ $value }} times"
        
        # High memory usage
        - alert: APIServerHighMemory
          expr: |
            container_memory_usage_bytes{
              namespace="production",
              pod=~"api-server.*"
            }
            /
            container_spec_memory_limit_bytes{
              namespace="production",
              pod=~"api-server.*"
            }
            > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "API Server memory usage > 90%"
```

### Alert Routing (Alertmanager)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/xxx'
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
    
    route:
      receiver: 'default'
      group_by: ['alertname', 'namespace', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      
      routes:
        # Critical alerts -> PagerDuty
        - match:
            severity: critical
          receiver: 'pagerduty-critical'
          continue: true
        
        # Warning alerts -> Slack
        - match:
            severity: warning
          receiver: 'slack-warnings'
        
        # Team-specific routing
        - match:
            team: platform
          receiver: 'platform-team'
    
    receivers:
      - name: 'default'
        slack_configs:
          - channel: '#alerts'
      
      - name: 'pagerduty-critical'
        pagerduty_configs:
          - service_key: '<pagerduty-service-key>'
            severity: critical
            description: '{{ .GroupLabels.alertname }}'
            details:
              firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
      
      - name: 'slack-warnings'
        slack_configs:
          - channel: '#alerts-warnings'
            send_resolved: true
            title: '{{ .GroupLabels.alertname }}'
            text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
      
      - name: 'platform-team'
        slack_configs:
          - channel: '#platform-alerts'
```

## Dashboards

### Service Dashboard Template

```yaml
# Grafana dashboard as code
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-server-dashboard
  labels:
    grafana_dashboard: "1"
data:
  api-server.json: |
    {
      "title": "API Server",
      "uid": "api-server",
      "tags": ["production", "api"],
      "templating": {
        "list": [
          {
            "name": "namespace",
            "type": "query",
            "query": "label_values(http_requests_total, namespace)"
          }
        ]
      },
      "panels": [
        {
          "title": "Request Rate",
          "type": "graph",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
          "targets": [
            {
              "expr": "sum(rate(http_requests_total{namespace=\"$namespace\"}[5m])) by (status)",
              "legendFormat": "{{status}}"
            }
          ]
        },
        {
          "title": "Latency (P50, P95, P99)",
          "type": "graph",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
          "targets": [
            {
              "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{namespace=\"$namespace\"}[5m])) by (le))",
              "legendFormat": "P50"
            },
            {
              "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{namespace=\"$namespace\"}[5m])) by (le))",
              "legendFormat": "P95"
            },
            {
              "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{namespace=\"$namespace\"}[5m])) by (le))",
              "legendFormat": "P99"
            }
          ]
        },
        {
          "title": "Error Rate",
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8},
          "targets": [
            {
              "expr": "sum(rate(http_requests_total{namespace=\"$namespace\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{namespace=\"$namespace\"}[5m]))"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "unit": "percentunit",
              "thresholds": {
                "steps": [
                  {"value": 0, "color": "green"},
                  {"value": 0.01, "color": "yellow"},
                  {"value": 0.05, "color": "red"}
                ]
              }
            }
          }
        }
      ]
    }
```

## Correlation

### Linking Metrics, Logs, and Traces

```yaml
# Grafana data source configuration for correlation
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    jsonData:
      exemplarTraceIdDestinations:
        - name: trace_id
          datasourceUid: tempo
  
  - name: Loki
    type: loki
    url: http://loki:3100
    jsonData:
      derivedFields:
        - name: TraceID
          matcherRegex: '"trace_id":"(\w+)"'
          url: '$${__value.raw}'
          datasourceUid: tempo
  
  - name: Tempo
    type: tempo
    url: http://tempo:3200
    jsonData:
      tracesToLogs:
        datasourceUid: loki
        tags: ['app', 'namespace']
        mappedTags: [{ key: 'service.name', value: 'app' }]
        mapTagNamesEnabled: true
        spanStartTimeShift: '-1h'
        spanEndTimeShift: '1h'
        filterByTraceID: true
        filterBySpanID: false
      tracesToMetrics:
        datasourceUid: prometheus
        tags: [{ key: 'service.name', value: 'job' }]
        queries:
          - name: 'Request rate'
            query: 'sum(rate(http_requests_total{$$__tags}[5m]))'
```

## Common Pitfalls

### 1. Alert Fatigue

```yaml
# Bad - too sensitive, will fire constantly
- alert: HighErrorRate
  expr: http_errors_total > 0
  for: 1m

# Good - meaningful thresholds with context
- alert: HighErrorRate
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m]))
    /
    sum(rate(http_requests_total[5m]))
    > 0.01
  for: 5m
  labels:
    severity: warning
```

### 2. High Cardinality Metrics

```go
// Bad - unbounded cardinality
requestsTotal.WithLabelValues(userID, requestPath, queryString)

// Good - bounded, normalized labels
requestsTotal.WithLabelValues(normalizePath(requestPath), method, statusCode)
```

### 3. Missing Context in Logs

```go
// Bad - no context
log.Error("request failed")

// Good - full context
logger.Error("request failed",
    zap.String("trace_id", traceID),
    zap.String("user_id", userID),
    zap.String("path", path),
    zap.Error(err),
)
```

### 4. Sampling Without Thought

```go
// Bad - random sampling misses important traces
sampler := trace.TraceIDRatioBased(0.01)  // 1%

// Good - sample based on importance
sampler := trace.ParentBased(
    trace.TraceIDRatioBased(0.1),  // 10% base rate
    trace.WithLocalParentSampled(trace.AlwaysSample()),  // Always sample if parent sampled
    trace.WithRemoteParentSampled(trace.AlwaysSample()),
)
// Plus: always sample errors, slow requests, specific user IDs
```
