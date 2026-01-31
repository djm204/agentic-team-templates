# Runbooks

Comprehensive guidelines for writing and maintaining operational runbooks.

## Core Principles

1. **Executable** - Clear, step-by-step instructions that anyone can follow
2. **Current** - Updated after every incident that uses or improves them
3. **Tested** - Regularly verified to ensure they work
4. **Automated** - Automate steps where possible, document where not

## Runbook Types

### Alert Runbooks

```yaml
alert_runbook:
  purpose: "Guide response to specific alerts"
  trigger: "Alert fires"
  audience: "On-call engineer"
  
  structure:
    - "Alert overview and severity"
    - "Symptoms and verification"
    - "Quick diagnosis steps"
    - "Mitigation actions"
    - "Root cause investigation"
    - "Escalation criteria"
```

### Service Runbooks

```yaml
service_runbook:
  purpose: "Comprehensive guide for a service"
  trigger: "Any issue with the service"
  audience: "Service operators"
  
  structure:
    - "Service overview and architecture"
    - "Dependencies and data flows"
    - "Common operations"
    - "Troubleshooting guide"
    - "Recovery procedures"
```

### Procedure Runbooks

```yaml
procedure_runbook:
  purpose: "Guide for specific operational tasks"
  trigger: "Need to perform task"
  audience: "Operations team"
  
  examples:
    - "Database failover"
    - "Certificate rotation"
    - "Capacity scaling"
    - "Data recovery"
```

## Runbook Template

### Alert Runbook Template

```markdown
# Runbook: [Alert Name]

## Overview

**Alert**: `AlertName`
**Severity**: Critical | Warning | Info
**Service**: service-name
**Team**: team-name

### What This Alert Means

One paragraph explaining what condition triggers this alert and why it matters.

### User Impact

- What users experience when this alert fires
- Which features are affected
- Business impact

---

## Quick Reference

### Verify the Alert

```bash
# Check if the condition is real
kubectl get pods -l app=service-name
curl -s http://service/health | jq .
```

### Quick Mitigation

```bash
# If recent deployment, rollback
kubectl rollout undo deployment/service-name

# If capacity issue, scale up
kubectl scale deployment/service-name --replicas=10

# If specific feature causing issues
# Disable feature flag in LaunchDarkly
```

---

## Diagnosis

### Step 1: Verify the Alert

Check if the alert condition is accurate:

```bash
# Query Prometheus directly
curl -g 'http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'

# Check service logs
kubectl logs -l app=service-name --tail=100 | grep -i error
```

**Expected**: [What you expect to see if the alert is valid]

### Step 2: Check Recent Changes

Look for changes that might have caused this:

```bash
# Recent deployments
kubectl rollout history deployment/service-name

# Recent config changes
kubectl get configmap service-config -o yaml

# Git commits in last 24h
git log --since="24 hours ago" --oneline
```

**Common causes**:
- Recent deployment introduced bug
- Configuration change
- Dependency failure
- Traffic spike

### Step 3: Check Dependencies

Verify downstream services are healthy:

```bash
# Database connectivity
kubectl exec -it $(kubectl get pod -l app=service-name -o name | head -1) -- \
  pg_isready -h database-host

# Redis connectivity
kubectl exec -it $(kubectl get pod -l app=service-name -o name | head -1) -- \
  redis-cli -h redis-host ping

# External API
curl -s https://api.external-service.com/health
```

### Step 4: Check Resource Usage

Look for resource constraints:

```bash
# Pod resources
kubectl top pods -l app=service-name

# Node resources
kubectl top nodes

# Check for OOM kills
kubectl get events --field-selector reason=OOMKilled
```

---

## Mitigation

### Option 1: Rollback (if recent deployment)

```bash
# Check deployment history
kubectl rollout history deployment/service-name

# Rollback to previous version
kubectl rollout undo deployment/service-name

# Verify rollback
kubectl rollout status deployment/service-name

# Check error rates returning to normal
# (monitor dashboard for 5 minutes)
```

### Option 2: Scale Up (if capacity issue)

```bash
# Current replica count
kubectl get deployment service-name -o jsonpath='{.spec.replicas}'

# Scale up
kubectl scale deployment/service-name --replicas=10

# Verify new pods are healthy
kubectl get pods -l app=service-name -w
```

### Option 3: Feature Flag (if specific feature)

1. Log into LaunchDarkly/Unleash
2. Find feature flag: `feature_name`
3. Disable for production environment
4. Monitor error rates

### Option 4: Failover (if regional issue)

See: [Disaster Recovery Runbook](#disaster-recovery)

---

## Resolution

### Verify Recovery

```bash
# Error rate returned to normal
# (check Grafana dashboard)

# All pods healthy
kubectl get pods -l app=service-name

# Health check passing
curl -s http://service/health
```

### Post-Incident

1. Update incident timeline
2. Schedule postmortem (if SEV1/SEV2)
3. Create follow-up tickets for root cause fix
4. Update this runbook if needed

---

## Escalation

### When to Escalate

- [ ] Not resolved within 30 minutes
- [ ] Data loss suspected
- [ ] Security implications
- [ ] Need database access
- [ ] Need infrastructure changes

### Escalation Contacts

| Role | Contact | When |
|------|---------|------|
| Backend Lead | @backend-lead | Technical escalation |
| DBA | @dba-oncall | Database issues |
| Security | @security-oncall | Security concerns |
| Manager | @eng-manager | Business decisions |

---

## Related

- **Dashboard**: [Grafana Link](https://grafana.example.com/d/service)
- **Logs**: [Loki Query](https://grafana.example.com/explore?query=...)
- **Traces**: [Jaeger](https://jaeger.example.com/search?service=service-name)
- **Service Docs**: [Confluence Link](https://wiki.example.com/service-name)

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-01-15 | @engineer | Added Step 3 for dependency checks |
| 2025-01-01 | @engineer | Initial version |
```

## Writing Effective Runbooks

### Clear Instructions

```yaml
good_instruction:
  format: "Verb + Object + Context"
  examples:
    - "Run the following command to check pod status:"
    - "Verify the database connection by executing:"
    - "Scale the deployment to 10 replicas:"
    
bad_instruction:
  examples:
    - "Check the pods" # Missing how
    - "Fix the database" # Too vague
    - "Do the thing" # Meaningless

command_blocks:
  always_include:
    - "What the command does"
    - "The actual command"
    - "Expected output"
    - "What to do if output differs"
    
  example: |
    Check the current replica count:
    
    ```bash
    kubectl get deployment api-server -o jsonpath='{.spec.replicas}'
    ```
    
    **Expected**: A number (e.g., `3`)
    
    If you see `0`, the deployment may have been scaled down.
    Proceed to the "Scale Up" section.
```

### Decision Points

```yaml
decision_format:
  if_then_else:
    format: |
      If [condition]:
        → Do [action A]
      
      If [other condition]:
        → Do [action B]
      
      Otherwise:
        → Escalate to [team]
        
  example: |
    Check the error rate:
    
    ```bash
    curl -s 'http://prometheus:9090/api/v1/query?query=...' | jq '.data.result[0].value[1]'
    ```
    
    **If error rate > 10%**:
    → Immediately rollback (see Option 1)
    
    **If error rate 1-10%**:
    → Scale up first (see Option 2)
    → If no improvement in 10 min, rollback
    
    **If error rate < 1%**:
    → Alert may be flapping
    → Monitor for 15 minutes before taking action
```

### Verification Steps

```yaml
verification_importance:
  why: "Confirm each action had the expected effect"
  when: "After every significant action"
  
verification_pattern:
  action: "Do something"
  verify: "Check it worked"
  expected: "What you should see"
  troubleshoot: "What to do if it didn't work"
  
example: |
  **Action**: Rollback the deployment
  
  ```bash
  kubectl rollout undo deployment/api-server
  ```
  
  **Verify**: Check rollback status
  
  ```bash
  kubectl rollout status deployment/api-server
  ```
  
  **Expected**: `deployment "api-server" successfully rolled out`
  
  **If rollback fails**:
  - Check events: `kubectl describe deployment api-server`
  - Check pod status: `kubectl get pods -l app=api-server`
  - Escalate if pods won't start
```

## Automation in Runbooks

### Automating Common Steps

```yaml
automation_levels:
  fully_manual:
    description: "Human runs commands, makes decisions"
    when: "Rare events, complex judgment needed"
    
  assisted:
    description: "Scripts help, human approves"
    when: "Common events, some judgment needed"
    
  automated:
    description: "System handles automatically"
    when: "Well-understood, low-risk responses"

example_progression:
  manual: |
    # Human runs this manually
    kubectl scale deployment/api-server --replicas=10
    
  assisted: |
    # Script that prompts for confirmation
    ./scripts/scale-service.sh api-server 10
    # Output: "Scale api-server to 10 replicas? [y/N]"
    
  automated: |
    # HPA handles scaling automatically
    apiVersion: autoscaling/v2
    kind: HorizontalPodAutoscaler
    spec:
      minReplicas: 3
      maxReplicas: 20
      metrics:
        - type: Resource
          resource:
            name: cpu
            target:
              type: Utilization
              averageUtilization: 70
```

### Runbook Automation Scripts

```bash
#!/bin/bash
# scripts/diagnose-high-error-rate.sh
# Automated diagnosis for APIHighErrorRate alert

set -e

SERVICE=${1:-api-server}
NAMESPACE=${2:-production}

echo "=== Diagnosing high error rate for $SERVICE ==="

echo ""
echo "1. Current error rate:"
ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{job=\"$SERVICE\",status=~\"5..\"}[5m]))/sum(rate(http_requests_total{job=\"$SERVICE\"}[5m]))" | jq -r '.data.result[0].value[1]')
echo "   Error rate: $(echo "$ERROR_RATE * 100" | bc)%"

echo ""
echo "2. Recent deployments:"
kubectl rollout history deployment/$SERVICE -n $NAMESPACE | tail -5

echo ""
echo "3. Pod status:"
kubectl get pods -l app=$SERVICE -n $NAMESPACE

echo ""
echo "4. Recent errors in logs:"
kubectl logs -l app=$SERVICE -n $NAMESPACE --tail=20 | grep -i error | tail -10

echo ""
echo "5. Resource usage:"
kubectl top pods -l app=$SERVICE -n $NAMESPACE

echo ""
echo "=== Diagnosis complete ==="
echo ""
echo "Recommended actions:"
if (( $(echo "$ERROR_RATE > 0.10" | bc -l) )); then
    echo "  - ERROR RATE CRITICAL (>10%): Recommend immediate rollback"
    echo "    Run: kubectl rollout undo deployment/$SERVICE -n $NAMESPACE"
elif (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    echo "  - Error rate elevated (>1%): Check recent deployments"
    echo "    If recent deploy, consider rollback"
else
    echo "  - Error rate within normal range"
    echo "    Monitor and check for flapping alerts"
fi
```

## Service Runbook Template

```markdown
# Service Runbook: [Service Name]

## Service Overview

### Description
Brief description of what this service does and why it exists.

### Architecture
```
[User] → [Load Balancer] → [Service] → [Database]
                                    → [Cache]
                                    → [External API]
```

### Key Metrics
- **SLO**: 99.9% availability, p99 latency < 500ms
- **Traffic**: ~10k requests/minute
- **Error Budget**: 43 minutes/month

### Dependencies

| Dependency | Type | Impact if Down | Fallback |
|------------|------|----------------|----------|
| PostgreSQL | Critical | Service fails | None |
| Redis | Degraded | Slower responses | Direct DB |
| Auth Service | Critical | No authentication | None |

---

## Operations

### Deployment
```bash
# Deploy new version
kubectl set image deployment/service-name service=image:tag

# Verify deployment
kubectl rollout status deployment/service-name
```

### Scaling
```bash
# Scale manually
kubectl scale deployment/service-name --replicas=N

# Check current scale
kubectl get hpa service-name
```

### Configuration
```bash
# View config
kubectl get configmap service-config -o yaml

# Update config (triggers restart)
kubectl edit configmap service-config
kubectl rollout restart deployment/service-name
```

### Logs
```bash
# Recent logs
kubectl logs -l app=service-name --tail=100

# Stream logs
kubectl logs -l app=service-name -f

# Logs with errors only
kubectl logs -l app=service-name | grep -i error
```

---

## Troubleshooting Guide

### Service Not Responding

**Symptoms**: Health checks failing, 503 errors

**Diagnosis**:
```bash
# Check pods
kubectl get pods -l app=service-name

# Check events
kubectl get events --sort-by='.lastTimestamp' | grep service-name

# Check logs
kubectl logs -l app=service-name --tail=50
```

**Common Causes**:
1. Pods in CrashLoopBackOff → Check logs for startup errors
2. Pods Pending → Check resources, node capacity
3. Readiness probe failing → Check /ready endpoint

### High Latency

**Symptoms**: p99 latency above SLO

**Diagnosis**:
```bash
# Check resource usage
kubectl top pods -l app=service-name

# Check database latency
# (query Prometheus for db_query_duration_seconds)

# Check external dependencies
curl -w "@curl-format.txt" -o /dev/null -s https://external-api.com/health
```

**Common Causes**:
1. Database slow queries → Check slow query log
2. Resource constraints → Scale up
3. External dependency slow → Check dependency health

### High Error Rate

**Symptoms**: 5xx errors above 1%

**Diagnosis**:
```bash
# Check error breakdown
curl -s 'http://prometheus:9090/api/v1/query?query=sum(rate(http_requests_total{job="service-name",status=~"5.."}[5m]))by(status)'

# Check recent errors in logs
kubectl logs -l app=service-name | grep -E "(error|ERROR|exception)" | tail -20
```

**Common Causes**:
1. Recent deployment bug → Rollback
2. Dependency failure → Check dependencies
3. Data issue → Check for invalid requests

---

## Recovery Procedures

### Database Connection Issues

1. Verify database is reachable:
   ```bash
   kubectl exec -it pod/service-name-xxx -- pg_isready -h db-host
   ```

2. Check connection pool:
   ```bash
   # Query for active connections
   kubectl exec -it pod/postgres-0 -- psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'service_db'"
   ```

3. If pool exhausted, restart pods:
   ```bash
   kubectl rollout restart deployment/service-name
   ```

### Complete Service Recovery

1. Stop all traffic:
   ```bash
   kubectl scale deployment/service-name --replicas=0
   ```

2. Fix underlying issue (database, config, etc.)

3. Restart with single replica:
   ```bash
   kubectl scale deployment/service-name --replicas=1
   ```

4. Verify health:
   ```bash
   kubectl logs -l app=service-name -f
   curl http://service-name/health
   ```

5. Scale back up:
   ```bash
   kubectl scale deployment/service-name --replicas=3
   ```

---

## Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Primary On-Call | PagerDuty | 24/7 |
| Service Owner | @owner | Business hours |
| Team Lead | @lead | Business hours |

---

## Related Documentation

- [Architecture Doc](https://wiki.example.com/service-name/architecture)
- [API Documentation](https://api-docs.example.com/service-name)
- [Dashboard](https://grafana.example.com/d/service-name)
- [Alert Runbooks](#alert-runbooks)
```

## Runbook Maintenance

### Review Schedule

```yaml
runbook_review:
  triggers:
    - "After every incident that uses the runbook"
    - "After any production change to the service"
    - "Quarterly scheduled review"
    - "When on-call feedback indicates issues"
    
  review_checklist:
    - "Commands still work?"
    - "URLs and links still valid?"
    - "Screenshots still accurate?"
    - "Contact information current?"
    - "Escalation path correct?"
    - "Any new failure modes to document?"
```

### Testing Runbooks

```yaml
runbook_testing:
  methods:
    game_day:
      description: "Simulate incident, follow runbook"
      frequency: "Quarterly"
      outcome: "Identify gaps, update runbook"
      
    shadow_run:
      description: "New on-call follows runbook during real incident"
      frequency: "Each new on-call"
      outcome: "Verify clarity for newcomers"
      
    automation_test:
      description: "Run automated scripts in staging"
      frequency: "After any update"
      outcome: "Verify scripts work"
```

## Common Pitfalls

```yaml
pitfall_stale_runbooks:
  problem: "Runbooks not updated after changes"
  impact: "On-call follows outdated steps, makes things worse"
  solution: "Include runbook update in change checklist"

pitfall_assumed_knowledge:
  problem: "Runbook assumes reader knows the system"
  impact: "New on-call can't follow"
  solution: "Write for someone who's never seen the service"

pitfall_no_verification:
  problem: "Steps without verification"
  impact: "Don't know if action worked"
  solution: "Every action needs a verification step"

pitfall_wall_of_text:
  problem: "Long paragraphs instead of clear steps"
  impact: "Hard to follow during stress"
  solution: "Use numbered steps, bullet points, clear formatting"
```
