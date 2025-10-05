# 🚀 NestCMS Deployment Guide

## Overview

This guide covers various deployment strategies for NestCMS, from development to production environments. Choose the deployment method that best fits your infrastructure and requirements.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher (LTS recommended)
- **MongoDB**: 4.4 or higher
- **Redis**: 6.x or higher (optional, for caching)
- **Memory**: Minimum 2GB RAM (4GB+ recommended for production)
- **Storage**: Minimum 10GB free space
- **Network**: HTTPS support for production

### Required Accounts
- **MongoDB Atlas** (for cloud database) or local MongoDB installation
- **PayTabs Account** for payment processing
- **Email Service** (Gmail, SendGrid, etc.) for notifications
- **Cloud Provider Account** (AWS, GCP, Azure) for cloud deployment

## Environment Configuration

### Environment Variables

Create a `.env` file with the following configuration:

```env
# Application Configuration
NODE_ENV=production
PORT=3000
APP_NAME=NestCMS
APP_VERSION=2.0.0

# Database Configuration
MONGO_URI=mongodb://localhost:27017/nestcms
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://[USERNAME]:[PASSWORD]@[CLUSTER].mongodb.net/nestcms

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=[YOUR_REDIS_PASSWORD]

# JWT Configuration
JWT_SECRET=[YOUR_SUPER_SECURE_JWT_SECRET_KEY_MIN_32_CHARS]
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# PayTabs Configuration
PAYTABS_PROFILE_ID=[YOUR_PAYTABS_PROFILE_ID]
PAYTABS_SERVER_KEY=[YOUR_PAYTABS_SERVER_KEY]
PAYTABS_REGION=ARE  # or your region code
PAYTABS_CURRENCY=USD
PAYTABS_CALLBACK_URL=https://your-domain.com/api/payments/callback
PAYTABS_RETURN_URL=https://your-domain.com/payment/success

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Security Configuration
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/nestcms.log

# Health Check Configuration
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000
```

### Environment-Specific Configurations

#### Development Environment
```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3001
```

#### Staging Environment
```env
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.your-domain.com
```

#### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://your-domain.com
```

## Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/abdoElHodaky/Nestcms.git
cd Nestcms

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod

# Start Redis (optional)
redis-server

# Run the application
npm run start:dev
```

### Development with Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f nestcms

# Stop services
docker-compose down
```

## Docker Deployment

### Single Container Deployment

#### Build Docker Image
```bash
# Build the image
docker build -t nestcms:latest .

# Run the container
docker run -d \
  --name nestcms \
  -p 3000:3000 \
  --env-file .env \
  nestcms:latest
```

#### Multi-Stage Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Docker Compose Deployment

#### Production Docker Compose
```yaml
version: '3.8'

services:
  nestcms:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/nestcms
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=nestcms
    volumes:
      - mongo_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - nestcms
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

#### Nginx Configuration
```nginx
events {
    worker_connections 1024;
}

http {
    upstream nestcms {
        server nestcms:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://nestcms;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /docs {
            proxy_pass http://nestcms/docs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## Kubernetes Deployment

### Kubernetes Manifests

#### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: nestcms
```

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nestcms-config
  namespace: nestcms
data:
  NODE_ENV: "production"
  PORT: "3000"
  MONGO_URI: "mongodb://mongo-service:27017/nestcms"
  REDIS_URL: "redis://redis-service:6379"
```

#### Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: nestcms-secrets
  namespace: nestcms
type: Opaque
stringData:
  JWT_SECRET: "your-super-secure-jwt-secret"
  PAYTABS_SERVER_KEY: "your-paytabs-server-key"
  SMTP_PASS: "your-email-password"
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nestcms-deployment
  namespace: nestcms
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nestcms
  template:
    metadata:
      labels:
        app: nestcms
    spec:
      containers:
      - name: nestcms
        image: nestcms:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: nestcms-config
        - secretRef:
            name: nestcms-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: nestcms-service
  namespace: nestcms
spec:
  selector:
    app: nestcms
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nestcms-ingress
  namespace: nestcms
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: nestcms-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nestcms-service
            port:
              number: 80
```

### Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n nestcms

# View logs
kubectl logs -f deployment/nestcms-deployment -n nestcms

# Scale deployment
kubectl scale deployment nestcms-deployment --replicas=5 -n nestcms
```

## Cloud Deployment

### AWS Deployment

#### Using AWS ECS
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name nestcms-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster nestcms-cluster \
  --service-name nestcms-service \
  --task-definition nestcms:1 \
  --desired-count 2
```

#### Using AWS Elastic Beanstalk
```bash
# Initialize Elastic Beanstalk
eb init nestcms --platform node.js

# Create environment
eb create production

# Deploy application
eb deploy
```

### Google Cloud Platform

#### Using Google Cloud Run
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/nestcms

# Deploy to Cloud Run
gcloud run deploy nestcms \
  --image gcr.io/PROJECT_ID/nestcms \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Microsoft Azure

#### Using Azure Container Instances
```bash
# Create resource group
az group create --name nestcms-rg --location eastus

# Create container instance
az container create \
  --resource-group nestcms-rg \
  --name nestcms \
  --image nestcms:latest \
  --dns-name-label nestcms-app \
  --ports 3000
```

## Production Considerations

### Performance Optimization

#### Application Level
- Enable production mode: `NODE_ENV=production`
- Use clustering for multi-core utilization
- Implement caching strategies with Redis
- Optimize database queries and indexes
- Enable compression middleware

#### Database Optimization
```javascript
// MongoDB connection with production settings
MongooseModule.forRoot(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
})
```

### Security Hardening

#### Application Security
- Use HTTPS in production
- Implement rate limiting
- Enable CORS with specific origins
- Use security headers (Helmet.js)
- Validate all inputs
- Implement proper error handling

#### Infrastructure Security
- Use firewalls and security groups
- Implement network segmentation
- Use secrets management services
- Enable audit logging
- Regular security updates

### Scaling Strategies

#### Horizontal Scaling
- Load balancer configuration
- Multiple application instances
- Database read replicas
- CDN for static assets

#### Vertical Scaling
- Increase server resources
- Optimize memory usage
- CPU optimization
- Storage optimization

## Monitoring & Logging

### Application Monitoring
```javascript
// Health check endpoint
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
}
```

### Logging Configuration
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Monitoring Tools
- **Application Performance**: New Relic, DataDog, AppDynamics
- **Infrastructure**: Prometheus + Grafana, CloudWatch
- **Error Tracking**: Sentry, Bugsnag
- **Uptime Monitoring**: Pingdom, UptimeRobot

## Backup & Recovery

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/nestcms" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --uri="$MONGO_URI" --out=$BACKUP_DIR
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### Application Backup
```bash
# Backup application files
tar -czf nestcms-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=logs \
  /path/to/nestcms
```

### Recovery Procedures
1. **Database Recovery**: Restore from MongoDB backup
2. **Application Recovery**: Deploy from backup or Git repository
3. **Configuration Recovery**: Restore environment variables and secrets
4. **File Recovery**: Restore uploaded files and documents

## Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Check MongoDB connection
mongo --eval "db.adminCommand('ismaster')"

# Check Redis connection
redis-cli ping

# Check application health
curl http://localhost:3000/health
```

#### Performance Issues
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h

# Check application logs
tail -f logs/nestcms.log
```

#### Database Issues
```bash
# Check MongoDB status
systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Check database connections
db.serverStatus().connections
```

### Log Analysis
```bash
# Search for errors
grep -i error logs/nestcms.log

# Monitor real-time logs
tail -f logs/nestcms.log | grep -i error

# Analyze access patterns
awk '{print $1}' access.log | sort | uniq -c | sort -nr
```

## Maintenance

### Regular Maintenance Tasks
- **Daily**: Monitor application health and performance
- **Weekly**: Review logs and error reports
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Performance optimization and capacity planning

### Update Procedures
1. **Backup**: Create full system backup
2. **Test**: Deploy to staging environment
3. **Deploy**: Rolling deployment to production
4. **Verify**: Health checks and functionality testing
5. **Monitor**: Watch for issues post-deployment

---

This deployment guide provides comprehensive instructions for deploying NestCMS in various environments. Choose the deployment strategy that best fits your requirements and infrastructure capabilities.
