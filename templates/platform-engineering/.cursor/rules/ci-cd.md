# CI/CD & GitOps

Guidelines for building reliable, secure, and efficient delivery pipelines.

## Core Principles

1. **Everything as Code** - Pipelines, configuration, and infrastructure
2. **Trunk-Based Development** - Short-lived branches, frequent integration
3. **Shift Left** - Test, scan, and validate early in the pipeline
4. **Immutable Artifacts** - Build once, deploy everywhere
5. **GitOps** - Git as the single source of truth for deployments

## Pipeline Architecture

### Pipeline Stages

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Validate  │ → │    Test     │ → │    Build    │ → │    Scan     │ → │   Deploy    │
├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤   ├─────────────┤
│ Lint        │   │ Unit        │   │ Container   │   │ SAST        │   │ Staging     │
│ Format      │   │ Integration │   │ Helm        │   │ DAST        │   │ Production  │
│ Validate    │   │ Contract    │   │ Docs        │   │ Dependency  │   │             │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### GitHub Actions - Complete Pipeline

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

permissions:
  contents: read
  packages: write
  id-token: write  # For OIDC
  security-events: write

jobs:
  # ============================================
  # Stage 1: Validate
  # ============================================
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

  # ============================================
  # Stage 2: Test
  # ============================================
  test:
    name: Test
    needs: validate
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # ============================================
  # Stage 3: Build
  # ============================================
  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true

  # ============================================
  # Stage 4: Security Scan
  # ============================================
  security-scan:
    name: Security Scan
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/docker@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }}
          args: --severity-threshold=high

  # ============================================
  # Stage 5: Sign Artifact
  # ============================================
  sign:
    name: Sign Artifact
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    
    steps:
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Sign container image
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }}

  # ============================================
  # Stage 6: Deploy to Staging
  # ============================================
  deploy-staging:
    name: Deploy to Staging
    needs: [build, sign]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
        with:
          repository: company/gitops-repo
          token: ${{ secrets.GITOPS_TOKEN }}
      
      - name: Update image tag
        run: |
          cd apps/api-server/overlays/staging
          kustomize edit set image \
            api-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }}
      
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Deploy ${{ github.sha }} to staging"
          git push

  # ============================================
  # Stage 7: Integration Tests
  # ============================================
  integration-tests:
    name: Integration Tests
    needs: deploy-staging
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Wait for deployment
        run: |
          kubectl rollout status deployment/api-server -n staging --timeout=300s
        env:
          KUBECONFIG: ${{ secrets.STAGING_KUBECONFIG }}
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_URL: https://staging.example.com

  # ============================================
  # Stage 8: Deploy to Production
  # ============================================
  deploy-production:
    name: Deploy to Production
    needs: [build, integration-tests]
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main' || github.event_name == 'release'
    
    steps:
      - uses: actions/checkout@v4
        with:
          repository: company/gitops-repo
          token: ${{ secrets.GITOPS_TOKEN }}
      
      - name: Update image tag
        run: |
          cd apps/api-server/overlays/production
          kustomize edit set image \
            api-server=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ needs.build.outputs.image-digest }}
      
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Deploy ${{ github.sha }} to production"
          git push
```

## GitOps with Argo CD

### Application Definition

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-server
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  
  source:
    repoURL: https://github.com/company/gitops-repo.git
    targetRevision: HEAD
    path: apps/api-server/overlays/production
  
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
      - ServerSideApply=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  
  # Health checks
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas  # Ignore HPA changes
```

### ApplicationSet for Multi-Environment

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: api-server
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/company/gitops-repo.git
        revision: HEAD
        directories:
          - path: apps/api-server/overlays/*
  
  template:
    metadata:
      name: 'api-server-{{path.basename}}'
      labels:
        app: api-server
        environment: '{{path.basename}}'
    spec:
      project: '{{path.basename}}'
      source:
        repoURL: https://github.com/company/gitops-repo.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Argo CD Project

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production applications
  
  sourceRepos:
    - https://github.com/company/gitops-repo.git
    - https://charts.example.com
  
  destinations:
    - namespace: production
      server: https://kubernetes.default.svc
    - namespace: production-*
      server: https://kubernetes.default.svc
  
  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
  
  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota
    - group: ''
      kind: LimitRange
  
  roles:
    - name: developer
      description: Developer access
      policies:
        - p, proj:production:developer, applications, get, production/*, allow
        - p, proj:production:developer, applications, sync, production/*, allow
      groups:
        - developers
```

## Deployment Strategies

### Blue-Green Deployment

```yaml
# Argo Rollouts Blue-Green
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-server
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api-server
          image: company/api-server:v1.2.3
  
  strategy:
    blueGreen:
      activeService: api-server
      previewService: api-server-preview
      autoPromotionEnabled: false
      prePromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: api-server-preview
```

### Canary Deployment

```yaml
# Argo Rollouts Canary
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-server
spec:
  replicas: 10
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
        - name: api-server
          image: company/api-server:v1.2.3
  
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 20
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
      
      # Traffic management
      trafficRouting:
        istio:
          virtualService:
            name: api-server
            routes:
              - primary
      
      # Analysis during rollout
      analysis:
        templates:
          - templateName: success-rate
          - templateName: latency
        startingStep: 1
        args:
          - name: service-name
            value: api-server
```

### Analysis Template

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] >= 0.99
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{service="{{args.service-name}}",status!~"5.."}[5m]))
            /
            sum(rate(http_requests_total{service="{{args.service-name}}"}[5m]))
```

## Reusable Pipeline Components

### Composite Action

```yaml
# .github/actions/docker-build/action.yml
name: Docker Build and Push
description: Build and push Docker image with best practices

inputs:
  registry:
    description: Container registry
    required: true
  image-name:
    description: Image name
    required: true
  dockerfile:
    description: Path to Dockerfile
    default: Dockerfile

outputs:
  digest:
    description: Image digest
    value: ${{ steps.build.outputs.digest }}
  tags:
    description: Image tags
    value: ${{ steps.meta.outputs.tags }}

runs:
  using: composite
  steps:
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ inputs.registry }}/${{ inputs.image-name }}
        tags: |
          type=sha,prefix=
          type=ref,event=branch
          type=semver,pattern={{version}}
    
    - name: Build and push
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ${{ inputs.dockerfile }}
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

### Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      image-digest:
        required: true
        type: string
    secrets:
      GITOPS_TOKEN:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          repository: company/gitops-repo
          token: ${{ secrets.GITOPS_TOKEN }}
      
      - name: Update manifest
        run: |
          cd apps/api-server/overlays/${{ inputs.environment }}
          kustomize edit set image api-server=ghcr.io/company/api-server@${{ inputs.image-digest }}
      
      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .
          git commit -m "Deploy to ${{ inputs.environment }}"
          git push
```

## Secret Management in Pipelines

### OIDC Authentication

```yaml
# AWS OIDC authentication - no long-lived credentials
permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
          aws-region: us-east-1
```

### Sealed Secrets

```yaml
# Create sealed secret
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: api-secrets
  namespace: production
spec:
  encryptedData:
    API_KEY: AgBy8...encrypted...data==
    DATABASE_URL: AgDK3...encrypted...data==
```

## Artifact Management

### Container Image Lifecycle

```yaml
# GitHub Container Registry cleanup
name: Cleanup old images

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/delete-package-versions@v4
        with:
          package-name: api-server
          package-type: container
          min-versions-to-keep: 10
          delete-only-untagged-versions: true
```

## Common Pitfalls

### 1. Long-Running Pipelines

```yaml
# Bad - sequential stages that could run in parallel
jobs:
  lint:
    ...
  test:
    needs: lint
    ...
  security:
    needs: test
    ...

# Good - parallel stages where possible
jobs:
  lint:
    ...
  test:
    ...
  security:
    ...
  build:
    needs: [lint, test, security]
```

### 2. No Pipeline Caching

```yaml
# Bad - reinstall dependencies every time
steps:
  - run: npm install

# Good - cache dependencies
steps:
  - uses: actions/setup-node@v4
    with:
      cache: 'npm'
  - run: npm ci
```

### 3. Missing Timeouts

```yaml
# Always set timeouts
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - name: Run tests
        timeout-minutes: 20
        run: npm test
```

### 4. Hardcoded Values

```yaml
# Bad
run: docker push myregistry.io/myapp:v1.2.3

# Good
run: docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```
