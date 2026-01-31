# DevOps/SRE Overview

Staff-level guidelines for Site Reliability Engineering and operational excellence.

## Scope

This template applies to:

- Site Reliability Engineering (SRE) practices and culture
- Production operations and 24/7 system reliability
- Incident management, response, and postmortems
- Monitoring, alerting, and observability strategies
- SLO/SLI definition and error budget management
- Capacity planning and performance engineering
- Disaster recovery and business continuity
- Toil reduction and operational automation
- Change management and safe deployments
- Chaos engineering and resilience testing

## Core Principles

### 1. Reliability is a Feature

Users don't distinguish between "the app is slow" and "the app is broken." Reliability directly impacts user experience, trust, and business outcomes.

- Treat reliability work as product work
- Measure reliability from the user's perspective
- Invest in reliability proportional to business impact
- Make reliability visible to stakeholders

### 2. Error Budgets Over Perfection

100% reliability is the wrong target. Perfect reliability means zero innovation.

- Define explicit reliability targets (SLOs)
- Use error budgets to balance reliability and velocity
- When budget is healthy, take risks and move fast
- When budget is low, prioritize reliability work
- Error budget is a currency, not a constraint

### 3. Automate Toil Away

Toil is the kind of work tied to running a service that tends to be manual, repetitive, automatable, tactical, devoid of enduring value, and that scales linearly as the service grows.

- If you're doing it manually more than twice, automate it
- Measure and track toil as a metric
- Allocate engineering time specifically for toil reduction
- Target < 50% of SRE time spent on toil

### 4. Observability First

You can't fix what you can't measure. You can't improve what you can't observe.

- Instrument everything from day one
- Logs, metrics, and traces are not optional
- Design systems to be debuggable
- Correlate signals across the stack

### 5. Blameless Culture

Incidents are learning opportunities, not blame games. Human error is a symptom of system problems.

- Focus on systems, not individuals
- Ask "how did the system allow this?" not "who caused this?"
- Share postmortems widely
- Celebrate learning from failures

## Project Structure

```
sre/
├── monitoring/                 # Observability configuration
│   ├── prometheus/            # Prometheus rules and alerts
│   │   ├── rules/
│   │   └── alerts/
│   ├── grafana/               # Dashboard definitions
│   │   └── dashboards/
│   ├── loki/                  # Log aggregation config
│   └── alertmanager/          # Alert routing
│
├── runbooks/                   # Operational runbooks
│   ├── services/              # Per-service runbooks
│   │   ├── api-server.md
│   │   └── database.md
│   ├── alerts/                # Per-alert runbooks
│   └── procedures/            # General procedures
│       ├── incident-response.md
│       └── on-call-handoff.md
│
├── slos/                       # SLO definitions
│   ├── api.yaml
│   ├── frontend.yaml
│   └── error-budget-policy.yaml
│
├── incident-response/          # Incident management
│   ├── templates/
│   │   ├── incident-doc.md
│   │   └── postmortem.md
│   ├── severity-definitions.yaml
│   └── escalation-policy.yaml
│
├── chaos/                      # Chaos engineering
│   ├── experiments/
│   └── game-days/
│
├── load-testing/               # Performance testing
│   ├── k6/
│   └── scenarios/
│
├── disaster-recovery/          # DR documentation
│   ├── runbooks/
│   ├── backup-policies/
│   └── failover-procedures/
│
└── docs/                       # SRE documentation
    ├── on-call-guide.md
    ├── escalation-policy.md
    └── service-catalog.md
```

## Technology Stack

| Layer | Primary | Alternatives |
|-------|---------|--------------|
| Metrics Collection | Prometheus | Datadog, InfluxDB, Victoria Metrics |
| Metrics Visualization | Grafana | Datadog, Kibana, Chronograf |
| Log Aggregation | Loki | Elasticsearch, Splunk, Datadog Logs |
| Distributed Tracing | Jaeger, Tempo | Zipkin, X-Ray, Honeycomb |
| Alerting | Alertmanager | PagerDuty, Datadog, OpsGenie |
| Incident Management | PagerDuty, Incident.io | OpsGenie, Squadcast, Rootly |
| Status Pages | Statuspage.io | Instatus, Cachet, Better Uptime |
| On-Call Management | PagerDuty | OpsGenie, VictorOps, Squadcast |
| Chaos Engineering | Chaos Mesh, Litmus | Gremlin, AWS FIS, Pumba |
| Load Testing | k6 | Locust, Gatling, JMeter |
| Synthetic Monitoring | Grafana Synthetic | Datadog Synthetics, Pingdom |

## Staff Engineer Responsibilities

### Technical Leadership

- Define and evolve organization-wide reliability standards
- Establish SLO frameworks and error budget policies
- Design observability architectures that scale
- Make build vs. buy decisions for SRE tooling
- Drive cultural shift toward reliability ownership

### Cross-Team Enablement

- Create reusable monitoring and alerting patterns
- Build self-service observability for development teams
- Establish incident response procedures and training
- Design runbook templates and standards
- Lead chaos engineering and game day initiatives

### Operational Excellence

- Own and improve the incident management process
- Drive postmortem quality and action item follow-through
- Reduce mean time to detection (MTTD) and recovery (MTTR)
- Eliminate recurring incidents through systemic fixes
- Balance on-call health with operational coverage

### Strategic Thinking

- Align reliability investments with business priorities
- Plan capacity for multi-year growth projections
- Design disaster recovery strategies
- Evaluate emerging SRE tools and practices
- Manage technical debt in operational systems

## Key Metrics

### Reliability Metrics

- **Availability**: Percentage of successful requests
- **Latency**: Response time at various percentiles (p50, p95, p99)
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests processed per unit time

### Operational Metrics

- **MTTD**: Mean Time to Detect incidents
- **MTTR**: Mean Time to Resolve incidents
- **MTBF**: Mean Time Between Failures
- **Change Failure Rate**: Percentage of changes causing incidents

### On-Call Health Metrics

- **Pages per shift**: Target < 10
- **Pages per night**: Target < 2
- **False positive rate**: Target < 10%
- **Alert noise ratio**: Actionable vs total alerts

### Toil Metrics

- **Toil percentage**: Time spent on toil vs engineering work
- **Manual intervention rate**: Human touchpoints per deployment
- **Automation coverage**: Percentage of runbooks with automation

## Anti-Patterns to Avoid

### Alert on Everything

❌ **Wrong**: Create alerts for every possible metric "just in case"

✅ **Right**: Every alert must be actionable, urgent, and relevant. If the on-call doesn't need to do something immediately, it shouldn't page.

### SLO as Ceiling

❌ **Wrong**: Treat SLOs as minimum acceptable reliability

✅ **Right**: SLOs define the target; error budget is the tool for balancing reliability with velocity

### Postmortem Graveyard

❌ **Wrong**: Write postmortems that go into a folder and are never read

✅ **Right**: Track action items, measure recurring incidents, share learnings organization-wide

### Hero Culture

❌ **Wrong**: Rely on specific engineers who "know the system" to fix everything

✅ **Right**: Document everything, share knowledge, ensure any on-call can handle any incident

### Manual Everything

❌ **Wrong**: Keep critical procedures as tribal knowledge

✅ **Right**: Automate recovery, create runbooks, build self-healing systems
