# Chaos Engineering

Comprehensive guidelines for building confidence in system resilience through controlled experiments.

## Core Principles

1. **Build Confidence** - Chaos engineering builds confidence in system behavior
2. **Production Reality** - Test in production or production-like environments
3. **Minimize Blast Radius** - Start small, expand carefully
4. **Automate Experiments** - Repeatable, consistent experiments

## Chaos Engineering Fundamentals

### What is Chaos Engineering?

```yaml
definition: |
  Chaos Engineering is the discipline of experimenting on a system
  to build confidence in the system's capability to withstand
  turbulent conditions in production.

goals:
  - "Discover weaknesses before they cause outages"
  - "Build confidence in system resilience"
  - "Improve incident response capabilities"
  - "Validate monitoring and alerting"

not_chaos:
  - "Breaking things randomly"
  - "Testing in production without safeguards"
  - "Causing outages for fun"
  - "Skipping analysis and learning"
```

### Principles of Chaos Engineering

```yaml
principles:
  1_hypothesis:
    description: "Start with a hypothesis about steady state"
    example: "If we lose one database replica, the system will continue serving requests with minimal latency impact"
    
  2_real_world_events:
    description: "Vary inputs that reflect real-world events"
    examples:
      - "Server crashes"
      - "Network failures"
      - "Disk full"
      - "Clock skew"
      - "Dependency failures"
      
  3_production:
    description: "Run experiments in production"
    rationale: "Staging doesn't capture all production behaviors"
    safeguards: "Start with small blast radius, have abort mechanisms"
    
  4_automate:
    description: "Automate experiments to run continuously"
    benefit: "Catch regressions, build institutional knowledge"
    
  5_minimize_blast_radius:
    description: "Limit scope of experiments"
    techniques:
      - "Start with single instance"
      - "Target non-critical services first"
      - "Have kill switch ready"
```

## Experiment Design

### Experiment Structure

```yaml
experiment_template:
  name: "Descriptive name of experiment"
  
  hypothesis:
    description: "What we expect to happen"
    steady_state: "Normal system behavior metrics"
    expected_outcome: "Behavior under failure condition"
    
  method:
    type: "Type of failure injection"
    target: "What component to affect"
    magnitude: "How severe the failure"
    duration: "How long to run"
    
  abort_conditions:
    - "Error rate > 5%"
    - "User reports of issues"
    - "On-call escalation"
    
  rollback:
    automatic: "Conditions that trigger auto-rollback"
    manual: "Steps to manually abort"
    
  analysis:
    metrics: "What to measure"
    success_criteria: "How to determine if hypothesis held"
    
example:
  name: "Single API Pod Failure"
  
  hypothesis:
    description: "System handles single pod loss gracefully"
    steady_state: "Error rate < 0.1%, latency p99 < 200ms"
    expected_outcome: "Minimal impact during pod reschedule"
    
  method:
    type: "Pod termination"
    target: "One random api-server pod"
    magnitude: "Kill 1 of 5 pods"
    duration: "Until pod reschedules (typically < 60s)"
    
  abort_conditions:
    - "Error rate > 1%"
    - "Latency p99 > 1s"
    - "Multiple pods affected"
    
  rollback:
    automatic: "Kubernetes reschedules pod"
    manual: "kubectl scale deployment/api-server --replicas=5"
```

### Failure Injection Types

```yaml
infrastructure_failures:
  pod_crash:
    description: "Terminate container/pod"
    tools: "kubectl delete, Chaos Mesh, Litmus"
    simulates: "OOM kill, crash, node failure"
    
  node_failure:
    description: "Make node unavailable"
    tools: "Cloud provider, kubectl drain"
    simulates: "Hardware failure, kernel panic"
    
  disk_full:
    description: "Fill disk to capacity"
    tools: "dd, Chaos Mesh"
    simulates: "Log explosion, data growth"
    
  cpu_stress:
    description: "Consume CPU resources"
    tools: "stress-ng, Chaos Mesh"
    simulates: "Noisy neighbor, infinite loop"
    
  memory_stress:
    description: "Consume memory resources"
    tools: "stress-ng, Chaos Mesh"
    simulates: "Memory leak, large dataset"

network_failures:
  latency:
    description: "Add network delay"
    tools: "tc, Chaos Mesh, Toxiproxy"
    parameters: "Delay (ms), jitter"
    simulates: "Cross-region calls, congestion"
    
  packet_loss:
    description: "Drop network packets"
    tools: "tc, Chaos Mesh"
    parameters: "Loss percentage"
    simulates: "Network congestion, bad connection"
    
  partition:
    description: "Block network traffic"
    tools: "iptables, Chaos Mesh"
    parameters: "Source/destination, ports"
    simulates: "Network split, firewall issues"
    
  dns_failure:
    description: "DNS resolution fails"
    tools: "Chaos Mesh, custom"
    simulates: "DNS outage, TTL issues"

application_failures:
  exception_injection:
    description: "Make code throw exceptions"
    tools: "Feature flags, custom middleware"
    simulates: "Bug, unexpected input"
    
  slow_response:
    description: "Delay application responses"
    tools: "Toxiproxy, custom middleware"
    simulates: "Slow dependency, GC pause"
    
  partial_failure:
    description: "Some requests fail"
    tools: "Feature flags, service mesh"
    simulates: "Intermittent issues"
```

## Tools and Frameworks

### Chaos Mesh (Kubernetes)

```yaml
chaos_mesh:
  description: "Cloud-native chaos engineering platform"
  
  installation: |
    helm repo add chaos-mesh https://charts.chaos-mesh.org
    helm install chaos-mesh chaos-mesh/chaos-mesh \
      --namespace=chaos-mesh \
      --create-namespace
      
  pod_chaos: |
    apiVersion: chaos-mesh.org/v1alpha1
    kind: PodChaos
    metadata:
      name: pod-kill-example
      namespace: chaos-mesh
    spec:
      action: pod-kill
      mode: one           # Kill one pod
      selector:
        namespaces:
          - production
        labelSelectors:
          app: api-server
      scheduler:
        cron: "@every 2h"   # Or run once
        
  network_chaos: |
    apiVersion: chaos-mesh.org/v1alpha1
    kind: NetworkChaos
    metadata:
      name: network-delay
    spec:
      action: delay
      mode: all
      selector:
        namespaces:
          - production
        labelSelectors:
          app: api-server
      delay:
        latency: "100ms"
        jitter: "20ms"
      duration: "5m"
      
  stress_chaos: |
    apiVersion: chaos-mesh.org/v1alpha1
    kind: StressChaos
    metadata:
      name: cpu-stress
    spec:
      mode: one
      selector:
        labelSelectors:
          app: api-server
      stressors:
        cpu:
          workers: 2
          load: 80
      duration: "5m"
```

### Litmus Chaos

```yaml
litmus:
  description: "CNCF chaos engineering project"
  
  installation: |
    kubectl apply -f https://litmuschaos.github.io/litmus/litmus-operator-v2.14.0.yaml
    
  experiment: |
    apiVersion: litmuschaos.io/v1alpha1
    kind: ChaosEngine
    metadata:
      name: api-chaos
      namespace: production
    spec:
      appinfo:
        appns: production
        applabel: app=api-server
        appkind: deployment
      chaosServiceAccount: litmus-admin
      experiments:
        - name: pod-delete
          spec:
            components:
              env:
                - name: TOTAL_CHAOS_DURATION
                  value: '30'
                - name: CHAOS_INTERVAL
                  value: '10'
                - name: FORCE
                  value: 'false'
```

### Gremlin

```yaml
gremlin:
  description: "Enterprise chaos engineering platform"
  
  features:
    - "Web UI for experiment management"
    - "Attack scheduling"
    - "Team collaboration"
    - "Compliance reporting"
    
  attack_types:
    resource:
      - "CPU"
      - "Memory"
      - "Disk"
      - "IO"
    network:
      - "Latency"
      - "Packet loss"
      - "DNS"
      - "Blackhole"
    state:
      - "Process killer"
      - "Shutdown"
      - "Time travel"
```

## Game Days

### What is a Game Day?

```yaml
game_day:
  definition: |
    A scheduled event where the team intentionally injects 
    failures to test system resilience and incident response.
    
  goals:
    - "Validate resilience mechanisms"
    - "Practice incident response"
    - "Identify gaps in monitoring"
    - "Build team confidence"
    - "Improve runbooks"
    
  frequency: "Quarterly at minimum"
  duration: "2-4 hours"
```

### Game Day Planning

```yaml
planning_checklist:
  2_weeks_before:
    - "Define objectives"
    - "Choose scenarios"
    - "Identify participants"
    - "Get stakeholder approval"
    - "Schedule maintenance window (if needed)"
    
  1_week_before:
    - "Prepare experiment scripts"
    - "Test abort mechanisms"
    - "Brief participants"
    - "Notify support/ops teams"
    - "Prepare monitoring dashboards"
    
  day_before:
    - "Final review of scenarios"
    - "Verify rollback procedures"
    - "Confirm participant availability"
    - "Prepare communication channels"
    
  day_of:
    - "Pre-game briefing"
    - "Verify baseline metrics"
    - "Execute experiments"
    - "Document observations"
    - "Post-game debrief"
```

### Game Day Scenarios

```yaml
beginner_scenarios:
  single_pod_failure:
    complexity: "Low"
    blast_radius: "Single service"
    learning: "Kubernetes self-healing"
    
  dependency_latency:
    complexity: "Low"
    blast_radius: "Single service"
    learning: "Timeout handling"
    
  cache_failure:
    complexity: "Low"
    blast_radius: "Performance"
    learning: "Cache fallback behavior"

intermediate_scenarios:
  database_replica_failure:
    complexity: "Medium"
    blast_radius: "Data tier"
    learning: "Database failover"
    
  az_failure:
    complexity: "Medium"
    blast_radius: "Multiple services"
    learning: "Cross-AZ resilience"
    
  certificate_expiration:
    complexity: "Medium"
    blast_radius: "TLS services"
    learning: "Certificate monitoring"

advanced_scenarios:
  region_failover:
    complexity: "High"
    blast_radius: "Entire region"
    learning: "DR procedures"
    
  cascading_failure:
    complexity: "High"
    blast_radius: "Multiple services"
    learning: "Circuit breakers"
    
  data_corruption:
    complexity: "High"
    blast_radius: "Data integrity"
    learning: "Recovery procedures"
```

### Game Day Execution

```yaml
execution_roles:
  game_master:
    responsibilities:
      - "Run the game day"
      - "Control experiment execution"
      - "Make go/no-go decisions"
      - "Call abort if needed"
      
  red_team:
    responsibilities:
      - "Execute failure injections"
      - "Escalate if issues found"
      - "Document experiment results"
      
  blue_team:
    responsibilities:
      - "Respond to failures"
      - "Use normal incident response"
      - "Pretend they don't know what's coming"
      
  observers:
    responsibilities:
      - "Watch and learn"
      - "Take notes"
      - "Don't interfere"

execution_flow:
  1_baseline:
    - "Verify system health"
    - "Record baseline metrics"
    - "Confirm abort mechanisms work"
    
  2_experiment:
    - "Announce experiment start"
    - "Inject failure"
    - "Observe system response"
    - "Monitor metrics"
    
  3_response:
    - "Blue team detects and responds"
    - "Document response actions"
    - "Note time to detection/mitigation"
    
  4_recovery:
    - "Remove failure injection"
    - "Verify system recovery"
    - "Record recovery metrics"
    
  5_debrief:
    - "Discuss what happened"
    - "Identify improvements"
    - "Create action items"
```

## Continuous Chaos

### Automated Chaos

```yaml
continuous_chaos:
  description: "Run chaos experiments automatically"
  
  benefits:
    - "Catch regressions"
    - "Build resilience muscle memory"
    - "Validate every deployment"
    
  implementation:
    scheduling: |
      # Run chaos experiments on schedule
      apiVersion: chaos-mesh.org/v1alpha1
      kind: Schedule
      metadata:
        name: continuous-pod-chaos
      spec:
        schedule: "*/30 * * * *"  # Every 30 minutes
        type: PodChaos
        podChaos:
          action: pod-kill
          mode: one
          selector:
            labelSelectors:
              chaos-enabled: "true"
              
    ci_integration: |
      # Run chaos as part of CI/CD
      - name: Chaos Test
        run: |
          kubectl apply -f chaos-experiment.yaml
          sleep 60
          ./verify-system-health.sh
          kubectl delete -f chaos-experiment.yaml
```

### Chaos in Production

```yaml
production_chaos:
  prerequisites:
    - "Solid monitoring and alerting"
    - "Automated rollback mechanisms"
    - "Team buy-in and training"
    - "Management approval"
    
  safeguards:
    blast_radius:
      - "Start with single instance"
      - "Limit to percentage of traffic"
      - "Scope to non-critical paths first"
      
    abort_conditions:
      - "Automatic abort on SLO breach"
      - "Kill switch for manual abort"
      - "Time-limited experiments"
      
    timing:
      - "Business hours initially"
      - "Avoid peak traffic"
      - "Skip during change freezes"
      
  gradual_expansion:
    phase_1: "Single pod, non-peak hours"
    phase_2: "Multiple pods, business hours"
    phase_3: "Critical paths, scheduled"
    phase_4: "Random chaos, continuous"
```

## Measuring Success

### Chaos Metrics

```yaml
experiment_metrics:
  system_behavior:
    - "Error rate during experiment"
    - "Latency impact"
    - "Recovery time"
    - "Blast radius (affected users)"
    
  detection:
    - "Time to alert"
    - "Alert accuracy"
    - "Monitoring coverage"
    
  response:
    - "Time to acknowledge"
    - "Time to mitigate"
    - "Runbook effectiveness"

program_metrics:
  coverage:
    - "Services with chaos tests"
    - "Failure modes tested"
    - "Critical paths validated"
    
  improvement:
    - "Issues found vs production incidents"
    - "MTTR improvement"
    - "Confidence score (team survey)"
    
  maturity:
    level_1: "Ad-hoc experiments in staging"
    level_2: "Scheduled game days"
    level_3: "Automated chaos in staging"
    level_4: "Continuous chaos in production"
```

### Reporting

```yaml
experiment_report:
  summary:
    - "Hypothesis"
    - "Result (confirmed/denied)"
    - "Impact observed"
    
  metrics:
    - "Error rate: baseline vs experiment"
    - "Latency: baseline vs experiment"
    - "Recovery time"
    
  findings:
    - "What worked well"
    - "What didn't work"
    - "Unexpected behaviors"
    
  action_items:
    - "Improvements needed"
    - "Monitoring gaps"
    - "Runbook updates"
```

## Common Pitfalls

```yaml
pitfall_no_hypothesis:
  problem: "Breaking things without expected outcome"
  impact: "Can't measure success, no learning"
  solution: "Always start with clear hypothesis"

pitfall_big_blast_radius:
  problem: "Too much failure at once"
  impact: "Real outage, hard to analyze"
  solution: "Start small, expand gradually"

pitfall_no_abort:
  problem: "Can't stop experiment"
  impact: "Extended outage"
  solution: "Always have kill switch ready"

pitfall_no_follow_up:
  problem: "Find issues, don't fix them"
  impact: "Wasted effort"
  solution: "Track findings to resolution"

pitfall_chaos_theater:
  problem: "Going through motions"
  impact: "False confidence"
  solution: "Meaningful experiments, honest analysis"
```
