# NestCMS Helm Chart

A Helm chart for deploying the NestCMS Construction Company Management System on Kubernetes.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure (for MongoDB persistence)

## Installing the Chart

### Add Dependencies

First, add the required Helm repositories and update dependencies:

```bash
# Add Bitnami repository for MongoDB and Redis
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Update chart dependencies
cd charts/nestcms
helm dependency update
```

### Basic Installation

To install the chart with the release name `nestcms`:

```bash
helm install nestcms ./charts/nestcms
```

### Installation with Custom Values

```bash
helm install nestcms ./charts/nestcms \
  --set secrets.data.JWT_SECRET="your-super-secret-jwt-key" \
  --set secrets.data.PAYTABS_PROFILE_ID="your-paytabs-profile-id" \
  --set secrets.data.PAYTABS_SERVER_KEY="your-paytabs-server-key" \
  --set ingress.hosts[0].host="nestcms.yourdomain.com"
```

### Installation with External MongoDB

```bash
helm install nestcms ./charts/nestcms \
  --set mongodb.enabled=false \
  --set secrets.data.MONGO_URI="mongodb://username:password@your-mongodb-host:27017/nestcms" \
  --set secrets.data.JWT_SECRET="your-super-secret-jwt-key"
```

## Uninstalling the Chart

To uninstall/delete the `nestcms` deployment:

```bash
helm uninstall nestcms
```

## Configuration

The following table lists the configurable parameters of the NestCMS chart and their default values.

### Application Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of NestCMS replicas | `3` |
| `image.repository` | NestCMS image repository | `ghcr.io/abdoelhodaky/imgs/nestcms` |
| `image.tag` | NestCMS image tag | `1.0.0` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `imagePullSecrets` | Image pull secrets | `[{name: docker-secret}]` |

### Service Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `service.targetPort` | Container target port | `3000` |

### Ingress Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.className` | Ingress class name | `alb` |
| `ingress.annotations` | Ingress annotations | `{}` |
| `ingress.hosts` | Ingress hosts configuration | `[{host: nestcms.example.com, paths: [{path: /, pathType: Prefix}]}]` |
| `ingress.tls` | Ingress TLS configuration | `[]` |

### Resource Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.limits.cpu` | CPU limit | `500m` |
| `resources.limits.memory` | Memory limit | `512Mi` |
| `resources.requests.cpu` | CPU request | `250m` |
| `resources.requests.memory` | Memory request | `256Mi` |

### Autoscaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable horizontal pod autoscaler | `true` |
| `autoscaling.minReplicas` | Minimum number of replicas | `2` |
| `autoscaling.maxReplicas` | Maximum number of replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization | `80` |
| `autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization | `80` |

### Environment Variables

| Parameter | Description | Default |
|-----------|-------------|---------|
| `env` | Environment variables | `[{name: NODE_ENV, value: production}, {name: PORT, value: "3000"}]` |
| `secretEnv` | Secret environment variables | See values.yaml |

### Secrets Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.create` | Create secrets | `true` |
| `secrets.name` | Secret name | `nestcms-secrets` |
| `secrets.data.MONGO_URI` | MongoDB connection string | `""` |
| `secrets.data.JWT_SECRET` | JWT secret key | `""` |
| `secrets.data.PAYTABS_PROFILE_ID` | PayTabs profile ID | `""` |
| `secrets.data.PAYTABS_SERVER_KEY` | PayTabs server key | `""` |
| `secrets.data.PAYTABS_REGION` | PayTabs region | `ARE` |

### MongoDB Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `mongodb.enabled` | Deploy MongoDB as dependency | `true` |
| `mongodb.auth.enabled` | Enable MongoDB authentication | `true` |
| `mongodb.auth.rootUser` | MongoDB root username | `root` |
| `mongodb.auth.rootPassword` | MongoDB root password | `nestcms-root-password` |
| `mongodb.auth.username` | MongoDB application username | `nestcms` |
| `mongodb.auth.password` | MongoDB application password | `nestcms-password` |
| `mongodb.auth.database` | MongoDB database name | `nestcms` |
| `mongodb.persistence.enabled` | Enable MongoDB persistence | `true` |
| `mongodb.persistence.size` | MongoDB persistent volume size | `8Gi` |

### Redis Configuration (Optional)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `redis.enabled` | Deploy Redis as dependency | `false` |
| `redis.auth.enabled` | Enable Redis authentication | `true` |
| `redis.auth.password` | Redis password | `nestcms-redis-password` |
| `redis.persistence.enabled` | Enable Redis persistence | `true` |
| `redis.persistence.size` | Redis persistent volume size | `2Gi` |

### External MongoDB Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `externalMongodb.host` | External MongoDB host | `""` |
| `externalMongodb.port` | External MongoDB port | `27017` |
| `externalMongodb.database` | External MongoDB database | `nestcms` |
| `externalMongodb.username` | External MongoDB username | `""` |
| `externalMongodb.password` | External MongoDB password | `""` |
| `externalMongodb.uri` | External MongoDB connection URI | `""` |

## Examples

### Production Deployment with External MongoDB

```yaml
# values-production.yaml
replicaCount: 5

image:
  tag: "1.0.0"

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.nestcms.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: nestcms-tls
      hosts:
        - api.nestcms.com

mongodb:
  enabled: false

externalMongodb:
  uri: "mongodb+srv://username:password@cluster.mongodb.net/nestcms"

secrets:
  data:
    JWT_SECRET: "your-production-jwt-secret"
    PAYTABS_PROFILE_ID: "your-production-profile-id"
    PAYTABS_SERVER_KEY: "your-production-server-key"

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
```

Deploy with:

```bash
helm install nestcms ./charts/nestcms -f values-production.yaml
```

### Development Deployment with Internal MongoDB

```yaml
# values-development.yaml
replicaCount: 1

ingress:
  hosts:
    - host: nestcms.local
      paths:
        - path: /
          pathType: Prefix

mongodb:
  enabled: true
  auth:
    rootPassword: "dev-root-password"
    password: "dev-password"
  persistence:
    size: 2Gi

secrets:
  data:
    JWT_SECRET: "development-jwt-secret"
    PAYTABS_PROFILE_ID: "test-profile-id"
    PAYTABS_SERVER_KEY: "test-server-key"

resources:
  limits:
    cpu: 250m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
```

Deploy with:

```bash
helm install nestcms-dev ./charts/nestcms -f values-development.yaml
```

## Upgrading

To upgrade the NestCMS deployment:

```bash
helm upgrade nestcms ./charts/nestcms
```

## Monitoring

The chart includes health checks and readiness probes. You can monitor the deployment using:

```bash
# Check pod status
kubectl get pods -l app.kubernetes.io/name=nestcms

# View logs
kubectl logs -f deployment/nestcms

# Check service endpoints
kubectl get endpoints nestcms
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB pod status
   kubectl get pods -l app.kubernetes.io/name=mongodb
   
   # Check MongoDB logs
   kubectl logs -l app.kubernetes.io/name=mongodb
   ```

2. **Secret Configuration Issues**
   ```bash
   # Check if secrets are created
   kubectl get secrets nestcms-secrets
   
   # View secret data (base64 encoded)
   kubectl get secret nestcms-secrets -o yaml
   ```

3. **Ingress Issues**
   ```bash
   # Check ingress status
   kubectl get ingress nestcms
   
   # Describe ingress for events
   kubectl describe ingress nestcms
   ```

4. **Pod Startup Issues**
   ```bash
   # Check pod events
   kubectl describe pod <pod-name>
   
   # Check application logs
   kubectl logs <pod-name>
   ```

## Dependencies

This chart depends on the following charts:

- [bitnami/mongodb](https://github.com/bitnami/charts/tree/master/bitnami/mongodb) - For database storage
- [bitnami/redis](https://github.com/bitnami/charts/tree/master/bitnami/redis) - For caching (optional)

## Contributing

1. Make changes to the chart
2. Update the version in `Chart.yaml`
3. Update this README if needed
4. Test the changes:
   ```bash
   helm lint ./charts/nestcms
   helm template nestcms ./charts/nestcms
   ```

## License

This chart is licensed under the same license as the NestCMS application.

