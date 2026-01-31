# Kubernetes Patterns

Guidelines for deploying and managing workloads on Kubernetes at scale.

## Core Principles

1. **Declarative Configuration** - Define desired state, let controllers reconcile
2. **Resource Limits Always** - Every container needs requests and limits
3. **Security by Default** - Non-root, read-only filesystems, no privilege escalation
4. **High Availability** - Multiple replicas, spread across failure domains

## Resource Management

### Pod Specification

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-server
  labels:
    app.kubernetes.io/name: api-server
    app.kubernetes.io/version: "1.2.3"
    app.kubernetes.io/component: backend
    app.kubernetes.io/part-of: my-app
    app.kubernetes.io/managed-by: helm
spec:
  serviceAccountName: api-server
  
  # Security context at pod level
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault
  
  containers:
    - name: api-server
      image: company/api-server:v1.2.3
      
      # Always specify resources
      resources:
        requests:
          cpu: "100m"
          memory: "256Mi"
        limits:
          cpu: "500m"
          memory: "512Mi"
      
      # Container security context
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      
      # Health probes
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
      
      # Graceful shutdown
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 10"]
      
      # Environment from ConfigMap/Secret
      envFrom:
        - configMapRef:
            name: api-server-config
        - secretRef:
            name: api-server-secrets
      
      # Volume mounts
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /var/cache
  
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir:
        sizeLimit: 100Mi
  
  # Termination grace period
  terminationGracePeriodSeconds: 30
```

### Deployment Best Practices

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  annotations:
    reloader.stakater.com/auto: "true"  # Auto-restart on config changes
spec:
  replicas: 3
  
  # Rolling update strategy
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
  selector:
    matchLabels:
      app.kubernetes.io/name: api-server
  
  template:
    metadata:
      labels:
        app.kubernetes.io/name: api-server
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      # Spread across zones
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: api-server
      
      # Prefer spreading across nodes
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app.kubernetes.io/name: api-server
                topologyKey: kubernetes.io/hostname
      
      containers:
        - name: api-server
          # ... container spec
```

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  
  minReplicas: 3
  maxReplicas: 20
  
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    
    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    
    # Custom metrics (requests per second)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-server
spec:
  # Ensure at least 2 pods are always available
  minAvailable: 2
  # OR use maxUnavailable
  # maxUnavailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: api-server
```

## Networking

### Service Definition

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server
  labels:
    app.kubernetes.io/name: api-server
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: api-server
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
```

### Network Policies

```yaml
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
# Allow traffic from ingress controller and specific pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-server-network-policy
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
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
    
    # Allow from frontend pods
    - from:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: frontend
      ports:
        - protocol: TCP
          port: 8080
    
    # Allow Prometheus scraping
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
      ports:
        - protocol: TCP
          port: 9090
  
  egress:
    # Allow DNS
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
    
    # Allow database access
    - to:
        - podSelector:
            matchLabels:
              app.kubernetes.io/name: postgresql
      ports:
        - protocol: TCP
          port: 5432
    
    # Allow external HTTPS
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - protocol: TCP
          port: 443
```

### Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-server
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-server-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-server
                port:
                  number: 80
```

## Configuration Management

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-server-config
data:
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
  CACHE_TTL: "300"
  
  # File-based config
  config.yaml: |
    server:
      port: 8080
      readTimeout: 30s
      writeTimeout: 30s
    features:
      enableNewUI: true
      enableBetaAPI: false
```

### External Secrets

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-server-secrets
spec:
  refreshInterval: 1h
  
  secretStoreRef:
    kind: ClusterSecretStore
    name: vault-backend
  
  target:
    name: api-server-secrets
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .username }}:{{ .password }}@db.example.com:5432/api"
  
  data:
    - secretKey: username
      remoteRef:
        key: secret/data/api-server/database
        property: username
    
    - secretKey: password
      remoteRef:
        key: secret/data/api-server/database
        property: password
```

## Helm Charts

### Chart Structure

```
charts/api-server/
├── Chart.yaml
├── values.yaml
├── values-dev.yaml
├── values-staging.yaml
├── values-production.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── networkpolicy.yaml
│   ├── configmap.yaml
│   ├── serviceaccount.yaml
│   ├── servicemonitor.yaml
│   └── NOTES.txt
└── tests/
    └── test-connection.yaml
```

### Chart.yaml

```yaml
apiVersion: v2
name: api-server
description: API Server Helm chart
type: application
version: 1.0.0
appVersion: "1.2.3"

dependencies:
  - name: common
    version: 1.x.x
    repository: https://charts.example.com

maintainers:
  - name: Platform Team
    email: platform@example.com
```

### values.yaml

```yaml
# Default values
replicaCount: 3

image:
  repository: company/api-server
  pullPolicy: IfNotPresent
  tag: ""  # Defaults to Chart appVersion

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations: {}

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts: []
  tls: []

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}
tolerations: []
affinity: {}

config:
  logLevel: info
  logFormat: json
```

### Template Helpers

```yaml
# templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "api-server.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "api-server.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "api-server.labels" -}}
helm.sh/chart: {{ include "api-server.chart" . }}
{{ include "api-server.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "api-server.selectorLabels" -}}
app.kubernetes.io/name: {{ include "api-server.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

## Multi-Cluster Strategies

### Cluster Federation

```yaml
# KubeFed FederatedDeployment
apiVersion: types.kubefed.io/v1beta1
kind: FederatedDeployment
metadata:
  name: api-server
  namespace: production
spec:
  template:
    spec:
      replicas: 3
      selector:
        matchLabels:
          app: api-server
      template:
        spec:
          containers:
            - name: api-server
              image: company/api-server:v1.2.3
  
  placement:
    clusters:
      - name: cluster-us-east
      - name: cluster-us-west
      - name: cluster-eu-west
  
  overrides:
    - clusterName: cluster-us-east
      clusterOverrides:
        - path: "/spec/replicas"
          value: 5
```

### GitOps Multi-Cluster

```yaml
# Argo CD ApplicationSet for multi-cluster
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: api-server
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - cluster: cluster-us-east
            url: https://us-east.k8s.example.com
            values:
              replicas: "5"
          - cluster: cluster-us-west
            url: https://us-west.k8s.example.com
            values:
              replicas: "3"
          - cluster: cluster-eu-west
            url: https://eu-west.k8s.example.com
            values:
              replicas: "3"
  
  template:
    metadata:
      name: 'api-server-{{cluster}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/company/gitops.git
        targetRevision: HEAD
        path: apps/api-server
        helm:
          values: |
            replicaCount: {{values.replicas}}
      destination:
        server: '{{url}}'
        namespace: production
```

## Troubleshooting Commands

```bash
# Pod issues
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
kubectl logs <pod-name> -c <container-name>
kubectl exec -it <pod-name> -- /bin/sh

# Resource usage
kubectl top pods
kubectl top nodes
kubectl describe node <node-name>

# Network debugging
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
kubectl port-forward svc/api-server 8080:80

# Events
kubectl get events --sort-by='.lastTimestamp'
kubectl get events --field-selector type=Warning

# Resource validation
kubectl diff -f manifest.yaml
kubectl apply --dry-run=server -f manifest.yaml
```
