# 🎨 **BEAUTIFUL SYSTEM ARCHITECTURE DIAGRAMS**

## 🏗️ **COMPREHENSIVE NESTCMS SYSTEM ARCHITECTURE**

> **Status: ✅ ENHANCED** - Beautiful, comprehensive architectural diagrams with stunning visual design and detailed component descriptions!

---

## 🌟 **OVERVIEW ARCHITECTURE**

```mermaid
graph TB
    %% Styling
    classDef clientClass fill:#e1f5fe,stroke:#01579b,stroke-width:3px,color:#000
    classDef gatewayClass fill:#f3e5f5,stroke:#4a148c,stroke-width:3px,color:#000
    classDef appClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:3px,color:#000
    classDef serviceClass fill:#fff3e0,stroke:#e65100,stroke-width:3px,color:#000
    classDef dataClass fill:#fce4ec,stroke:#880e4f,stroke-width:3px,color:#000
    classDef cacheClass fill:#f1f8e9,stroke:#33691e,stroke-width:3px,color:#000
    classDef paymentClass fill:#fff8e1,stroke:#ff6f00,stroke-width:3px,color:#000
    classDef monitorClass fill:#e0f2f1,stroke:#00695c,stroke-width:3px,color:#000

    %% Client Layer
    subgraph "🌐 CLIENT ECOSYSTEM"
        WEB[🖥️ Web Dashboard<br/>React/Angular SPA<br/>Real-time Updates]
        MOBILE[📱 Mobile App<br/>React Native<br/>Push Notifications]
        API_CLIENT[🔌 API Clients<br/>Third-party Integrations<br/>Webhook Consumers]
    end

    %% Gateway Layer
    subgraph "🚪 API GATEWAY & SECURITY"
        NGINX[🔒 NGINX Proxy<br/>Load Balancer<br/>SSL Termination<br/>Rate Limiting]
        AUTH[🛡️ Authentication<br/>JWT Tokens<br/>Role-based Access<br/>Session Management]
    end

    %% Application Layer
    subgraph "🏢 NESTCMS APPLICATION LAYER"
        MAIN_APP[🚀 NestJS Application<br/>Port: 3000<br/>Microservices Architecture]
        
        subgraph "📊 CORE SERVICES"
            USER_SVC[👥 User Service<br/>Authentication & Authorization<br/>Profile Management<br/>Permissions & Roles]
            PROJECT_SVC[📋 Project Service<br/>Project Management<br/>Task Tracking<br/>Progress Monitoring]
            CONTRACT_SVC[📄 Contract Service<br/>Contract Management<br/>Terms & Conditions<br/>Legal Compliance]
            EARNING_SVC[💰 Earnings Service<br/>Payment Calculations<br/>Revenue Tracking<br/>Financial Reports]
        end
        
        subgraph "💳 PAYMENT ECOSYSTEM"
            PAYMENT_SVC[💳 Enhanced Payment Service<br/>Multi-provider Support<br/>Transaction Management<br/>Payment History]
            PAYTABS_SVC[🏦 PayTabs Integration<br/>Error Handling & Resilience<br/>Webhook Security<br/>Signature Verification]
            WEBHOOK_SEC[🔐 Webhook Security<br/>HMAC Verification<br/>Replay Prevention<br/>IP Whitelisting]
        end
        
        subgraph "🔧 INFRASTRUCTURE SERVICES"
            CIRCUIT_SVC[⚡ Circuit Breaker<br/>Service Protection<br/>Failure Detection<br/>Auto Recovery]
            CACHE_SVC[🚀 Cache Service<br/>Redis Integration<br/>Performance Optimization<br/>TTL Management]
            HEALTH_SVC[🏥 Health Service<br/>System Monitoring<br/>Service Status<br/>Performance Metrics]
            AGGREGATION_SVC[📈 Aggregation Service<br/>Data Processing<br/>Analytics Pipeline<br/>Report Generation]
        end
    end

    %% Data Layer
    subgraph "🗃️ DATA PERSISTENCE LAYER"
        MONGO_PRIMARY[🗄️ MongoDB Primary<br/>Write Operations<br/>Connection Pool: 10<br/>High Availability]
        
        subgraph "📚 READ REPLICAS"
            MONGO_R1[📊 Analytics Replica<br/>User Analytics<br/>Performance Metrics<br/>Zone: Analytics]
            MONGO_R2[📋 Reporting Replica<br/>Project Reports<br/>Business Intelligence<br/>Zone: Reporting]
            MONGO_R3[🔢 Aggregation Replica<br/>Complex Calculations<br/>Data Processing<br/>Zone: Aggregation]
        end
        
        REDIS_CACHE[⚡ Redis Cache Cluster<br/>Session Storage<br/>Query Caching<br/>Real-time Data]
    end

    %% External Services
    subgraph "🌍 EXTERNAL INTEGRATIONS"
        PAYTABS_API[🏦 PayTabs API<br/>Payment Processing<br/>Transaction Verification<br/>Webhook Callbacks]
        EMAIL_SVC[📧 Email Service<br/>Notifications<br/>Transactional Emails<br/>Marketing Campaigns]
        SMS_SVC[📱 SMS Service<br/>OTP Verification<br/>Alerts & Notifications<br/>Two-factor Auth]
        STORAGE_SVC[☁️ Cloud Storage<br/>File Management<br/>Document Storage<br/>Media Assets]
    end

    %% Monitoring Layer
    subgraph "📊 MONITORING & OBSERVABILITY"
        METRICS[📈 Metrics Collection<br/>Prometheus/Grafana<br/>Performance Monitoring<br/>Custom Dashboards]
        LOGS[📝 Centralized Logging<br/>ELK Stack<br/>Error Tracking<br/>Audit Trails]
        ALERTS[🚨 Alerting System<br/>Real-time Notifications<br/>Incident Management<br/>SLA Monitoring]
    end

    %% Connections
    WEB --> NGINX
    MOBILE --> NGINX
    API_CLIENT --> NGINX
    
    NGINX --> AUTH
    AUTH --> MAIN_APP
    
    MAIN_APP --> USER_SVC
    MAIN_APP --> PROJECT_SVC
    MAIN_APP --> CONTRACT_SVC
    MAIN_APP --> EARNING_SVC
    MAIN_APP --> PAYMENT_SVC
    
    PAYMENT_SVC --> PAYTABS_SVC
    PAYTABS_SVC --> WEBHOOK_SEC
    PAYTABS_SVC --> CIRCUIT_SVC
    
    USER_SVC --> CACHE_SVC
    PROJECT_SVC --> CACHE_SVC
    CONTRACT_SVC --> CACHE_SVC
    EARNING_SVC --> AGGREGATION_SVC
    
    MAIN_APP --> HEALTH_SVC
    HEALTH_SVC --> METRICS
    
    USER_SVC --> MONGO_PRIMARY
    PROJECT_SVC --> MONGO_PRIMARY
    CONTRACT_SVC --> MONGO_PRIMARY
    EARNING_SVC --> MONGO_PRIMARY
    PAYMENT_SVC --> MONGO_PRIMARY
    
    AGGREGATION_SVC --> MONGO_R1
    AGGREGATION_SVC --> MONGO_R2
    AGGREGATION_SVC --> MONGO_R3
    
    CACHE_SVC --> REDIS_CACHE
    
    PAYTABS_SVC --> PAYTABS_API
    MAIN_APP --> EMAIL_SVC
    MAIN_APP --> SMS_SVC
    MAIN_APP --> STORAGE_SVC
    
    MAIN_APP --> LOGS
    HEALTH_SVC --> ALERTS

    %% Apply styles
    class WEB,MOBILE,API_CLIENT clientClass
    class NGINX,AUTH gatewayClass
    class MAIN_APP,USER_SVC,PROJECT_SVC,CONTRACT_SVC,EARNING_SVC appClass
    class CIRCUIT_SVC,CACHE_SVC,HEALTH_SVC,AGGREGATION_SVC serviceClass
    class MONGO_PRIMARY,MONGO_R1,MONGO_R2,MONGO_R3 dataClass
    class REDIS_CACHE cacheClass
    class PAYMENT_SVC,PAYTABS_SVC,WEBHOOK_SEC,PAYTABS_API paymentClass
    class METRICS,LOGS,ALERTS,EMAIL_SVC,SMS_SVC,STORAGE_SVC monitorClass
```

---

## 🔄 **DATA FLOW ARCHITECTURE**

```mermaid
flowchart TD
    %% Styling
    classDef requestClass fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef processClass fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
    classDef dataClass fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef responseClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px

    %% Request Flow
    START([🚀 Client Request]) --> VALIDATE{🔍 Request Validation}
    VALIDATE -->|✅ Valid| AUTH_CHECK{🛡️ Authentication}
    VALIDATE -->|❌ Invalid| ERROR_RESP[❌ Error Response]
    
    AUTH_CHECK -->|✅ Authenticated| ROUTE{🎯 Route Request}
    AUTH_CHECK -->|❌ Unauthorized| UNAUTH_RESP[🚫 Unauthorized Response]
    
    %% Service Routing
    ROUTE -->|👥 User Operations| USER_FLOW[👥 User Service Flow]
    ROUTE -->|📋 Project Operations| PROJECT_FLOW[📋 Project Service Flow]
    ROUTE -->|💰 Payment Operations| PAYMENT_FLOW[💳 Payment Service Flow]
    ROUTE -->|📊 Analytics| ANALYTICS_FLOW[📊 Analytics Flow]
    
    %% User Service Flow
    USER_FLOW --> USER_CACHE{🚀 Check Cache}
    USER_CACHE -->|Hit| CACHE_RESP[⚡ Cached Response]
    USER_CACHE -->|Miss| USER_DB[🗄️ Query Primary DB]
    USER_DB --> UPDATE_CACHE[📝 Update Cache]
    UPDATE_CACHE --> USER_RESP[✅ User Response]
    
    %% Project Service Flow
    PROJECT_FLOW --> PROJECT_VALIDATE{✅ Validate Project Data}
    PROJECT_VALIDATE -->|Valid| PROJECT_DB[🗄️ Project Database]
    PROJECT_VALIDATE -->|Invalid| PROJECT_ERROR[❌ Validation Error]
    PROJECT_DB --> PROJECT_CACHE[🚀 Update Cache]
    PROJECT_CACHE --> PROJECT_RESP[✅ Project Response]
    
    %% Payment Service Flow
    PAYMENT_FLOW --> PAYMENT_VALIDATE{💳 Validate Payment}
    PAYMENT_VALIDATE -->|Valid| CIRCUIT_CHECK{⚡ Circuit Breaker}
    PAYMENT_VALIDATE -->|Invalid| PAYMENT_ERROR[❌ Payment Error]
    
    CIRCUIT_CHECK -->|Open| FALLBACK[🔄 Fallback Response]
    CIRCUIT_CHECK -->|Closed| PAYTABS_API[🏦 PayTabs API Call]
    
    PAYTABS_API -->|Success| PAYMENT_SUCCESS[✅ Payment Success]
    PAYTABS_API -->|Failure| ERROR_HANDLER[🛠️ Error Handler]
    
    ERROR_HANDLER --> RETRY_LOGIC{🔄 Retry Logic}
    RETRY_LOGIC -->|Retry| PAYTABS_API
    RETRY_LOGIC -->|Max Retries| PAYMENT_FAILED[❌ Payment Failed]
    
    PAYMENT_SUCCESS --> WEBHOOK_VERIFY[🔐 Webhook Verification]
    WEBHOOK_VERIFY --> PAYMENT_RESP[✅ Payment Response]
    
    %% Analytics Flow
    ANALYTICS_FLOW --> REPLICA_SELECT{📊 Select Replica}
    REPLICA_SELECT -->|Analytics| ANALYTICS_REPLICA[📈 Analytics Replica]
    REPLICA_SELECT -->|Reporting| REPORTING_REPLICA[📋 Reporting Replica]
    REPLICA_SELECT -->|Aggregation| AGGREGATION_REPLICA[🔢 Aggregation Replica]
    
    ANALYTICS_REPLICA --> ANALYTICS_CACHE[🚀 Analytics Cache]
    REPORTING_REPLICA --> REPORTING_CACHE[🚀 Reporting Cache]
    AGGREGATION_REPLICA --> AGGREGATION_CACHE[🚀 Aggregation Cache]
    
    ANALYTICS_CACHE --> ANALYTICS_RESP[📊 Analytics Response]
    REPORTING_CACHE --> REPORTING_RESP[📋 Reporting Response]
    AGGREGATION_CACHE --> AGGREGATION_RESP[🔢 Aggregation Response]
    
    %% Response Aggregation
    CACHE_RESP --> FINAL_RESP[🎉 Final Response]
    USER_RESP --> FINAL_RESP
    PROJECT_RESP --> FINAL_RESP
    PAYMENT_RESP --> FINAL_RESP
    ANALYTICS_RESP --> FINAL_RESP
    REPORTING_RESP --> FINAL_RESP
    AGGREGATION_RESP --> FINAL_RESP
    
    %% Error Responses
    ERROR_RESP --> FINAL_RESP
    UNAUTH_RESP --> FINAL_RESP
    PROJECT_ERROR --> FINAL_RESP
    PAYMENT_ERROR --> FINAL_RESP
    PAYMENT_FAILED --> FINAL_RESP
    FALLBACK --> FINAL_RESP
    
    FINAL_RESP --> END([📤 Response to Client])

    %% Apply styles
    class START,VALIDATE,AUTH_CHECK,ROUTE requestClass
    class USER_FLOW,PROJECT_FLOW,PAYMENT_FLOW,ANALYTICS_FLOW processClass
    class USER_DB,PROJECT_DB,ANALYTICS_REPLICA,REPORTING_REPLICA,AGGREGATION_REPLICA dataClass
    class FINAL_RESP,USER_RESP,PROJECT_RESP,PAYMENT_RESP,ANALYTICS_RESP,END responseClass
```

---

## 💳 **PAYMENT PROCESSING ARCHITECTURE**

```mermaid
graph TB
    %% Styling
    classDef clientClass fill:#e1f5fe,stroke:#01579b,stroke-width:3px,color:#000
    classDef paymentClass fill:#fff8e1,stroke:#ff6f00,stroke-width:3px,color:#000
    classDef securityClass fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000
    classDef resilienceClass fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#000
    classDef dataClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:3px,color:#000

    %% Client Request
    CLIENT[🖥️ Client Application<br/>Payment Request<br/>User Interface] --> PAYMENT_CTRL[💳 Enhanced Payments V3 Controller<br/>Input Validation<br/>Authentication<br/>Rate Limiting]

    %% Payment Processing Layer
    subgraph "💳 PAYMENT PROCESSING LAYER"
        PAYMENT_CTRL --> PAYMENT_SVC[💰 Enhanced Payment Service<br/>Business Logic<br/>Transaction Management<br/>Multi-provider Support]
        
        PAYMENT_SVC --> PAYTABS_RESILIENT[🏦 PayTabs Resilient Service<br/>Error Handling<br/>Circuit Breaker<br/>Retry Logic]
        
        subgraph "🛡️ ERROR HANDLING & RESILIENCE"
            ERROR_HANDLER[🔧 Error Handler Service<br/>20+ Error Types<br/>Recovery Strategies<br/>Audit Logging]
            CIRCUIT_BREAKER[⚡ Circuit Breaker<br/>Service Protection<br/>Failure Detection<br/>Auto Recovery]
            RETRY_SERVICE[🔄 Retry Service<br/>Exponential Backoff<br/>Jitter Algorithm<br/>Max Attempts: 3]
        end
        
        subgraph "🔐 WEBHOOK SECURITY"
            WEBHOOK_SEC[🛡️ Webhook Security Service<br/>HMAC Verification<br/>Signature Validation<br/>Multi-layer Security]
            SIGNATURE_VERIFY[✍️ Signature Verification<br/>SHA-256/SHA-512<br/>Constant-time Comparison<br/>Timestamp Validation]
            REPLAY_PREVENTION[🚫 Replay Prevention<br/>Request Fingerprinting<br/>Duplicate Detection<br/>Memory Management]
        end
    end

    %% External Integration
    subgraph "🌍 EXTERNAL PAYMENT GATEWAY"
        PAYTABS_API[🏦 PayTabs API<br/>Payment Processing<br/>Transaction Verification<br/>Webhook Callbacks]
        PAYTABS_WEBHOOK[📡 PayTabs Webhook<br/>Real-time Notifications<br/>Payment Status Updates<br/>Transaction Events]
    end

    %% Data Layer
    subgraph "🗃️ DATA PERSISTENCE"
        PAYMENT_DB[💾 Payment Database<br/>Transaction Records<br/>Payment History<br/>Audit Trails]
        CACHE_LAYER[⚡ Cache Layer<br/>Payment Sessions<br/>Verification Results<br/>Performance Optimization]
        AUDIT_LOG[📝 Audit Logging<br/>Error History<br/>Security Events<br/>Performance Metrics]
    end

    %% Monitoring
    subgraph "📊 MONITORING & METRICS"
        HEALTH_MONITOR[🏥 Health Monitoring<br/>Service Status<br/>Performance Metrics<br/>Error Rates]
        SECURITY_MONITOR[🔒 Security Monitoring<br/>Threat Detection<br/>Signature Failures<br/>IP Violations]
        PERFORMANCE_METRICS[📈 Performance Metrics<br/>Response Times<br/>Success Rates<br/>Circuit Breaker State]
    end

    %% Connections
    PAYTABS_RESILIENT --> ERROR_HANDLER
    PAYTABS_RESILIENT --> CIRCUIT_BREAKER
    PAYTABS_RESILIENT --> RETRY_SERVICE
    
    PAYTABS_RESILIENT --> PAYTABS_API
    PAYTABS_API --> PAYTABS_WEBHOOK
    
    PAYTABS_WEBHOOK --> WEBHOOK_SEC
    WEBHOOK_SEC --> SIGNATURE_VERIFY
    WEBHOOK_SEC --> REPLAY_PREVENTION
    
    PAYMENT_SVC --> PAYMENT_DB
    PAYTABS_RESILIENT --> CACHE_LAYER
    ERROR_HANDLER --> AUDIT_LOG
    
    PAYMENT_SVC --> HEALTH_MONITOR
    WEBHOOK_SEC --> SECURITY_MONITOR
    PAYTABS_RESILIENT --> PERFORMANCE_METRICS

    %% Apply styles
    class CLIENT clientClass
    class PAYMENT_CTRL,PAYMENT_SVC,PAYTABS_RESILIENT,PAYTABS_API paymentClass
    class WEBHOOK_SEC,SIGNATURE_VERIFY,REPLAY_PREVENTION,SECURITY_MONITOR securityClass
    class ERROR_HANDLER,CIRCUIT_BREAKER,RETRY_SERVICE resilienceClass
    class PAYMENT_DB,CACHE_LAYER,AUDIT_LOG,HEALTH_MONITOR,PERFORMANCE_METRICS dataClass
```

---

## 🗃️ **DATABASE ARCHITECTURE WITH READ REPLICAS**

```mermaid
graph TB
    %% Styling
    classDef appClass fill:#e8f5e8,stroke:#2e7d32,stroke-width:3px,color:#000
    classDef primaryClass fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000
    classDef replicaClass fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000
    classDef cacheClass fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000
    classDef monitorClass fill:#f1f8e9,stroke:#558b2f,stroke-width:3px,color:#000

    %% Application Layer
    subgraph "🏢 APPLICATION SERVICES"
        USER_SVC[👥 User Service<br/>Authentication<br/>Profile Management<br/>Permissions]
        PROJECT_SVC[📋 Project Service<br/>Project Management<br/>Task Tracking<br/>Progress Reports]
        CONTRACT_SVC[📄 Contract Service<br/>Contract Management<br/>Legal Documents<br/>Terms & Conditions]
        EARNING_SVC[💰 Earnings Service<br/>Payment Calculations<br/>Revenue Tracking<br/>Financial Reports]
        AGGREGATION_SVC[📊 Aggregation Service<br/>Data Processing<br/>Analytics Pipeline<br/>Complex Queries]
    end

    %% Database Cluster
    subgraph "🗃️ MONGODB REPLICA SET CLUSTER"
        MONGO_PRIMARY[🗄️ MongoDB Primary<br/>nestcms-rs-primary<br/>Port: 27017<br/>Write Operations<br/>Connection Pool: 10<br/>WiredTiger Cache: 1GB]
        
        subgraph "📚 READ REPLICAS"
            MONGO_ANALYTICS[📊 Analytics Replica<br/>nestcms-rs-replica1<br/>Port: 27018<br/>Zone: analytics<br/>User Analytics<br/>Performance Metrics<br/>Cache: 0.5GB]
            
            MONGO_REPORTING[📋 Reporting Replica<br/>nestcms-rs-replica2<br/>Port: 27019<br/>Zone: reporting<br/>Project Reports<br/>Business Intelligence<br/>Cache: 0.5GB]
            
            MONGO_AGGREGATION[🔢 Aggregation Replica<br/>nestcms-rs-replica3<br/>Port: 27020<br/>Zone: aggregation<br/>Complex Calculations<br/>Data Processing<br/>Cache: 0.5GB]
        end
    end

    %% Cache Layer
    subgraph "⚡ CACHE INFRASTRUCTURE"
        REDIS_CLUSTER[🚀 Redis Cache Cluster<br/>Port: 6379<br/>Session Storage<br/>Query Caching<br/>Real-time Data<br/>TTL Management]
        
        subgraph "🎯 SPECIALIZED CACHES"
            USER_CACHE[👥 User Cache<br/>Profile Data<br/>Permissions<br/>TTL: 30min]
            PROJECT_CACHE[📋 Project Cache<br/>Project Details<br/>Task Status<br/>TTL: 15min]
            ANALYTICS_CACHE[📊 Analytics Cache<br/>Aggregated Data<br/>Reports<br/>TTL: 1hour]
        end
    end

    %% Monitoring
    subgraph "📊 DATABASE MONITORING"
        REPLICA_MONITOR[🔍 Replica Monitoring<br/>Replication Lag<br/>Health Status<br/>Performance Metrics]
        CONNECTION_MONITOR[🔗 Connection Monitoring<br/>Pool Usage<br/>Active Connections<br/>Query Performance]
        CACHE_MONITOR[⚡ Cache Monitoring<br/>Hit Rates<br/>Memory Usage<br/>Eviction Policies]
    end

    %% Write Operations
    USER_SVC -->|Write| MONGO_PRIMARY
    PROJECT_SVC -->|Write| MONGO_PRIMARY
    CONTRACT_SVC -->|Write| MONGO_PRIMARY
    EARNING_SVC -->|Write| MONGO_PRIMARY

    %% Read Operations - Intelligent Routing
    USER_SVC -->|Analytics Queries| MONGO_ANALYTICS
    PROJECT_SVC -->|Reporting Queries| MONGO_REPORTING
    EARNING_SVC -->|Aggregation Queries| MONGO_AGGREGATION
    AGGREGATION_SVC -->|Complex Queries| MONGO_AGGREGATION

    %% Replication
    MONGO_PRIMARY -.->|Replicate| MONGO_ANALYTICS
    MONGO_PRIMARY -.->|Replicate| MONGO_REPORTING
    MONGO_PRIMARY -.->|Replicate| MONGO_AGGREGATION

    %% Cache Operations
    USER_SVC --> USER_CACHE
    PROJECT_SVC --> PROJECT_CACHE
    AGGREGATION_SVC --> ANALYTICS_CACHE
    
    USER_CACHE --> REDIS_CLUSTER
    PROJECT_CACHE --> REDIS_CLUSTER
    ANALYTICS_CACHE --> REDIS_CLUSTER

    %% Monitoring Connections
    MONGO_PRIMARY --> REPLICA_MONITOR
    MONGO_ANALYTICS --> REPLICA_MONITOR
    MONGO_REPORTING --> REPLICA_MONITOR
    MONGO_AGGREGATION --> REPLICA_MONITOR
    
    USER_SVC --> CONNECTION_MONITOR
    PROJECT_SVC --> CONNECTION_MONITOR
    EARNING_SVC --> CONNECTION_MONITOR
    
    REDIS_CLUSTER --> CACHE_MONITOR

    %% Apply styles
    class USER_SVC,PROJECT_SVC,CONTRACT_SVC,EARNING_SVC,AGGREGATION_SVC appClass
    class MONGO_PRIMARY primaryClass
    class MONGO_ANALYTICS,MONGO_REPORTING,MONGO_AGGREGATION replicaClass
    class REDIS_CLUSTER,USER_CACHE,PROJECT_CACHE,ANALYTICS_CACHE cacheClass
    class REPLICA_MONITOR,CONNECTION_MONITOR,CACHE_MONITOR monitorClass
```
