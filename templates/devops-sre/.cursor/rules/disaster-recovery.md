# Disaster Recovery

Comprehensive guidelines for disaster recovery planning, testing, and execution.

## Core Principles

1. **Plan for Failure** - Assume disasters will happen, prepare accordingly
2. **Test Regularly** - Untested recovery plans are just documentation
3. **Automate Recovery** - Manual procedures are slow and error-prone
4. **Document Everything** - Recovery is stressful; don't rely on memory

## Recovery Objectives

### RTO and RPO

```yaml
rto:
  name: "Recovery Time Objective"
  definition: "Maximum acceptable time to restore service"
  question: "How long can we be down?"
  factors:
    - "Business impact per hour"
    - "Contractual obligations"
    - "User expectations"
    
rpo:
  name: "Recovery Point Objective"
  definition: "Maximum acceptable data loss"
  question: "How much data can we lose?"
  factors:
    - "Data criticality"
    - "Regulatory requirements"
    - "Cost of data recreation"

relationship: |
  ┌─────────────────────────────────────────────────────────────────┐
  │                        TIMELINE                                 │
  │                                                                 │
  │   Last Good         Disaster        Recovery        Full       │
  │   Backup            Occurs          Begins          Recovery   │
  │      │                 │               │               │       │
  │      ▼                 ▼               ▼               ▼       │
  │  ────┼─────────────────┼───────────────┼───────────────┼────   │
  │      │                 │               │               │       │
  │      │◄───── RPO ─────►│               │               │       │
  │      │  (Data at risk) │               │               │       │
  │                        │◄──────────── RTO ────────────►│       │
  │                        │     (Downtime duration)       │       │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### Service Tiers

```yaml
tier_1_critical:
  description: "Core business functions"
  services:
    - "User authentication"
    - "Payment processing"
    - "Primary API"
  rto: "15 minutes"
  rpo: "0 (no data loss)"
  strategy: "Active-active multi-region"
  backup_frequency: "Continuous replication"
  
tier_2_important:
  description: "Important but not critical"
  services:
    - "Search functionality"
    - "Notifications"
    - "Analytics ingestion"
  rto: "1 hour"
  rpo: "15 minutes"
  strategy: "Warm standby with automated failover"
  backup_frequency: "Every 15 minutes"
  
tier_3_standard:
  description: "Supporting services"
  services:
    - "Admin dashboard"
    - "Reporting"
    - "Batch processing"
  rto: "4 hours"
  rpo: "1 hour"
  strategy: "Cold standby with manual failover"
  backup_frequency: "Hourly"
  
tier_4_non_critical:
  description: "Nice to have services"
  services:
    - "Developer tools"
    - "Internal dashboards"
    - "Documentation"
  rto: "24 hours"
  rpo: "24 hours"
  strategy: "Restore from backup"
  backup_frequency: "Daily"
```

## Disaster Scenarios

### Scenario Classification

```yaml
infrastructure_failure:
  examples:
    - "Single server failure"
    - "Network partition"
    - "Storage failure"
    - "Cloud provider AZ failure"
  likelihood: "Common"
  preparation: "Redundancy, failover"
  
regional_outage:
  examples:
    - "Cloud region unavailable"
    - "Natural disaster in region"
    - "Major network outage"
  likelihood: "Rare"
  preparation: "Multi-region deployment"
  
data_corruption:
  examples:
    - "Database corruption"
    - "Bad deployment corrupting data"
    - "Ransomware"
  likelihood: "Uncommon"
  preparation: "Backups, point-in-time recovery"
  
security_incident:
  examples:
    - "Data breach"
    - "Compromised credentials"
    - "Malicious insider"
  likelihood: "Uncommon"
  preparation: "Incident response plan, isolation"
  
human_error:
  examples:
    - "Accidental data deletion"
    - "Misconfiguration"
    - "Wrong environment deployment"
  likelihood: "Common"
  preparation: "RBAC, backups, change management"
```

## Backup Strategy

### Backup Types

```yaml
full_backup:
  description: "Complete copy of all data"
  frequency: "Weekly"
  pros:
    - "Fast restore"
    - "Self-contained"
  cons:
    - "Slow to create"
    - "Storage intensive"
    
incremental_backup:
  description: "Only changes since last backup"
  frequency: "Daily or hourly"
  pros:
    - "Fast to create"
    - "Storage efficient"
  cons:
    - "Slower restore"
    - "Depends on previous backups"
    
continuous_replication:
  description: "Real-time data sync"
  frequency: "Continuous"
  pros:
    - "Minimal data loss"
    - "Fast failover"
  cons:
    - "Complex setup"
    - "Can replicate corruption"
```

### Backup Configuration

```yaml
database_backup:
  postgresql:
    continuous:
      method: "WAL archiving + streaming replication"
      rpo: "< 1 minute"
      retention: "7 days of WAL"
      
    point_in_time:
      method: "pg_basebackup + WAL"
      recovery: "Restore to any point in time"
      
    logical:
      method: "pg_dump"
      frequency: "Daily"
      retention: "30 days"
      
  commands: |
    # Continuous backup with WAL archiving
    # postgresql.conf
    archive_mode = on
    archive_command = 'aws s3 cp %p s3://backups/wal/%f'
    
    # Daily logical backup
    pg_dump -Fc database > backup.dump
    aws s3 cp backup.dump s3://backups/daily/$(date +%Y-%m-%d).dump

object_storage_backup:
  method: "Cross-region replication"
  configuration: |
    # S3 bucket replication
    aws s3api put-bucket-replication --bucket source-bucket --replication-configuration '{
      "Role": "arn:aws:iam::account:role/replication-role",
      "Rules": [{
        "Status": "Enabled",
        "Destination": {
          "Bucket": "arn:aws:s3:::dest-bucket",
          "StorageClass": "STANDARD"
        }
      }]
    }'

kubernetes_backup:
  method: "Velero"
  includes:
    - "Cluster state"
    - "Persistent volumes"
    - "Secrets and ConfigMaps"
  commands: |
    # Install Velero
    velero install --provider aws --bucket backups --secret-file ./credentials
    
    # Create backup
    velero backup create daily-backup --include-namespaces production
    
    # Schedule backups
    velero schedule create daily --schedule="0 1 * * *" --include-namespaces production
```

### Backup Verification

```yaml
backup_testing:
  frequency: "Monthly at minimum"
  
  process:
    - "Select random backup"
    - "Restore to test environment"
    - "Verify data integrity"
    - "Test application functionality"
    - "Document results"
    
  checklist:
    - "Backup files exist and accessible"
    - "Backup can be decrypted"
    - "Restore completes without errors"
    - "Data matches expected state"
    - "Application can read restored data"
    - "Restore time within RTO"

integrity_checks: |
  # PostgreSQL backup verification
  pg_restore --list backup.dump > /dev/null && echo "Backup valid"
  
  # Compare row counts
  psql -c "SELECT count(*) FROM users" production
  psql -c "SELECT count(*) FROM users" restored_db
  
  # Checksum verification
  sha256sum backup.dump > backup.sha256
  # Store and verify later
```

## Failover Procedures

### Automated Failover

```yaml
database_failover:
  postgresql_patroni:
    description: "Automatic leader election"
    detection: "Health checks every 10 seconds"
    failover_time: "30-60 seconds"
    configuration: |
      # Patroni configuration
      bootstrap:
        dcs:
          ttl: 30
          loop_wait: 10
          retry_timeout: 10
          maximum_lag_on_failover: 1048576
          
  rds_multi_az:
    description: "AWS managed failover"
    detection: "Automatic"
    failover_time: "60-120 seconds"
    action: "Automatic, no intervention needed"

application_failover:
  kubernetes:
    description: "Pod rescheduling"
    detection: "Liveness/readiness probes"
    failover_time: "Seconds to minutes"
    configuration: |
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 10
        periodSeconds: 10
        failureThreshold: 3
        
  load_balancer:
    description: "Health check based routing"
    detection: "HTTP health checks"
    failover_time: "Seconds"
```

### Regional Failover

```yaml
regional_failover_process:
  detection:
    triggers:
      - "Multiple AZ failures"
      - "Regional network issues"
      - "Extended outage (> 15 minutes)"
    monitoring:
      - "Regional health dashboard"
      - "External synthetic monitoring"
      - "Cross-region health checks"
      
  decision:
    criteria:
      - "Primary region unrecoverable"
      - "Data sync status known"
      - "Business approval (if applicable)"
    timeframe: "Decide within 15 minutes"
    
  execution:
    steps:
      1_verify: "Confirm secondary region ready"
      2_dns: "Update DNS to secondary region"
      3_scale: "Scale secondary region capacity"
      4_verify: "Verify traffic flowing"
      5_monitor: "Monitor error rates"
      
  communication:
    - "Status page update"
    - "Internal notification"
    - "Customer communication"

dns_failover: |
  # Route 53 health check based failover
  aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "secondary",
        "Failover": "SECONDARY",
        "TTL": 60,
        "ResourceRecords": [{"Value": "secondary-ip"}],
        "HealthCheckId": "health-check-id"
      }
    }]
  }'
```

## DR Runbook Template

```markdown
# Disaster Recovery Runbook: [Scenario]

## Overview

**Scenario**: [Description of disaster scenario]
**Affected Services**: [List of services]
**Recovery Strategy**: [Active-Active | Warm Standby | Cold Standby]
**Target RTO**: [Time]
**Target RPO**: [Time]

---

## Detection

### Monitoring
- Dashboard: [Grafana link]
- Alerts: [Alert names that indicate this scenario]
- External monitoring: [Synthetic checks]

### Verification
Before declaring disaster:
1. Verify issue is not transient (wait 5 minutes)
2. Confirm with multiple monitoring sources
3. Check cloud provider status page
4. Attempt basic remediation

---

## Declaration

### When to Declare
- [ ] Primary region unreachable for > 15 minutes
- [ ] Data center evacuation required
- [ ] Security incident requires isolation
- [ ] Other: [specific criteria]

### Declaration Process
1. Notify incident commander
2. Start incident channel: #dr-YYYY-MM-DD
3. Page DR response team
4. Update status page: "Major outage, activating DR"

---

## Failover Procedure

### Pre-Failover Checks

```bash
# Verify secondary region health
curl https://secondary-region-healthcheck.example.com/health

# Check replication lag
# [Database-specific command]

# Verify backup status
# [Command to check latest backup]
```

### Step 1: Stop Traffic to Primary

```bash
# Update load balancer
aws elbv2 modify-listener --listener-arn <arn> --default-actions Type=fixed-response,FixedResponseConfig={StatusCode=503}

# Or update DNS TTL (if not already low)
# DNS should already have low TTL (60s) for DR
```

### Step 2: Promote Secondary Database

```bash
# PostgreSQL promotion
patronictl failover --master primary-node --candidate secondary-node

# Or RDS
aws rds promote-read-replica --db-instance-identifier secondary-db
```

### Step 3: Scale Secondary Application

```bash
# Scale up secondary region
kubectl config use-context secondary-region
kubectl scale deployment/api-server --replicas=20
kubectl scale deployment/web-server --replicas=10
```

### Step 4: Update DNS

```bash
# Switch DNS to secondary
aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://failover-dns.json

# Or if using Route 53 failover
# Health check failure should trigger automatic failover
```

### Step 5: Verify Recovery

```bash
# Check application health
curl https://api.example.com/health

# Check error rates
# [Query Prometheus/Datadog]

# Run smoke tests
./scripts/smoke-test.sh
```

---

## Post-Failover

### Immediate (0-1 hour)
- [ ] Verify all critical functions working
- [ ] Update status page: "Operating in DR mode"
- [ ] Notify stakeholders
- [ ] Monitor error rates

### Short-term (1-24 hours)
- [ ] Assess primary region status
- [ ] Document data loss (if any)
- [ ] Plan failback procedure
- [ ] Customer communication (if needed)

### Recovery (24-72 hours)
- [ ] Repair primary region
- [ ] Resync data
- [ ] Test primary region
- [ ] Schedule failback

---

## Failback Procedure

### Prerequisites
- [ ] Primary region fully operational
- [ ] Data synced from secondary to primary
- [ ] Testing completed in primary
- [ ] Change window scheduled

### Failback Steps
1. Stop writes to secondary (if needed)
2. Final data sync
3. Verify data consistency
4. Switch traffic to primary
5. Monitor and verify
6. Decommission DR mode

---

## Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DR Coordinator | @dr-lead | Overall coordination |
| Database | @dba-oncall | Database failover |
| Infrastructure | @infra-oncall | DNS, load balancers |
| Application | @app-oncall | Application verification |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2025-01-15 | @engineer | Initial version |
```

## DR Testing

### Test Types

```yaml
tabletop_exercise:
  description: "Walk through DR plan verbally"
  frequency: "Quarterly"
  duration: "2-4 hours"
  participants: "All on-call engineers"
  outcome: "Identify gaps in documentation"
  
component_failover:
  description: "Test individual component recovery"
  frequency: "Monthly"
  examples:
    - "Database replica promotion"
    - "Single AZ failure simulation"
    - "Service restart recovery"
  outcome: "Verify automated failover works"
  
regional_failover:
  description: "Full region evacuation test"
  frequency: "Bi-annually"
  preparation:
    - "Schedule maintenance window"
    - "Notify customers"
    - "Prepare rollback"
  outcome: "Validate end-to-end DR capability"
  
chaos_engineering:
  description: "Inject failures in production"
  frequency: "Ongoing"
  examples:
    - "Kill random pods"
    - "Inject network latency"
    - "Simulate AZ failure"
  outcome: "Continuous validation of resilience"
```

### DR Test Checklist

```yaml
test_planning:
  - "Define test objectives"
  - "Identify success criteria"
  - "Schedule appropriate window"
  - "Notify stakeholders"
  - "Prepare rollback plan"
  
during_test:
  - "Document all actions"
  - "Record timing for each step"
  - "Note any deviations from plan"
  - "Capture issues encountered"
  
post_test:
  - "Compare actual vs expected RTO/RPO"
  - "Document lessons learned"
  - "Update runbooks"
  - "Create action items for improvements"
  - "Schedule follow-up test for gaps"
```

## Common Pitfalls

```yaml
pitfall_untested_backups:
  problem: "Backups exist but never tested"
  impact: "Discover corruption during actual disaster"
  solution: "Monthly restore testing"

pitfall_stale_runbooks:
  problem: "DR runbooks outdated"
  impact: "Wrong commands, missing steps"
  solution: "Update runbooks after every test and change"

pitfall_single_region:
  problem: "All resources in one region"
  impact: "Complete outage if region fails"
  solution: "Multi-region architecture for critical services"

pitfall_no_communication_plan:
  problem: "No plan for customer communication"
  impact: "Confusion, support overload"
  solution: "Pre-written communication templates"

pitfall_manual_failover:
  problem: "Failover requires manual steps"
  impact: "Slow recovery, human error"
  solution: "Automate failover where possible"
```
