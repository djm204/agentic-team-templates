# Developer Experience

Guidelines for building internal developer platforms that developers love to use.

## Core Principles

1. **Developers Are Your Customers** - Understand their needs, measure satisfaction
2. **Golden Paths, Not Golden Cages** - Opinionated defaults with escape hatches
3. **Self-Service First** - Reduce time-to-value without tickets
4. **Documentation Is Product** - If it's not documented, it doesn't exist
5. **Fast Feedback Loops** - Minutes, not hours or days

## Internal Developer Platform (IDP)

### Platform Capabilities Matrix

| Capability | Self-Service Level | Time to Complete |
|------------|-------------------|------------------|
| Create new service | Fully automated | < 5 minutes |
| Deploy to staging | Fully automated | < 10 minutes |
| Deploy to production | Approval-gated | < 15 minutes |
| Provision database | Fully automated | < 5 minutes |
| Request cloud resources | Template-based | < 30 minutes |
| View service health | Always available | Instant |
| Access logs/traces | Always available | Instant |
| Rotate secrets | Self-service | < 2 minutes |

### Service Scaffolding (Backstage)

```yaml
# backstage/templates/microservice/template.yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: microservice-template
  title: Production Microservice
  description: |
    Create a production-ready microservice with all platform integrations:
    - CI/CD pipeline
    - Kubernetes manifests
    - Observability (metrics, logs, traces)
    - Documentation scaffold
  tags:
    - recommended
    - nodejs
    - python
    - go
spec:
  owner: platform-team
  type: service
  
  parameters:
    - title: Service Information
      required:
        - name
        - owner
        - language
      properties:
        name:
          title: Service Name
          type: string
          description: Lowercase, alphanumeric, hyphens allowed
          pattern: '^[a-z][a-z0-9-]*[a-z0-9]$'
          maxLength: 63
          ui:autofocus: true
        
        description:
          title: Description
          type: string
          description: What does this service do?
        
        owner:
          title: Owner
          type: string
          description: Team that owns this service
          ui:field: OwnerPicker
          ui:options:
            catalogFilter:
              kind: Group
        
        language:
          title: Language
          type: string
          enum:
            - nodejs
            - python
            - go
          enumNames:
            - Node.js (TypeScript)
            - Python
            - Go
    
    - title: Infrastructure
      properties:
        needsDatabase:
          title: Needs Database
          type: boolean
          default: false
        
        databaseType:
          title: Database Type
          type: string
          enum: [postgresql, mysql]
          ui:widget: select
          dependencies:
            needsDatabase:
              oneOf:
                - const: true
        
        needsCache:
          title: Needs Cache
          type: boolean
          default: false
        
        needsQueue:
          title: Needs Message Queue
          type: boolean
          default: false
    
    - title: Repository
      required:
        - repoUrl
      properties:
        repoUrl:
          title: Repository Location
          type: string
          ui:field: RepoUrlPicker
          ui:options:
            allowedHosts:
              - github.com
            allowedOwners:
              - company
  
  steps:
    - id: fetch-base
      name: Fetch Base Template
      action: fetch:template
      input:
        url: ./skeleton/${{ parameters.language }}
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
          owner: ${{ parameters.owner }}
          needsDatabase: ${{ parameters.needsDatabase }}
          databaseType: ${{ parameters.databaseType }}
          needsCache: ${{ parameters.needsCache }}
          needsQueue: ${{ parameters.needsQueue }}
    
    - id: fetch-kubernetes
      name: Fetch Kubernetes Manifests
      action: fetch:template
      input:
        url: ./kubernetes
        targetPath: ./kubernetes
        values:
          name: ${{ parameters.name }}
          owner: ${{ parameters.owner }}
    
    - id: fetch-docs
      name: Fetch Documentation Template
      action: fetch:template
      input:
        url: ./docs
        targetPath: ./docs
        values:
          name: ${{ parameters.name }}
          description: ${{ parameters.description }}
    
    - id: publish
      name: Publish to GitHub
      action: publish:github
      input:
        allowedHosts: ['github.com']
        repoUrl: ${{ parameters.repoUrl }}
        defaultBranch: main
        protectDefaultBranch: true
        requiredApprovingReviewCount: 1
    
    - id: create-argocd-app
      name: Create Argo CD Application
      action: argocd:create-resources
      input:
        appName: ${{ parameters.name }}
        projectName: default
        repoUrl: ${{ steps.publish.output.remoteUrl }}
        path: kubernetes/overlays/dev
    
    - id: register
      name: Register in Catalog
      action: catalog:register
      input:
        repoContentsUrl: ${{ steps.publish.output.repoContentsUrl }}
        catalogInfoPath: /catalog-info.yaml
  
  output:
    links:
      - title: Repository
        url: ${{ steps.publish.output.remoteUrl }}
      - title: Open in Catalog
        icon: catalog
        entityRef: ${{ steps.register.output.entityRef }}
      - title: View in Argo CD
        url: https://argocd.example.com/applications/${{ parameters.name }}
```

### Service Catalog Entry

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: api-server
  description: Main API server for the platform
  annotations:
    github.com/project-slug: company/api-server
    argocd/app-name: api-server
    prometheus.io/alert: api-server
    pagerduty.com/service-id: P123ABC
    sonarqube.org/project-key: company_api-server
  tags:
    - nodejs
    - typescript
    - api
  links:
    - url: https://api.example.com
      title: Production URL
    - url: https://grafana.example.com/d/api-server
      title: Grafana Dashboard
    - url: https://runbooks.example.com/api-server
      title: Runbook
spec:
  type: service
  lifecycle: production
  owner: platform-team
  system: core-platform
  
  dependsOn:
    - resource:default/postgres-main
    - resource:default/redis-cache
  
  providesApis:
    - api-server-rest
  
  consumesApis:
    - auth-service-api
    - notification-service-api
```

## Golden Paths

### What Makes a Good Golden Path

1. **Low Friction** - Works out of the box
2. **Well Documented** - Clear guides and examples
3. **Best Practices Built-In** - Security, observability, reliability
4. **Escape Hatches** - Can deviate when justified
5. **Maintained** - Kept up to date with dependencies

### Example Golden Path: New Service

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Create Service (5 min)                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Backstage Template → GitHub Repo → Argo CD App         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  2. First Deploy to Dev (10 min)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  git push → CI Pipeline → Container Build → Deploy      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  3. Verify (2 min)                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Health Check → Logs in Grafana → Traces in Tempo       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                  │
│  4. Production Ready (varies)                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tests → Security Scan → Staging → Approval → Production │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Database Golden Path

```yaml
# Self-service database provisioning via Crossplane
apiVersion: database.example.com/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: api-server-db
  namespace: production
spec:
  # Pre-defined size classes
  sizeClass: small  # small, medium, large, xlarge
  
  # Automatic configuration
  version: "15"
  highAvailability: true
  
  # Backup policy (automatic)
  backupRetentionDays: 30
  
  # Connection pooling (automatic)
  enablePgBouncer: true
  
  # Monitoring (automatic)
  enableMetrics: true
  
  # Owner for access
  ownerRef:
    kind: Component
    name: api-server

---
# Size class definitions (managed by platform team)
# small:  1 vCPU, 2GB RAM, 20GB storage
# medium: 2 vCPU, 4GB RAM, 50GB storage
# large:  4 vCPU, 8GB RAM, 100GB storage
# xlarge: 8 vCPU, 16GB RAM, 200GB storage
```

## Documentation Standards

### Service Documentation Template

```markdown
# Service Name

## Overview
Brief description of what this service does and why it exists.

## Quick Start
\`\`\`bash
# Clone and run locally
git clone https://github.com/company/service-name
cd service-name
make dev
\`\`\`

## API Reference
Link to OpenAPI spec or API documentation.

## Architecture
High-level architecture diagram and key design decisions.

## Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | - | Yes |
| LOG_LEVEL | Logging verbosity | info | No |

## Runbook

### Common Issues

#### Service won't start
1. Check database connectivity
2. Verify environment variables
3. Check resource limits

#### High latency
1. Check database query times
2. Review recent deployments
3. Check downstream services

### Escalation
- **L1**: #team-platform-support
- **L2**: @platform-oncall
- **L3**: Page platform-engineering

## SLOs
| Metric | Target | Current |
|--------|--------|---------|
| Availability | 99.9% | [Dashboard](link) |
| P99 Latency | < 500ms | [Dashboard](link) |

## Links
- [Grafana Dashboard](link)
- [Argo CD](link)
- [PagerDuty](link)
- [Runbook](link)
```

### ADR (Architecture Decision Record) Template

```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Status
Accepted

## Context
We need a primary database for storing application data. Key requirements:
- ACID compliance
- Strong consistency
- JSON support for semi-structured data
- Mature ecosystem and tooling

## Decision
We will use PostgreSQL as our primary database.

## Consequences

### Positive
- Mature, well-understood technology
- Excellent JSON/JSONB support
- Strong community and tooling
- Team has existing expertise

### Negative
- Horizontal scaling requires additional tooling (Citus, read replicas)
- Not ideal for time-series data at scale

### Neutral
- Need to manage connection pooling (PgBouncer)
- Regular maintenance (vacuuming, index management)

## Alternatives Considered

### MySQL
- Rejected: Weaker JSON support, less feature-rich

### MongoDB
- Rejected: Consistency concerns, team lacks expertise

### CockroachDB
- Rejected: Higher operational complexity for our scale
```

## Developer Portal Features

### Self-Service Capabilities

```yaml
# Backstage plugins for self-service
plugins:
  # Service scaffolding
  - '@backstage/plugin-scaffolder'
  
  # Kubernetes visibility
  - '@backstage/plugin-kubernetes'
  
  # CI/CD visibility
  - '@backstage/plugin-github-actions'
  - '@roadiehq/backstage-plugin-argo-cd'
  
  # Observability
  - '@backstage/plugin-grafana'
  - '@backstage/plugin-pagerduty'
  
  # Documentation
  - '@backstage/plugin-techdocs'
  
  # API catalog
  - '@backstage/plugin-api-docs'
  
  # Cost visibility
  - '@backstage/plugin-cost-insights'
  
  # Security
  - '@backstage/plugin-sonarqube'
```

### Developer Metrics Dashboard

```yaml
# Track platform adoption and satisfaction
metrics:
  adoption:
    - services_using_golden_path
    - services_with_complete_docs
    - services_with_slos_defined
    - services_with_runbooks
  
  efficiency:
    - time_to_first_deploy
    - deployment_frequency
    - lead_time_for_changes
    - mttr (mean time to recovery)
  
  satisfaction:
    - developer_nps_score
    - platform_support_ticket_volume
    - time_to_resolve_support_tickets
```

## Environment Management

### Preview Environments

```yaml
# Automatic preview environments for PRs
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: preview-environments
spec:
  generators:
    - pullRequest:
        github:
          owner: company
          repo: api-server
          tokenRef:
            secretName: github-token
            key: token
        requeueAfterSeconds: 60
  
  template:
    metadata:
      name: 'api-server-pr-{{number}}'
      labels:
        environment: preview
        pr: '{{number}}'
    spec:
      project: preview
      source:
        repoURL: https://github.com/company/api-server.git
        targetRevision: '{{head_sha}}'
        path: kubernetes/overlays/preview
        helm:
          parameters:
            - name: ingress.host
              value: 'pr-{{number}}.preview.example.com'
      destination:
        server: https://kubernetes.default.svc
        namespace: 'preview-{{number}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Environment Promotion

```yaml
# Promote between environments
# dev -> staging -> production
apiVersion: batch/v1
kind: Job
metadata:
  name: promote-to-staging
spec:
  template:
    spec:
      containers:
        - name: promote
          image: company/gitops-promoter:latest
          args:
            - promote
            - --from=dev
            - --to=staging
            - --service=api-server
            - --version=$(cat /workspace/version.txt)
      restartPolicy: Never
```

## Support Model

### Tiered Support

```
┌─────────────────────────────────────────────────────────────┐
│  L0: Self-Service                                           │
│  ├── Documentation                                          │
│  ├── Runbooks                                              │
│  ├── FAQs                                                  │
│  └── Automated troubleshooting                             │
├─────────────────────────────────────────────────────────────┤
│  L1: Community Support                                      │
│  ├── #platform-help Slack channel                          │
│  ├── Office hours (weekly)                                 │
│  └── Response time: 4 hours                                │
├─────────────────────────────────────────────────────────────┤
│  L2: Platform Team                                          │
│  ├── Escalated tickets                                     │
│  ├── Complex issues                                        │
│  └── Response time: 1 hour                                 │
├─────────────────────────────────────────────────────────────┤
│  L3: Platform Engineering                                   │
│  ├── Critical incidents                                    │
│  ├── Platform bugs                                         │
│  └── Response time: 15 minutes (PagerDuty)                 │
└─────────────────────────────────────────────────────────────┘
```

### Feedback Loops

```yaml
# Quarterly developer surveys
survey:
  questions:
    - "How easy is it to deploy a new service? (1-10)"
    - "How easy is it to debug production issues? (1-10)"
    - "How well does documentation help you? (1-10)"
    - "What's your biggest pain point?"
    - "What should we build next?"
  
  actions:
    - review_results_monthly
    - prioritize_top_pain_points
    - communicate_roadmap_changes
    - follow_up_on_feedback
```

## Common Pitfalls

### 1. Building Without User Research

❌ **Wrong**: Build what you think developers need

✅ **Right**: Interview developers, watch them work, measure pain points

### 2. One-Size-Fits-All

❌ **Wrong**: Force every team into identical workflows

✅ **Right**: Provide golden paths with documented escape hatches

### 3. Documentation Rot

❌ **Wrong**: Documentation that's always out of date

✅ **Right**: Docs-as-code, tested documentation, ownership assignment

### 4. Invisible Platform

❌ **Wrong**: Developers don't know what the platform offers

✅ **Right**: Regular communication, demos, office hours, changelog
