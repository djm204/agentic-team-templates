# Incident Management

Comprehensive guidelines for detecting, responding to, and learning from incidents.

## Core Principles

1. **Detect Fast** - Automated monitoring catches issues before users report them
2. **Communicate Clearly** - Stakeholders know what's happening and when it will be fixed
3. **Mitigate First** - Stop the bleeding before root cause analysis
4. **Learn Always** - Every incident is an opportunity to improve

## Incident Severity Levels

### Severity Definitions

```yaml
sev1_critical:
  description: "Complete service outage or severe security incident"
  criteria:
    - "Core service completely unavailable"
    - "Data breach or security incident in progress"
    - "Data loss affecting customers"
    - "Revenue-impacting payment failures"
  response:
    time_to_acknowledge: "5 minutes"
    time_to_engage: "15 minutes"
    war_room: "Immediately"
    status_page: "Update within 15 minutes"
    executive_notification: "Yes"
  examples:
    - "Production database down"
    - "API returning 5xx for all requests"
    - "Active security breach"
    - "Complete payment processing failure"

sev2_major:
  description: "Significant degradation affecting many users"
  criteria:
    - "Major feature unavailable"
    - ">10% of users affected"
    - "Significant latency increase"
    - "Partial data loss risk"
  response:
    time_to_acknowledge: "15 minutes"
    time_to_engage: "30 minutes"
    war_room: "If not resolved in 30 minutes"
    status_page: "Update within 30 minutes"
    executive_notification: "If > 1 hour duration"
  examples:
    - "Search functionality broken"
    - "50% error rate on checkout"
    - "Mobile app unable to sync"
    - "Authentication intermittently failing"

sev3_minor:
  description: "Limited impact with workaround available"
  criteria:
    - "Single feature degraded"
    - "<10% of users affected"
    - "Workaround exists"
    - "Non-critical functionality"
  response:
    time_to_acknowledge: "1 hour"
    time_to_engage: "4 hours"
    war_room: "Not required"
    status_page: "Optional"
    executive_notification: "No"
  examples:
    - "Export feature failing"
    - "Admin dashboard slow"
    - "Email notifications delayed"
    - "Analytics not updating"

sev4_low:
  description: "Minimal impact, cosmetic issues"
  criteria:
    - "No user-facing impact"
    - "Internal tooling issues"
    - "Cosmetic bugs"
  response:
    time_to_acknowledge: "Next business day"
    time_to_engage: "Standard sprint work"
    war_room: "Not required"
    status_page: "No"
    executive_notification: "No"
  examples:
    - "Log formatting issues"
    - "Internal dashboard UI bug"
    - "Dev environment problems"
```

## Incident Response Process

### Phase 1: Detection

```yaml
detection_sources:
  automated:
    - "Alerting systems (Prometheus, Datadog)"
    - "Synthetic monitoring"
    - "Error tracking (Sentry, Bugsnag)"
    - "APM anomaly detection"
    
  human:
    - "User reports (support tickets)"
    - "Internal reports (engineers, QA)"
    - "Social media monitoring"
    - "Partner notifications"

detection_goals:
  mttd_targets:
    sev1: "< 5 minutes"
    sev2: "< 15 minutes"
    sev3: "< 1 hour"
```

### Phase 2: Response

```yaml
initial_response:
  steps:
    1: "Acknowledge alert/report"
    2: "Assess severity based on criteria"
    3: "Declare incident if criteria met"
    4: "Create incident channel"
    5: "Page appropriate responders"
    6: "Start incident document"

incident_declaration:
  when_to_declare:
    - "Alert indicates customer impact"
    - "Multiple related alerts firing"
    - "User reports confirmed"
    - "Uncertainty about scope"
    
  how_to_declare:
    slack: "/incident create [description] [severity]"
    pagerduty: "Trigger incident with severity"
    
incident_channel:
  naming: "inc-YYYY-MM-DD-short-description"
  topic: "SEV[X] | IC: @name | Status: investigating"
  pinned:
    - "Incident summary"
    - "Timeline document"
    - "Relevant dashboards"
    - "Runbook links"
```

### Phase 3: Roles and Responsibilities

```yaml
incident_commander:
  also_known_as: "IC"
  responsibilities:
    - "Single point of coordination"
    - "Assign and reassign roles"
    - "Make decisions when no consensus"
    - "Manage communication cadence"
    - "Escalate when needed"
    - "Declare incident resolved"
  should_not:
    - "Debug technical issues directly"
    - "Write code to fix the issue"
    - "Get lost in technical details"

technical_lead:
  also_known_as: "Tech Lead, TL"
  responsibilities:
    - "Lead technical investigation"
    - "Coordinate debugging efforts"
    - "Make technical decisions"
    - "Implement fixes"
    - "Verify resolution"
  should_not:
    - "Handle communications"
    - "Update status page"
    - "Brief stakeholders"

communications_lead:
  also_known_as: "Comms Lead"
  responsibilities:
    - "Update status page"
    - "Send stakeholder updates"
    - "Draft customer communications"
    - "Coordinate with support team"
    - "Manage external messaging"

scribe:
  responsibilities:
    - "Maintain incident timeline"
    - "Document key decisions"
    - "Record actions taken"
    - "Capture screenshots/data"
    - "Note participants"
```

### Phase 4: Mitigation

```yaml
mitigation_priority:
  1_stop_the_bleeding:
    goal: "Restore service to users"
    actions:
      - "Rollback recent changes"
      - "Scale up resources"
      - "Enable feature flags to disable broken code"
      - "Failover to backup systems"
      - "Enable maintenance mode"
    
  2_stabilize:
    goal: "Ensure service stays up"
    actions:
      - "Apply temporary fixes"
      - "Add extra monitoring"
      - "Scale for headroom"
      - "Disable non-critical features"
      
  3_root_cause_later:
    goal: "Don't debug during outage"
    note: "Root cause analysis happens in postmortem"

common_mitigation_actions:
  rollback:
    when: "Recent deployment suspected"
    command: "kubectl rollout undo deployment/[name]"
    verify: "Check error rates return to normal"
    
  scale_up:
    when: "Capacity-related issues"
    command: "kubectl scale deployment/[name] --replicas=[N]"
    verify: "Check resource utilization decreases"
    
  failover:
    when: "Primary system unrecoverable"
    procedure: "Follow DR runbook"
    verify: "Traffic flowing to secondary"
    
  feature_flag:
    when: "Specific feature causing issues"
    action: "Disable flag in LaunchDarkly/Unleash"
    verify: "Feature disabled, errors stop"
```

### Phase 5: Resolution

```yaml
resolution_criteria:
  technical:
    - "Error rates at normal levels"
    - "Latency within SLO"
    - "No degradation visible"
    - "Monitors green"
    
  operational:
    - "Mitigation is stable (not just temporarily fixed)"
    - "No immediate risk of recurrence"
    - "Team can step down from incident"

post_resolution:
  immediate:
    - "Update status page to resolved"
    - "Send final stakeholder update"
    - "Thank participants"
    - "Schedule postmortem"
    
  within_24_hours:
    - "Draft initial postmortem"
    - "Gather timeline from participants"
    - "Collect relevant data/logs"
    
  within_5_days:
    - "Complete postmortem review"
    - "Create action items"
    - "Share learnings"
```

## Communication Templates

### Status Page Update Template

```markdown
**[Investigating/Identified/Monitoring/Resolved]**

**Summary**: [One sentence description of user impact]

**Affected Services**: [List of affected services]

**Current Status**: [What we know and what we're doing]

**Next Update**: [Time of next update]

---
Examples:

**Investigating**
We are currently investigating reports of elevated error rates 
on the checkout flow. Some users may experience failures when 
completing purchases. We will provide an update in 15 minutes.

**Identified**
We have identified the cause of checkout failures as a database 
connectivity issue. We are working on restoring connectivity. 
Estimated resolution in 30 minutes.

**Monitoring**
A fix has been implemented. We are monitoring to confirm 
stability. Users should no longer experience checkout failures.

**Resolved**
This incident has been resolved. Checkout functionality has 
been restored. Total duration: 45 minutes.
```

### Stakeholder Update Template

```markdown
## Incident Update: [Title]

**Severity**: SEV[X]
**Status**: [Active/Resolved]
**Duration**: [X hours Y minutes]

### What Happened
[Brief description of the issue and user impact]

### Current Status
[What we know and what we're doing]

### Business Impact
- Users affected: [X]
- Revenue impact: [$X] (if applicable)
- Customer complaints: [X]

### Next Steps
[What happens next, when the next update will be]

### Questions?
Contact: [Incident Commander name and channel]
```

## War Room Guidelines

### Setting Up a War Room

```yaml
virtual_war_room:
  when: "SEV1 or SEV2 lasting > 30 minutes"
  
  setup:
    - "Create video call (Zoom/Meet/Teams)"
    - "Post link in incident channel"
    - "IC joins immediately"
    - "Technical responders join as needed"
    
  ground_rules:
    - "IC runs the call"
    - "Mute when not speaking"
    - "Use raise hand to speak"
    - "Technical work happens off-call, report back"
    - "No side conversations"
    - "Stay focused on mitigation"

  communication_cadence:
    - "Status update every 15 minutes"
    - "IC asks for updates from each workstream"
    - "Decisions announced and documented"
```

### War Room Commands

```yaml
ic_commands:
  status_check:
    phrase: "Status check - what's your current state?"
    purpose: "Get updates from all participants"
    
  decision_time:
    phrase: "We need to make a decision on [X]. Options are [A, B, C]. Any objections to [A]?"
    purpose: "Drive decisions forward"
    
  escalation:
    phrase: "We need to escalate to [person/team]. [Name], can you page them?"
    purpose: "Bring in additional help"
    
  parallel_work:
    phrase: "[Name] investigate [X]. [Name] investigate [Y]. Report back in 10 minutes."
    purpose: "Divide and conquer"
    
  refocus:
    phrase: "Let's refocus on [priority]. We can debug [other thing] after the incident."
    purpose: "Keep team on track"
```

## On-Call Integration

### Escalation Paths

```yaml
escalation_matrix:
  api_services:
    primary: "backend-oncall"
    secondary: "backend-lead"
    tertiary: "engineering-manager"
    executive: "vp-engineering"
    
  infrastructure:
    primary: "infra-oncall"
    secondary: "sre-lead"
    tertiary: "engineering-manager"
    executive: "vp-engineering"
    
  database:
    primary: "dba-oncall"
    secondary: "dba-lead"
    tertiary: "infra-oncall"
    executive: "vp-engineering"
    
  security:
    primary: "security-oncall"
    secondary: "security-lead"
    tertiary: "ciso"
    executive: "cto"

escalation_triggers:
  automatic:
    - "No acknowledgment within SLA"
    - "Incident duration exceeds threshold"
    - "Severity upgraded"
    
  manual:
    - "Primary on-call requests help"
    - "Technical expertise needed"
    - "Business decision required"
```

### Handoff During Incidents

```yaml
shift_handoff_during_incident:
  when: "Incident spans on-call rotation change"
  
  process:
    1: "Outgoing on-call notifies IC of shift change"
    2: "30-minute overlap for knowledge transfer"
    3: "Incoming on-call joins war room"
    4: "Outgoing provides verbal summary"
    5: "Incoming confirms understanding"
    6: "IC announces handoff complete"
    
  handoff_includes:
    - "Current incident status"
    - "What's been tried"
    - "Current hypothesis"
    - "Assigned tasks"
    - "Open questions"
```

## Incident Documentation

### Real-Time Timeline

```markdown
## Incident Timeline: inc-2025-01-15-api-outage

All times UTC

| Time | Actor | Event |
|------|-------|-------|
| 14:00 | System | Deployment api-server v2.3.1 started |
| 14:02 | System | Deployment completed |
| 14:05 | Alert | APIHighErrorRate fired |
| 14:06 | @oncall | Acknowledged alert |
| 14:08 | @oncall | Incident declared SEV2 |
| 14:08 | @oncall | Created #inc-2025-01-15-api-outage |
| 14:10 | @oncall | Checking recent deployments |
| 14:12 | @oncall | Identified v2.3.1 deployed 5 min before errors |
| 14:15 | @oncall | Initiating rollback to v2.3.0 |
| 14:18 | System | Rollback completed |
| 14:20 | @oncall | Error rates returning to normal |
| 14:25 | @oncall | Monitoring - errors at baseline |
| 14:30 | @oncall | Incident resolved, scheduling postmortem |
```

## Metrics and Improvement

### Incident Metrics to Track

```yaml
response_metrics:
  mttd: 
    name: "Mean Time to Detect"
    target: "< 5 minutes for SEV1"
    measurement: "Time from incident start to first alert"
    
  mtta:
    name: "Mean Time to Acknowledge"
    target: "< 5 minutes"
    measurement: "Time from alert to acknowledgment"
    
  mttm:
    name: "Mean Time to Mitigate"
    target: "< 30 minutes for SEV1"
    measurement: "Time from detection to user impact resolved"
    
  mttr:
    name: "Mean Time to Resolve"
    target: "< 4 hours for SEV1"
    measurement: "Time from detection to root cause fixed"

volume_metrics:
  incidents_per_week:
    target: "Decreasing trend"
    
  incidents_by_severity:
    goal: "Fewer SEV1/SEV2, more caught as SEV3/SEV4"
    
  repeat_incidents:
    target: "< 10% of incidents are repeats"

quality_metrics:
  postmortem_completion_rate:
    target: "100% for SEV1/SEV2"
    
  action_item_completion_rate:
    target: "> 90% within 30 days"
```

## Common Pitfalls

### During Incidents

```yaml
pitfall_debugging_during_outage:
  wrong: "Spending 30 minutes debugging while users are down"
  right: "Mitigate first (rollback, scale, failover), debug later"

pitfall_too_many_cooks:
  wrong: "Everyone jumping in and trying different things"
  right: "IC assigns specific tasks, coordinates parallel work"

pitfall_silent_war_room:
  wrong: "People working silently, no one knows what's happening"
  right: "Regular status updates, thinking out loud"

pitfall_forgetting_communication:
  wrong: "Technical team so focused they forget to update stakeholders"
  right: "Comms Lead handles all external communication"
```

### After Incidents

```yaml
pitfall_skipping_postmortem:
  wrong: "We fixed it, move on"
  right: "Every SEV1/SEV2 gets a postmortem within 5 days"

pitfall_blame_game:
  wrong: "Who deployed the bad code?"
  right: "What systemic issues allowed this to happen?"

pitfall_action_item_graveyard:
  wrong: "Create action items that never get done"
  right: "Track action items, report on completion, prioritize fixes"
```
