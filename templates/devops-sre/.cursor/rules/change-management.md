# Change Management

Comprehensive guidelines for safely deploying and managing changes in production.

## Core Principles

1. **Small Changes** - Smaller changes are easier to review, deploy, and rollback
2. **Progressive Delivery** - Roll out gradually, validate at each step
3. **Reversibility** - Every change should be reversible quickly
4. **Observability** - Know the impact of every change in real-time

## Change Categories

### Change Risk Levels

```yaml
low_risk:
  description: "Minimal potential for user impact"
  examples:
    - "Documentation updates"
    - "Logging changes"
    - "Non-critical feature flags"
    - "Test environment changes"
  requirements:
    - "Standard PR review"
    - "Automated testing"
  deployment: "Anytime during business hours"
  approval: "Peer review"

medium_risk:
  description: "Potential for limited user impact"
  examples:
    - "UI changes"
    - "Non-critical API changes"
    - "New features behind flags"
    - "Performance optimizations"
  requirements:
    - "PR review"
    - "Automated testing"
    - "Staging validation"
  deployment: "Business hours with monitoring"
  approval: "Senior engineer review"

high_risk:
  description: "Significant potential for user impact"
  examples:
    - "Database migrations"
    - "Authentication changes"
    - "Payment processing changes"
    - "Critical API changes"
  requirements:
    - "PR review by multiple engineers"
    - "Staging validation"
    - "Rollback plan documented"
    - "On-call aware"
  deployment: "Scheduled change window"
  approval: "Tech lead + on-call"

critical_risk:
  description: "Core infrastructure or widespread impact"
  examples:
    - "Database schema changes"
    - "Infrastructure migrations"
    - "Security patches"
    - "Core service refactoring"
  requirements:
    - "Change advisory board review"
    - "Comprehensive testing"
    - "Detailed rollback plan"
    - "Incident response ready"
  deployment: "Scheduled maintenance window"
  approval: "Engineering leadership"
```

## Pre-Deployment Checklist

### Standard Deployment Checklist

```yaml
before_deploy:
  code_quality:
    - "PR approved by required reviewers"
    - "All CI checks passing"
    - "No new security vulnerabilities"
    - "Test coverage maintained"
    
  preparation:
    - "Rollback plan documented"
    - "Feature flags configured"
    - "Monitoring dashboards ready"
    - "On-call engineer aware (for high-risk)"
    
  validation:
    - "Tested in staging/preview"
    - "No unexpected errors in staging"
    - "Performance baseline established"

during_deploy:
  monitoring:
    - "Watch error rate dashboard"
    - "Watch latency dashboard"
    - "Watch deployment progress"
    - "Check application logs"
    
  checkpoints:
    - "First pod healthy"
    - "10% rollout successful"
    - "50% rollout successful"
    - "100% rollout successful"

after_deploy:
  verification:
    - "Smoke test critical paths"
    - "Compare metrics to baseline"
    - "Check for error rate increase"
    - "Verify feature functionality"
    
  documentation:
    - "Update deployment log"
    - "Note any issues encountered"
    - "Update runbooks if needed"
```

## Progressive Delivery

### Canary Deployments

```yaml
canary_process:
  stage_1_canary:
    traffic: "5%"
    duration: "15 minutes minimum"
    success_criteria:
      - "Error rate ≤ baseline * 1.1"
      - "Latency p99 ≤ baseline * 1.2"
      - "No critical errors in logs"
    failure_action: "Rollback immediately"
    
  stage_2_partial:
    traffic: "25%"
    duration: "30 minutes minimum"
    success_criteria:
      - "Error rate ≤ baseline * 1.05"
      - "Latency p99 ≤ baseline * 1.1"
    failure_action: "Rollback to 0%"
    
  stage_3_majority:
    traffic: "50%"
    duration: "1 hour minimum"
    success_criteria:
      - "Error rate ≈ baseline"
      - "Latency p99 ≈ baseline"
    failure_action: "Rollback to 25%"
    
  stage_4_full:
    traffic: "100%"
    duration: "24 hour bake time"
    success_criteria:
      - "All metrics stable"
      - "No user complaints"
    failure_action: "Rollback to 50%"

kubernetes_canary: |
  # Using Argo Rollouts
  apiVersion: argoproj.io/v1alpha1
  kind: Rollout
  metadata:
    name: api-server
  spec:
    replicas: 10
    strategy:
      canary:
        steps:
          - setWeight: 5
          - pause: { duration: 15m }
          - analysis:
              templates:
                - templateName: success-rate
          - setWeight: 25
          - pause: { duration: 30m }
          - setWeight: 50
          - pause: { duration: 1h }
          - setWeight: 100
```

### Feature Flags

```yaml
feature_flag_workflow:
  development:
    - "Create flag in LaunchDarkly/Unleash"
    - "Default: OFF for all environments"
    - "Develop feature behind flag"
    
  testing:
    - "Enable flag in development"
    - "Enable flag for QA in staging"
    - "Test feature thoroughly"
    
  rollout:
    - "Enable for internal users in production"
    - "Enable for 5% of production users"
    - "Gradually increase percentage"
    - "Monitor metrics at each step"
    
  cleanup:
    - "After 100% rollout and stable"
    - "Remove flag checks from code"
    - "Archive or delete flag"

flag_types:
  release_flag:
    purpose: "Control feature rollout"
    lifecycle: "Temporary (remove after rollout)"
    example: "enable_new_checkout"
    
  ops_flag:
    purpose: "Operational control"
    lifecycle: "Permanent"
    example: "enable_cache_bypass"
    
  experiment_flag:
    purpose: "A/B testing"
    lifecycle: "Temporary"
    example: "checkout_flow_variant"
    
  permission_flag:
    purpose: "User entitlements"
    lifecycle: "Permanent"
    example: "enable_premium_features"
```

### Blue-Green Deployments

```yaml
blue_green_process:
  preparation:
    - "Blue environment running current version"
    - "Green environment prepared with new version"
    - "Both environments identical infrastructure"
    
  deployment:
    - "Deploy new version to Green"
    - "Run smoke tests on Green"
    - "Verify health checks pass"
    
  switch:
    - "Update load balancer to point to Green"
    - "Monitor metrics during switch"
    - "Keep Blue running for immediate rollback"
    
  verification:
    - "Verify traffic flowing to Green"
    - "Monitor for errors"
    - "Test critical paths"
    
  cleanup:
    - "After bake time (24h), decommission Blue"
    - "Green becomes new Blue for next deployment"

benefits:
  - "Zero-downtime deployments"
  - "Instant rollback (switch back to Blue)"
  - "Full testing before traffic switch"
  
drawbacks:
  - "Double infrastructure during deployment"
  - "Database migrations more complex"
  - "Session state management"
```

## Rollback Procedures

### Rollback Decision Tree

```yaml
rollback_decision:
  immediate_rollback:
    triggers:
      - "Error rate > 5%"
      - "P99 latency > 3x baseline"
      - "Critical functionality broken"
      - "Data corruption detected"
    action: "Rollback immediately, investigate later"
    
  conditional_rollback:
    triggers:
      - "Error rate > 1% for > 5 minutes"
      - "Latency degraded but service functional"
      - "Non-critical feature broken"
    action: "Attempt quick fix (5 min), rollback if unsuccessful"
    
  monitor_closely:
    triggers:
      - "Minor error rate increase (< 1%)"
      - "Single user reports"
      - "Logs show errors but metrics OK"
    action: "Monitor for 15 minutes, prepare rollback"
```

### Rollback Commands

```yaml
kubernetes_rollback:
  immediate: |
    # Undo last deployment
    kubectl rollout undo deployment/api-server
    
    # Verify rollback
    kubectl rollout status deployment/api-server
    
  to_specific_version: |
    # List revision history
    kubectl rollout history deployment/api-server
    
    # Rollback to specific revision
    kubectl rollout undo deployment/api-server --to-revision=42
    
  verify: |
    # Check deployment status
    kubectl get deployment api-server -o wide
    
    # Check pods
    kubectl get pods -l app=api-server
    
    # Check events
    kubectl describe deployment api-server | tail -20

argocd_rollback:
  immediate: |
    # Rollback to previous version
    argocd app rollback api-server
    
  to_specific: |
    # List history
    argocd app history api-server
    
    # Sync to specific revision
    argocd app sync api-server --revision <commit-sha>

helm_rollback:
  immediate: |
    # List releases
    helm history api-server
    
    # Rollback to previous
    helm rollback api-server
    
  to_specific: |
    # Rollback to specific revision
    helm rollback api-server 5
```

### Post-Rollback

```yaml
after_rollback:
  immediate:
    - "Verify service restored"
    - "Update status page"
    - "Notify stakeholders"
    
  investigation:
    - "Collect logs from failed deployment"
    - "Identify root cause"
    - "Document what went wrong"
    
  remediation:
    - "Fix issue in code"
    - "Add tests to prevent regression"
    - "Update deployment checklist"
    - "Re-deploy with fix"
```

## Database Changes

### Safe Migration Practices

```yaml
migration_principles:
  backward_compatible:
    description: "Old code must work with new schema"
    example: "Add column with default, don't remove columns"
    
  forward_compatible:
    description: "New code must work with old schema"
    example: "New code handles missing column gracefully"
    
  small_steps:
    description: "Break large changes into small steps"
    example: "Rename column: add new, copy data, update code, remove old"

safe_operations:
  always_safe:
    - "Add new table"
    - "Add new column with default"
    - "Add new index (CONCURRENTLY in Postgres)"
    - "Create new view"
    
  requires_care:
    - "Add NOT NULL column"
    - "Modify column type"
    - "Add foreign key"
    
  dangerous:
    - "Drop table"
    - "Drop column"
    - "Rename column"
    - "Change column type"

expand_contract_pattern:
  phase_1_expand:
    - "Add new column/table"
    - "Deploy code that writes to both old and new"
    - "Migrate existing data"
    
  phase_2_migrate:
    - "Deploy code that reads from new"
    - "Verify all data migrated"
    - "Stop writing to old"
    
  phase_3_contract:
    - "Remove old column/table"
    - "Deploy code without old references"
```

### Migration Checklist

```yaml
migration_checklist:
  before:
    - "Test migration in staging"
    - "Measure migration duration"
    - "Plan for rollback"
    - "Schedule maintenance window (if needed)"
    - "Backup database"
    
  during:
    - "Run migration"
    - "Monitor database performance"
    - "Verify data integrity"
    
  after:
    - "Verify application functionality"
    - "Check for deadlocks or slow queries"
    - "Update documentation"
    - "Clean up old data (if applicable)"
```

## Change Windows

### Maintenance Windows

```yaml
maintenance_window_types:
  standard:
    schedule: "Tuesday/Wednesday 2-4 AM local"
    changes: "Routine updates, minor changes"
    notification: "24 hours advance"
    
  emergency:
    schedule: "As needed"
    changes: "Security patches, critical fixes"
    notification: "As soon as possible"
    
  major:
    schedule: "Quarterly, announced 2 weeks ahead"
    changes: "Infrastructure changes, major migrations"
    notification: "2 weeks advance"

change_freeze_periods:
  holidays:
    - "Thanksgiving week (US)"
    - "Christmas week"
    - "Major shopping events"
  criteria: "No non-critical changes"
  exceptions: "Security fixes, critical bugs"
```

### Change Advisory Board

```yaml
cab_process:
  purpose: "Review high-risk changes"
  
  submission:
    required_info:
      - "Change description"
      - "Risk assessment"
      - "Test results"
      - "Rollback plan"
      - "Timeline"
      
  review:
    attendees:
      - "Change requester"
      - "On-call representative"
      - "Security (if applicable)"
      - "Database (if applicable)"
      
  decision:
    - "Approve"
    - "Approve with conditions"
    - "Request more information"
    - "Reject"
    
  tracking:
    - "All changes logged"
    - "Outcomes recorded"
    - "Post-implementation review"
```

## Configuration Changes

### Configuration Management

```yaml
config_change_process:
  version_control:
    - "All config in Git"
    - "PR required for changes"
    - "Review before merge"
    
  deployment:
    - "ConfigMaps/Secrets updated"
    - "Rolling restart if needed"
    - "Verify new config active"
    
  validation:
    - "Config syntax validated"
    - "Required fields present"
    - "Values within expected ranges"

kubernetes_config: |
  # ConfigMap change triggers pod restart
  apiVersion: v1
  kind: ConfigMap
  metadata:
    name: api-config
    annotations:
      # Add checksum to force restart on change
      configmap.reloader.stakater.com/reload: "true"
  data:
    LOG_LEVEL: "info"
    CACHE_TTL: "300"

secrets_rotation:
  process:
    - "Generate new secret"
    - "Add new secret alongside old"
    - "Deploy code using both"
    - "Verify new secret works"
    - "Remove old secret"
  automation: "Use Vault or External Secrets for rotation"
```

## Common Pitfalls

```yaml
pitfall_big_bang_deploy:
  problem: "Deploy everything at once"
  impact: "Hard to identify issues, risky rollback"
  solution: "Progressive delivery, small changes"

pitfall_no_rollback_plan:
  problem: "Deploy without knowing how to undo"
  impact: "Stuck with broken deployment"
  solution: "Document and test rollback before deploy"

pitfall_deploy_on_friday:
  problem: "Deploy late Friday afternoon"
  impact: "Weekend incident, no support"
  solution: "Deploy early in week, never before time off"

pitfall_config_drift:
  problem: "Manual config changes not in version control"
  impact: "Can't reproduce environment, drift"
  solution: "GitOps, all config in version control"

pitfall_skip_staging:
  problem: "Deploy directly to production"
  impact: "Find bugs in production"
  solution: "Always validate in staging first"
```
