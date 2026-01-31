# Security

Guidelines for implementing security across the platform.

## Core Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Minimal permissions needed to function
3. **Zero Trust** - Verify explicitly, never trust implicitly
4. **Shift Left** - Security early in the development lifecycle
5. **Automate Everything** - Security checks in every pipeline

## Policy as Code

### OPA/Gatekeeper Policies

```yaml
# Require resource limits on all pods
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredresources
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredResources
      validation:
        openAPIV3Schema:
          type: object
          properties:
            limits:
              type: array
              items:
                type: string
            requests:
              type: array
              items:
                type: string
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredresources
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          required := input.parameters.limits[_]
          not container.resources.limits[required]
          msg := sprintf("Container %v must have %v limit", [container.name, required])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          required := input.parameters.requests[_]
          not container.resources.requests[required]
          msg := sprintf("Container %v must have %v request", [container.name, required])
        }

---
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredResources
metadata:
  name: require-resource-limits
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
    namespaces:
      - production
      - staging
  parameters:
    limits:
      - cpu
      - memory
    requests:
      - cpu
      - memory
```

### Kyverno Policies

```yaml
# Require specific labels
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-labels
  annotations:
    policies.kyverno.io/title: Require Labels
    policies.kyverno.io/severity: medium
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-team-label
      match:
        any:
          - resources:
              kinds:
                - Deployment
                - StatefulSet
              namespaces:
                - production
                - staging
      validate:
        message: "The label 'team' is required"
        pattern:
          metadata:
            labels:
              team: "?*"
              
    - name: require-app-label
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "The label 'app.kubernetes.io/name' is required"
        pattern:
          metadata:
            labels:
              app.kubernetes.io/name: "?*"

---
# Disallow privileged containers
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-privileged-containers
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: deny-privileged
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Privileged containers are not allowed"
        pattern:
          spec:
            containers:
              - securityContext:
                  privileged: "false"
            initContainers:
              - securityContext:
                  privileged: "false"

---
# Require non-root user
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-run-as-non-root
spec:
  validationFailureAction: Enforce
  rules:
    - name: run-as-non-root
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Containers must run as non-root"
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true
            containers:
              - securityContext:
                  runAsNonRoot: true
                  allowPrivilegeEscalation: false
```

## Supply Chain Security

### Image Signing (Cosign)

```yaml
# Sign images in CI pipeline
name: Build and Sign

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write  # Required for keyless signing
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/company/api-server:${{ github.sha }}
      
      - name: Install Cosign
        uses: sigstore/cosign-installer@v3
      
      - name: Sign image (keyless)
        run: |
          cosign sign --yes \
            ghcr.io/company/api-server@${{ steps.build.outputs.digest }}
      
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ghcr.io/company/api-server@${{ steps.build.outputs.digest }}
          format: spdx-json
          output-file: sbom.spdx.json
      
      - name: Attest SBOM
        run: |
          cosign attest --yes \
            --predicate sbom.spdx.json \
            --type spdxjson \
            ghcr.io/company/api-server@${{ steps.build.outputs.digest }}
```

### Verify Images (Kyverno)

```yaml
# Require signed images
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: verify-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
              namespaces:
                - production
      verifyImages:
        - imageReferences:
            - "ghcr.io/company/*"
          attestors:
            - entries:
                - keyless:
                    subject: "https://github.com/company/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev
          attestations:
            - predicateType: "https://spdx.dev/Document"
              conditions:
                - all:
                    - key: "{{ time_since('', '{{ @.creationInfo.created }}', '') }}"
                      operator: LessThanOrEquals
                      value: "168h"  # SBOM less than 7 days old
```

### Vulnerability Scanning

```yaml
# Trivy scanning in CI
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily scan

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Scan filesystem for secrets and vulnerabilities
      - name: Trivy FS scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-fs-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      # Scan container image
      - name: Trivy image scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/company/api-server:${{ github.sha }}'
          format: 'sarif'
          output: 'trivy-image-results.sarif'
          severity: 'CRITICAL,HIGH'
          vuln-type: 'os,library'
      
      # Upload results to GitHub Security
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-fs-results.sarif'
      
      # Fail if critical vulnerabilities
      - name: Fail on critical vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/company/api-server:${{ github.sha }}'
          exit-code: '1'
          severity: 'CRITICAL'
```

## Secrets Management

### External Secrets Operator

```yaml
# ClusterSecretStore for Vault
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "external-secrets"
          serviceAccountRef:
            name: "external-secrets"
            namespace: "external-secrets"

---
# ExternalSecret for application
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-server-secrets
  namespace: production
spec:
  refreshInterval: 1h
  
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault-backend
  
  target:
    name: api-server-secrets
    creationPolicy: Owner
    deletionPolicy: Retain
    template:
      type: Opaque
      engineVersion: v2
      data:
        DATABASE_URL: "postgresql://{{ .db_user }}:{{ .db_password }}@db.example.com:5432/api"
  
  data:
    - secretKey: db_user
      remoteRef:
        key: secret/data/production/api-server
        property: database_username
    
    - secretKey: db_password
      remoteRef:
        key: secret/data/production/api-server
        property: database_password
    
    - secretKey: api_key
      remoteRef:
        key: secret/data/production/api-server
        property: api_key
```

### SOPS for GitOps

```yaml
# .sops.yaml - encryption rules
creation_rules:
  # Production secrets - strict key management
  - path_regex: environments/production/.*\.yaml$
    encrypted_regex: ^(data|stringData)$
    kms: arn:aws:kms:us-east-1:123456789012:key/production-key-id
  
  # Staging secrets
  - path_regex: environments/staging/.*\.yaml$
    encrypted_regex: ^(data|stringData)$
    kms: arn:aws:kms:us-east-1:123456789012:key/staging-key-id
  
  # Development secrets - age key for local dev
  - path_regex: environments/dev/.*\.yaml$
    encrypted_regex: ^(data|stringData)$
    age: age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
# Encrypt secrets
sops -e secrets.yaml > secrets.enc.yaml

# Decrypt secrets
sops -d secrets.enc.yaml > secrets.yaml

# Edit encrypted file in place
sops secrets.enc.yaml
```

## Network Security

### Network Policies

```yaml
# Default deny all
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

---
# Allow DNS
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53

---
# Application-specific policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: api-server
  policyTypes:
    - Ingress
    - Egress
  
  ingress:
    # Allow from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
    
    # Allow from Prometheus
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: monitoring
          podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 9090
  
  egress:
    # Allow to database
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgresql
      ports:
        - protocol: TCP
          port: 5432
    
    # Allow to Redis
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: redis
      ports:
        - protocol: TCP
          port: 6379
    
    # Allow external HTTPS (APIs, etc)
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
            except:
              - 10.0.0.0/8
              - 172.16.0.0/12
              - 192.168.0.0/16
      ports:
        - protocol: TCP
          port: 443
```

### Service Mesh (Istio) mTLS

```yaml
# Enforce mTLS for all traffic
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: istio-system
spec:
  mtls:
    mode: STRICT

---
# Authorization policy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: api-server-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: api-server
  action: ALLOW
  rules:
    # Allow from frontend service
    - from:
        - source:
            principals:
              - cluster.local/ns/production/sa/frontend
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/*"]
    
    # Allow health checks from anywhere
    - to:
        - operation:
            methods: ["GET"]
            paths: ["/healthz", "/ready"]
```

## RBAC

### Kubernetes RBAC

```yaml
# Developer role - read most things, write to dev namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: developer
rules:
  # Read access to most resources
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "events"]
    verbs: ["get", "list", "watch"]
  
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch"]
  
  # Pod logs and exec
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get", "list"]
  
  # No access to secrets at cluster level
  # - apiGroups: [""]
  #   resources: ["secrets"]
  #   verbs: ["get", "list"]

---
# Developer can fully manage dev namespace
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-dev-admin
  namespace: dev
subjects:
  - kind: Group
    name: developers
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: admin
  apiGroup: rbac.authorization.k8s.io

---
# Platform team - cluster admin
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: platform-team-admin
subjects:
  - kind: Group
    name: platform-team
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
```

### AWS IAM for Kubernetes (IRSA)

```yaml
# Service Account with IAM role
apiVersion: v1
kind: ServiceAccount
metadata:
  name: api-server
  namespace: production
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/api-server-role

---
# IAM policy (Terraform)
resource "aws_iam_role" "api_server" {
  name = "api-server-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRoleWithWebIdentity"
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:production:api-server"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "api_server" {
  role = aws_iam_role.api_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
        ]
        Resource = "arn:aws:s3:::my-bucket/api-server/*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = "arn:aws:secretsmanager:us-east-1:123456789012:secret:production/api-server/*"
      }
    ]
  })
}
```

## Security Scanning Pipeline

```yaml
name: Security Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  # SAST - Static Application Security Testing
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
  
  # Secret scanning
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  
  # Dependency scanning
  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Dependency Review
        uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: high
  
  # Container scanning
  container:
    runs-on: ubuntu-latest
    needs: [sast, secrets, dependencies]
    steps:
      - uses: actions/checkout@v4
      
      - name: Build image
        run: docker build -t app:${{ github.sha }} .
      
      - name: Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'app:${{ github.sha }}'
          exit-code: '1'
          severity: 'CRITICAL,HIGH'
  
  # Infrastructure scanning
  infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: tfsec
        uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: terraform/
      
      - name: Checkov
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform/
          framework: terraform
```

## Common Pitfalls

### 1. Overly Permissive RBAC

```yaml
# Bad - too broad
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]

# Good - specific permissions
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "update"]
```

### 2. Secrets in Environment Variables

```yaml
# Bad - secrets visible in pod spec
env:
  - name: DATABASE_PASSWORD
    value: "supersecret"

# Good - secrets from Secret resource
env:
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: password
```

### 3. Running as Root

```yaml
# Bad - runs as root
spec:
  containers:
    - name: app
      image: app:latest

# Good - non-root with security context
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
    - name: app
      image: app:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
```

### 4. No Network Segmentation

```yaml
# Bad - no network policies (all pods can talk to all pods)

# Good - default deny with explicit allow
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```
