# Infrastructure Testing

Guidelines for testing infrastructure, platform components, and reliability.

## Core Principles

1. **Test Early, Test Often** - Validate before apply, not after
2. **Test Like Production** - Use realistic data, scale, and scenarios
3. **Automate Everything** - Manual testing doesn't scale
4. **Test the Recovery** - Verify backups, failover, and disaster recovery

## Testing Pyramid for Infrastructure

```
                    ┌─────────────────┐
                    │  Chaos Tests    │  ← Production resilience
                   ╱└─────────────────┘╲
                  ╱  ┌─────────────────┐ ╲
                 ╱   │  E2E Tests      │  ╲  ← Full stack validation
                ╱   ╱└─────────────────┘╲  ╲
               ╱   ╱  ┌─────────────────┐ ╲  ╲
              ╱   ╱   │ Integration     │  ╲  ╲  ← Component interaction
             ╱   ╱   ╱└─────────────────┘╲  ╲  ╲
            ╱   ╱   ╱  ┌─────────────────┐ ╲  ╲  ╲
           ╱   ╱   ╱   │  Unit Tests     │  ╲  ╲  ╲  ← Module validation
          ╱   ╱   ╱   ╱└─────────────────┘╲  ╲  ╲  ╲
         ╱   ╱   ╱   ╱  ┌─────────────────┐ ╲  ╲  ╲  ╲
        ╱   ╱   ╱   ╱   │  Static Analysis │  ╲  ╲  ╲  ╲  ← Linting, policy
       └───┴───┴───┴───┴─────────────────────┴───┴───┴───┴───┘
```

## Static Analysis

### Terraform Validation

```yaml
# .github/workflows/terraform-validate.yml
name: Terraform Validation

on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      # Format check
      - name: Terraform Format
        run: terraform fmt -check -recursive
        working-directory: terraform
      
      # Syntax validation
      - name: Terraform Validate
        run: |
          terraform init -backend=false
          terraform validate
        working-directory: terraform
      
      # Linting
      - name: Setup TFLint
        uses: terraform-linters/setup-tflint@v4
      
      - name: TFLint
        run: |
          tflint --init
          tflint --recursive
        working-directory: terraform
      
      # Security scanning
      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: terraform
      
      # Policy compliance
      - name: Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform
          framework: terraform
          quiet: true
          soft_fail: false
```

### Kubernetes Manifest Validation

```yaml
name: Kubernetes Validation

on:
  pull_request:
    paths:
      - 'kubernetes/**'
      - 'charts/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # YAML linting
      - name: YAML Lint
        uses: ibiqlik/action-yamllint@v3
        with:
          file_or_dir: kubernetes/
          config_file: .yamllint.yml
      
      # Helm linting
      - name: Helm Lint
        run: |
          for chart in charts/*/; do
            helm lint "$chart"
          done
      
      # Kubernetes schema validation
      - name: Kubeconform
        uses: docker://ghcr.io/yannh/kubeconform:latest
        with:
          args: >-
            -summary
            -strict
            -kubernetes-version 1.28.0
            kubernetes/
      
      # Policy validation
      - name: Kyverno CLI
        run: |
          kyverno apply policies/ --resource kubernetes/
      
      # Security scanning
      - name: Kubesec
        run: |
          for file in kubernetes/*.yaml; do
            kubesec scan "$file"
          done
```

### Pre-commit Configuration

```yaml
# .pre-commit-config.yaml
repos:
  # Terraform
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
        args:
          - --hook-config=--path-to-file=README.md
          - --hook-config=--add-to-existing-file=true
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_tfsec
      
  # Kubernetes
  - repo: https://github.com/jumanjihouse/pre-commit-hooks
    rev: 3.0.0
    hooks:
      - id: shellcheck
      
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.32.0
    hooks:
      - id: yamllint
        args: [-c=.yamllint.yml]
        
  # General
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
        args: [--allow-multiple-documents]
      - id: check-json
      - id: detect-private-key
      - id: check-merge-conflict
```

## Unit Tests (Terratest)

### Module Testing

```go
// test/vpc_test.go
package test

import (
    "testing"
    
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestVpcModule(t *testing.T) {
    t.Parallel()
    
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/networking/vpc",
        Vars: map[string]interface{}{
            "environment":    "test",
            "vpc_cidr":       "10.0.0.0/16",
            "azs":            []string{"us-east-1a", "us-east-1b"},
            "private_subnets": []string{"10.0.1.0/24", "10.0.2.0/24"},
            "public_subnets":  []string{"10.0.101.0/24", "10.0.102.0/24"},
        },
        NoColor: true,
    })
    
    // Clean up after test
    defer terraform.Destroy(t, terraformOptions)
    
    // Deploy the module
    terraform.InitAndApply(t, terraformOptions)
    
    // Verify outputs
    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)
    
    privateSubnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
    assert.Len(t, privateSubnetIds, 2)
    
    publicSubnetIds := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
    assert.Len(t, publicSubnetIds, 2)
    
    // Verify VPC configuration
    vpcCidr := terraform.Output(t, terraformOptions, "vpc_cidr")
    assert.Equal(t, "10.0.0.0/16", vpcCidr)
}

func TestVpcModuleWithNatGateway(t *testing.T) {
    t.Parallel()
    
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/networking/vpc",
        Vars: map[string]interface{}{
            "environment":     "test",
            "vpc_cidr":        "10.1.0.0/16",
            "enable_nat":      true,
            "single_nat":      false,  // HA NAT
            "azs":             []string{"us-east-1a", "us-east-1b"},
            "private_subnets": []string{"10.1.1.0/24", "10.1.2.0/24"},
            "public_subnets":  []string{"10.1.101.0/24", "10.1.102.0/24"},
        },
    })
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    // Verify NAT gateways
    natGatewayIds := terraform.OutputList(t, terraformOptions, "nat_gateway_ids")
    assert.Len(t, natGatewayIds, 2, "Should have 2 NAT gateways for HA")
}
```

### EKS Cluster Testing

```go
// test/eks_test.go
package test

import (
    "testing"
    "time"
    
    "github.com/gruntwork-io/terratest/modules/k8s"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestEksCluster(t *testing.T) {
    t.Parallel()
    
    terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
        TerraformDir: "../modules/compute/eks",
        Vars: map[string]interface{}{
            "cluster_name":        "test-cluster",
            "kubernetes_version":  "1.28",
            "vpc_id":             "vpc-12345",  // From VPC module output
            "subnet_ids":          []string{"subnet-1", "subnet-2"},
        },
    })
    
    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)
    
    // Get kubeconfig
    kubeconfig := terraform.Output(t, terraformOptions, "kubeconfig")
    require.NotEmpty(t, kubeconfig)
    
    // Configure kubectl
    kubectlOptions := k8s.NewKubectlOptions("", kubeconfig, "default")
    
    // Verify cluster is accessible
    k8s.WaitUntilAllNodesReady(t, kubectlOptions, 10, 30*time.Second)
    
    // Verify node count
    nodes := k8s.GetNodes(t, kubectlOptions)
    assert.GreaterOrEqual(t, len(nodes), 2)
    
    // Verify kube-system pods are running
    k8s.WaitUntilNumPodsCreated(t, kubectlOptions, 
        k8s.NewPodFilterOptions("kube-system", "k8s-app=kube-dns"),
        2, 10, 30*time.Second)
}
```

## Integration Tests

### Helm Chart Testing

```yaml
# charts/api-server/templates/tests/test-connection.yaml
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "api-server.fullname" . }}-test-connection"
  labels:
    {{- include "api-server.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  containers:
    - name: wget
      image: busybox
      command: ['wget']
      args:
        - '--timeout=5'
        - '--tries=3'
        - '-qO-'
        - 'http://{{ include "api-server.fullname" . }}:{{ .Values.service.port }}/healthz'
  restartPolicy: Never

---
apiVersion: v1
kind: Pod
metadata:
  name: "{{ include "api-server.fullname" . }}-test-metrics"
  annotations:
    "helm.sh/hook": test
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  containers:
    - name: curl
      image: curlimages/curl:latest
      command: ['curl']
      args:
        - '--fail'
        - '--silent'
        - 'http://{{ include "api-server.fullname" . }}:{{ .Values.metrics.port }}/metrics'
  restartPolicy: Never
```

### Integration Test Suite

```go
// test/integration/platform_test.go
package integration

import (
    "context"
    "testing"
    "time"
    
    "github.com/gruntwork-io/terratest/modules/helm"
    "github.com/gruntwork-io/terratest/modules/k8s"
    "github.com/stretchr/testify/suite"
)

type PlatformIntegrationSuite struct {
    suite.Suite
    kubeconfig     string
    kubectlOptions *k8s.KubectlOptions
    namespace      string
}

func (s *PlatformIntegrationSuite) SetupSuite() {
    s.namespace = "integration-test-" + time.Now().Format("20060102150405")
    s.kubectlOptions = k8s.NewKubectlOptions("", s.kubeconfig, s.namespace)
    
    // Create namespace
    k8s.CreateNamespace(s.T(), s.kubectlOptions, s.namespace)
}

func (s *PlatformIntegrationSuite) TearDownSuite() {
    // Delete namespace
    k8s.DeleteNamespace(s.T(), s.kubectlOptions, s.namespace)
}

func (s *PlatformIntegrationSuite) TestDatabaseDeployment() {
    // Deploy PostgreSQL
    helmOptions := &helm.Options{
        KubectlOptions: s.kubectlOptions,
        SetValues: map[string]string{
            "auth.postgresPassword": "testpassword",
            "primary.persistence.enabled": "false",
        },
    }
    
    helm.Install(s.T(), helmOptions, "bitnami/postgresql", "test-db")
    defer helm.Delete(s.T(), helmOptions, "test-db", true)
    
    // Wait for pod to be ready
    k8s.WaitUntilPodAvailable(s.T(), s.kubectlOptions, "test-db-postgresql-0", 10, 30*time.Second)
    
    // Verify connection
    output, err := k8s.RunKubectlAndGetOutputE(s.T(), s.kubectlOptions,
        "exec", "test-db-postgresql-0", "--",
        "psql", "-U", "postgres", "-c", "SELECT 1")
    s.NoError(err)
    s.Contains(output, "1 row")
}

func (s *PlatformIntegrationSuite) TestServiceMesh() {
    // Deploy test application
    k8s.KubectlApply(s.T(), s.kubectlOptions, "../fixtures/test-app.yaml")
    defer k8s.KubectlDelete(s.T(), s.kubectlOptions, "../fixtures/test-app.yaml")
    
    // Wait for sidecar injection
    k8s.WaitUntilPodAvailable(s.T(), s.kubectlOptions, "test-app", 10, 60*time.Second)
    
    // Verify sidecar is present
    pod := k8s.GetPod(s.T(), s.kubectlOptions, "test-app")
    s.Len(pod.Spec.Containers, 2, "Should have app + sidecar")
}

func TestPlatformIntegration(t *testing.T) {
    suite.Run(t, new(PlatformIntegrationSuite))
}
```

## Chaos Engineering

### Chaos Mesh

```yaml
# Pod failure experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: api-server-pod-failure
  namespace: chaos-testing
spec:
  action: pod-failure
  mode: one
  duration: "60s"
  selector:
    namespaces:
      - staging
    labelSelectors:
      app.kubernetes.io/name: api-server

---
# Network delay experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: api-server-network-delay
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - staging
    labelSelectors:
      app.kubernetes.io/name: api-server
  delay:
    latency: "100ms"
    jitter: "20ms"
    correlation: "50"
  duration: "5m"

---
# CPU stress experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: api-server-cpu-stress
  namespace: chaos-testing
spec:
  mode: one
  selector:
    namespaces:
      - staging
    labelSelectors:
      app.kubernetes.io/name: api-server
  stressors:
    cpu:
      workers: 2
      load: 80
  duration: "5m"
```

### Litmus Chaos

```yaml
# Chaos experiment for pod delete
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: api-server-chaos
  namespace: staging
spec:
  appinfo:
    appns: staging
    applabel: 'app.kubernetes.io/name=api-server'
    appkind: deployment
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: FORCE
              value: 'false'
```

### Chaos Test Workflow

```yaml
name: Chaos Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Configure kubeconfig
        run: |
          echo "${{ secrets.STAGING_KUBECONFIG }}" > kubeconfig
          echo "KUBECONFIG=$PWD/kubeconfig" >> $GITHUB_ENV
      
      - name: Apply chaos experiment
        run: kubectl apply -f chaos/pod-failure.yaml
      
      - name: Wait for experiment
        run: sleep 120
      
      - name: Check SLO compliance
        run: |
          # Query Prometheus for error rate during chaos
          ERROR_RATE=$(curl -s "http://prometheus.staging:9090/api/v1/query" \
            --data-urlencode 'query=sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))' \
            | jq -r '.data.result[0].value[1]')
          
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "SLO violated: error rate $ERROR_RATE > 1%"
            exit 1
          fi
      
      - name: Delete chaos experiment
        if: always()
        run: kubectl delete -f chaos/pod-failure.yaml
```

## Load Testing

### k6 Load Test

```javascript
// load-tests/api-server.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('latency');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp up more
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(99)<500'],  // 99% requests under 500ms
    'errors': ['rate<0.01'],              // Error rate under 1%
  },
};

export default function () {
  const BASE_URL = __ENV.BASE_URL || 'http://api.staging.example.com';
  
  // GET request
  const getRes = http.get(`${BASE_URL}/api/v1/health`);
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,
  });
  errorRate.add(getRes.status !== 200);
  latency.add(getRes.timings.duration);
  
  sleep(1);
  
  // POST request
  const payload = JSON.stringify({
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
  });
  
  const postRes = http.post(`${BASE_URL}/api/v1/users`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(postRes, {
    'POST status is 201': (r) => r.status === 201,
  });
  errorRate.add(postRes.status !== 201);
  latency.add(postRes.timings.duration);
  
  sleep(1);
}
```

### Load Test Pipeline

```yaml
name: Load Testing

on:
  workflow_dispatch:
    inputs:
      target_vus:
        description: 'Target virtual users'
        required: true
        default: '100'
      duration:
        description: 'Test duration'
        required: true
        default: '5m'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/api-server.js
          flags: --vus ${{ inputs.target_vus }} --duration ${{ inputs.duration }}
        env:
          BASE_URL: https://api.staging.example.com
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: k6-results.json
```

## Disaster Recovery Testing

### Backup Verification

```yaml
name: Backup Verification

on:
  schedule:
    - cron: '0 4 * * 0'  # Weekly on Sunday at 4 AM

jobs:
  verify-backups:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: List recent backups
        run: |
          aws s3 ls s3://company-backups/database/ --recursive | tail -10
      
      - name: Restore to test environment
        run: |
          # Get latest backup
          LATEST=$(aws s3 ls s3://company-backups/database/ --recursive | sort | tail -1 | awk '{print $4}')
          
          # Download backup
          aws s3 cp "s3://company-backups/$LATEST" backup.sql.gz
          
          # Restore to test database
          gunzip backup.sql.gz
          PGPASSWORD=${{ secrets.TEST_DB_PASSWORD }} psql \
            -h test-db.example.com \
            -U postgres \
            -d test_restore \
            -f backup.sql
      
      - name: Verify data integrity
        run: |
          # Run verification queries
          PGPASSWORD=${{ secrets.TEST_DB_PASSWORD }} psql \
            -h test-db.example.com \
            -U postgres \
            -d test_restore \
            -c "SELECT COUNT(*) FROM users" | grep -q "[0-9]"
      
      - name: Cleanup
        if: always()
        run: |
          PGPASSWORD=${{ secrets.TEST_DB_PASSWORD }} psql \
            -h test-db.example.com \
            -U postgres \
            -c "DROP DATABASE IF EXISTS test_restore"
```

### Failover Testing

```yaml
name: Failover Test

on:
  workflow_dispatch:

jobs:
  failover-test:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Record baseline metrics
        run: |
          # Capture current error rate and latency
          curl -s "http://prometheus.staging:9090/api/v1/query?query=rate(http_requests_total[5m])" > baseline.json
      
      - name: Trigger failover
        run: |
          # Simulate primary node failure
          kubectl delete pod -l app.kubernetes.io/name=api-server --wait=false
      
      - name: Wait for recovery
        run: |
          # Wait for pods to recover
          kubectl rollout status deployment/api-server --timeout=300s
      
      - name: Verify service health
        run: |
          # Check health endpoint
          for i in {1..10}; do
            curl -sf https://api.staging.example.com/health && break
            sleep 5
          done
      
      - name: Compare metrics
        run: |
          # Verify error rate returned to normal
          ERROR_RATE=$(curl -s "http://prometheus.staging:9090/api/v1/query" \
            --data-urlencode 'query=rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])' \
            | jq -r '.data.result[0].value[1]')
          
          if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
            echo "Recovery failed: error rate still high ($ERROR_RATE)"
            exit 1
          fi
          
          echo "Recovery successful: error rate $ERROR_RATE"
```

## Common Pitfalls

### 1. Tests Only in Happy Path

```go
// Bad - only tests success
func TestCreateUser(t *testing.T) {
    user := createUser(validData)
    assert.NotNil(t, user)
}

// Good - tests failures too
func TestCreateUser(t *testing.T) {
    t.Run("valid data succeeds", func(t *testing.T) {
        user := createUser(validData)
        assert.NotNil(t, user)
    })
    
    t.Run("duplicate email fails", func(t *testing.T) {
        _, err := createUser(duplicateEmail)
        assert.ErrorIs(t, err, ErrDuplicateEmail)
    })
    
    t.Run("invalid data returns validation error", func(t *testing.T) {
        _, err := createUser(invalidData)
        assert.ErrorIs(t, err, ErrValidation)
    })
}
```

### 2. Tests Depend on Order

```go
// Bad - tests depend on each other
func TestA(t *testing.T) { globalState = "A" }
func TestB(t *testing.T) { assert.Equal(t, "A", globalState) }  // Fails if run alone

// Good - isolated tests
func TestA(t *testing.T) {
    state := setupState()
    defer teardown(state)
    // ...
}
```

### 3. Flaky Tests

```go
// Bad - timing dependent
func TestAsync(t *testing.T) {
    triggerAsyncJob()
    time.Sleep(time.Second)  // Might not be enough
    assert.True(t, jobCompleted())
}

// Good - wait with timeout
func TestAsync(t *testing.T) {
    triggerAsyncJob()
    require.Eventually(t, func() bool {
        return jobCompleted()
    }, 30*time.Second, time.Second)
}
```

### 4. No Cleanup

```go
// Bad - leaves resources behind
func TestEks(t *testing.T) {
    terraform.Apply(t, opts)
    // Test code...
    // Forgot to destroy!
}

// Good - always cleanup
func TestEks(t *testing.T) {
    defer terraform.Destroy(t, opts)  // FIRST thing after Apply
    terraform.Apply(t, opts)
    // Test code...
}
```
