# Software Architecture Diagram

## NestCMS System Architecture Overview

```mermaid
graph TB
    %% Client Layer
    subgraph "Client Layer"
        Web[Web Application]
        Mobile[Mobile App]
        API[API Clients]
    end
    
    %% API Gateway & Load Balancer
    subgraph "Infrastructure Layer"
        LB[Load Balancer]
        Gateway[API Gateway]
        Auth[Authentication Service]
    end
    
    %% Application Layer
    subgraph "NestJS Application Layer"
        subgraph "Controllers"
            UC[Users Controller]
            PC[Projects Controller]
            CC[Contracts Controller]
            PayC[Payments Controller]
            AC[Articles Controller]
        end
        
        subgraph "Services"
            US[Users Service]
            PS[Projects Service]
            CS[Contracts Service]
            PayS[Payments Service]
            PTS[PayTabs Service]
            ES[Earnings Service]
        end
        
        subgraph "Guards & Middleware"
            JG[JWT Guard]
            PG[Permission Guard]
            RL[Rate Limiter]
            Log[Logger Middleware]
        end
    end
    
    %% Data Layer
    subgraph "Data Layer"
        subgraph "MongoDB Cluster"
            Primary[(Primary DB)]
            Replica1[(Read Replica 1)]
            Replica2[(Read Replica 2)]
        end
        
        subgraph "Caching Layer"
            Redis[(Redis Cache)]
            MemCache[(Memory Cache)]
        end
    end
    
    %% External Services
    subgraph "External Services"
        PayTabs[PayTabs Gateway]
        Email[Email Service]
        Storage[File Storage]
    end
    
    %% Connections
    Web --> LB
    Mobile --> LB
    API --> LB
    
    LB --> Gateway
    Gateway --> Auth
    Auth --> UC
    Auth --> PC
    Auth --> CC
    Auth --> PayC
    Auth --> AC
    
    UC --> US
    PC --> PS
    CC --> CS
    PayC --> PayS
    PayC --> PTS
    AC --> AS
    
    PayS --> ES
    PTS --> PayTabs
    
    US --> Primary
    PS --> Primary
    CS --> Primary
    PayS --> Primary
    ES --> Primary
    
    US --> Replica1
    PS --> Replica1
    CS --> Replica2
    ES --> Replica2
    
    US --> Redis
    PS --> Redis
    CS --> MemCache
    PayS --> Redis
    
    PayS --> Email
    PS --> Storage
    
    style Primary fill:#4caf50
    style Replica1 fill:#81c784
    style Replica2 fill:#81c784
    style Redis fill:#f44336
    style PayTabs fill:#ff9800
```

## PayTabs Integration Architecture

```mermaid
graph LR
    subgraph "NestCMS Application"
        subgraph "Payment Module"
            PC[Payment Controller]
            PS[Payment Service]
            PTS[PayTabs Service]
        end
        
        subgraph "Security Layer"
            WS[Webhook Security]
            RL[Rate Limiter]
            CB[Circuit Breaker]
        end
        
        subgraph "Data Layer"
            PM[Payment Model]
            TM[Transaction Model]
            DB[(MongoDB)]
        end
    end
    
    subgraph "PayTabs Gateway"
        API[PayTabs API]
        WH[Webhook Handler]
        PG[Payment Gateway]
    end
    
    subgraph "Monitoring & Logging"
        Logger[Structured Logger]
        Metrics[Metrics Collector]
        Alerts[Alert Manager]
    end
    
    %% Payment Flow
    PC -->|1. Create Payment| PS
    PS -->|2. Validate & Store| PM
    PS -->|3. Call PayTabs| PTS
    PTS -->|4. Circuit Breaker| CB
    CB -->|5. API Call| API
    
    API -->|6. Payment Page| PG
    PG -->|7. Webhook| WH
    WH -->|8. Callback| WS
    WS -->|9. Verify Signature| RL
    RL -->|10. Process Callback| PS
    
    PS -->|11. Verify Transaction| PTS
    PTS -->|12. Validate| API
    PS -->|13. Update Status| PM
    PS -->|14. Store Transaction| TM
    
    %% Monitoring
    PS --> Logger
    PTS --> Logger
    CB --> Metrics
    WS --> Metrics
    Metrics --> Alerts
    
    style CB fill:#ff5722
    style WS fill:#2196f3
    style Logger fill:#4caf50
    style Metrics fill:#ff9800
```

## Mongoose Aggregation Architecture

```mermaid
graph TB
    subgraph "Application Services"
        US[Users Service]
        PS[Projects Service]
        CS[Contracts Service]
        ES[Earnings Service]
    end
    
    subgraph "Aggregation Layer"
        subgraph "Pipeline Optimizations"
            UL[User Lookups]
            PL[Project Lookups]
            CL[Contract Lookups]
            EL[Earnings Calculations]
        end
        
        subgraph "Caching Strategy"
            QC[Query Cache]
            RC[Result Cache]
            IC[Index Cache]
        end
        
        subgraph "Performance Monitoring"
            QM[Query Monitor]
            PM[Performance Metrics]
            AI[Auto Indexing]
        end
    end
    
    subgraph "MongoDB Cluster"
        subgraph "Primary Node"
            WO[Write Operations]
            PI[Primary Indexes]
        end
        
        subgraph "Read Replicas"
            RR1[Read Replica 1]
            RR2[Read Replica 2]
            RI[Replica Indexes]
        end
        
        subgraph "Aggregation Optimization"
            CI[Compound Indexes]
            MV[Materialized Views]
            SP[Sharding Policy]
        end
    end
    
    %% Service to Aggregation Flow
    US -->|User Permissions| UL
    PS -->|Project Relations| PL
    CS -->|Contract Employees| CL
    ES -->|Earnings Calc| EL
    
    %% Aggregation to Cache
    UL --> QC
    PL --> RC
    CL --> QC
    EL --> RC
    
    %% Cache to Database
    QC -->|Cache Miss| RR1
    RC -->|Cache Miss| RR2
    
    %% Write Operations
    US -->|Updates| WO
    PS -->|Updates| WO
    CS -->|Updates| WO
    ES -->|Updates| WO
    
    %% Performance Monitoring
    UL --> QM
    PL --> QM
    CL --> QM
    EL --> QM
    
    QM --> PM
    PM --> AI
    AI --> CI
    
    %% Index Management
    PI --> CI
    RI --> CI
    CI --> MV
    
    style QC fill:#e3f2fd
    style RC fill:#e3f2fd
    style QM fill:#fff3e0
    style PM fill:#fff3e0
    style CI fill:#e8f5e8
    style MV fill:#e8f5e8
```

## Current vs Proposed Architecture

### Current State
```mermaid
graph LR
    subgraph "Current Architecture"
        App[NestJS App]
        PayTabs[PayTabs Service]
        Mongo[(MongoDB)]
        
        App --> PayTabs
        App --> Mongo
        PayTabs --> |Direct API Calls| PT[PayTabs API]
        
        subgraph "Limitations"
            L1[No Circuit Breaker]
            L2[Limited Caching]
            L3[Basic Error Handling]
            L4[No Read Replicas]
        end
    end
    
    style L1 fill:#ffebee
    style L2 fill:#ffebee
    style L3 fill:#ffebee
    style L4 fill:#ffebee
```

### Proposed Architecture
```mermaid
graph LR
    subgraph "Enhanced Architecture"
        App[NestJS App]
        
        subgraph "Resilience Layer"
            CB[Circuit Breaker]
            Retry[Retry Logic]
            Cache[Redis Cache]
        end
        
        subgraph "Database Layer"
            Primary[(Primary DB)]
            Replica1[(Read Replica)]
            Replica2[(Read Replica)]
        end
        
        subgraph "Monitoring"
            Logs[Structured Logs]
            Metrics[Metrics]
            Alerts[Alerts]
        end
        
        App --> CB
        CB --> Retry
        Retry --> Cache
        Cache --> PT[PayTabs API]
        
        App --> Primary
        App --> Replica1
        App --> Replica2
        
        App --> Logs
        CB --> Metrics
        Metrics --> Alerts
    end
    
    style CB fill:#4caf50
    style Cache fill:#4caf50
    style Replica1 fill:#4caf50
    style Replica2 fill:#4caf50
```

## Technology Stack Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        React[React/Angular]
        Mobile[React Native]
        Swagger[Swagger UI]
    end
    
    subgraph "API Layer"
        NestJS[NestJS Framework]
        Express[Express.js]
        Passport[Passport Auth]
        JWT[JWT Tokens]
    end
    
    subgraph "Business Logic Layer"
        Services[NestJS Services]
        Guards[Auth Guards]
        Pipes[Validation Pipes]
        Interceptors[Logging Interceptors]
    end
    
    subgraph "Data Access Layer"
        Mongoose[Mongoose ODM]
        Aggregation[Aggregation Pipelines]
        Validation[Schema Validation]
    end
    
    subgraph "Database Layer"
        MongoDB[MongoDB 8.7.0]
        Indexes[Compound Indexes]
        Replicas[Read Replicas]
    end
    
    subgraph "External Integrations"
        PayTabsSDK[PayTabs SDK 2.0.10]
        EmailAPI[Email Service]
        FileStorage[File Storage]
    end
    
    subgraph "Infrastructure"
        Docker[Docker Containers]
        Kubernetes[K8s Orchestration]
        Helm[Helm Charts]
        CI[GitHub Actions]
    end
    
    React --> NestJS
    Mobile --> NestJS
    Swagger --> NestJS
    
    NestJS --> Express
    Express --> Passport
    Passport --> JWT
    
    NestJS --> Services
    Services --> Guards
    Guards --> Pipes
    Pipes --> Interceptors
    
    Services --> Mongoose
    Mongoose --> Aggregation
    Aggregation --> Validation
    
    Mongoose --> MongoDB
    MongoDB --> Indexes
    MongoDB --> Replicas
    
    Services --> PayTabsSDK
    Services --> EmailAPI
    Services --> FileStorage
    
    NestJS --> Docker
    Docker --> Kubernetes
    Kubernetes --> Helm
    Kubernetes --> CI
    
    style NestJS fill:#e91e63
    style MongoDB fill:#4caf50
    style PayTabsSDK fill:#ff9800
    style Docker fill:#2196f3
    style Kubernetes fill:#3f51b5
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Kubernetes Cluster"
            subgraph "Application Pods"
                App1[NestCMS Pod 1]
                App2[NestCMS Pod 2]
                App3[NestCMS Pod 3]
            end
            
            subgraph "Services"
                LB[Load Balancer Service]
                AppSvc[Application Service]
                DBSvc[Database Service]
            end
            
            subgraph "ConfigMaps & Secrets"
                Config[Configuration]
                Secrets[PayTabs Secrets]
                DBCreds[DB Credentials]
            end
        end
        
        subgraph "Database Cluster"
            Primary[(MongoDB Primary)]
            Secondary1[(MongoDB Secondary)]
            Secondary2[(MongoDB Secondary)]
            Arbiter[MongoDB Arbiter]
        end
        
        subgraph "Caching Layer"
            Redis1[(Redis Master)]
            Redis2[(Redis Replica)]
        end
        
        subgraph "Monitoring Stack"
            Prometheus[Prometheus]
            Grafana[Grafana]
            AlertManager[Alert Manager]
        end
    end
    
    subgraph "External Services"
        PayTabsAPI[PayTabs API]
        EmailSMTP[Email SMTP]
        FileStore[File Storage]
    end
    
    %% Connections
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> Primary
    App2 --> Secondary1
    App3 --> Secondary2
    
    App1 --> Redis1
    App2 --> Redis1
    App3 --> Redis2
    
    App1 --> PayTabsAPI
    App2 --> EmailSMTP
    App3 --> FileStore
    
    App1 --> Prometheus
    App2 --> Prometheus
    App3 --> Prometheus
    
    Prometheus --> Grafana
    Prometheus --> AlertManager
    
    Config --> App1
    Config --> App2
    Config --> App3
    
    Secrets --> App1
    Secrets --> App2
    Secrets --> App3
    
    style Primary fill:#4caf50
    style Secondary1 fill:#81c784
    style Secondary2 fill:#81c784
    style Redis1 fill:#f44336
    style Redis2 fill:#ef5350
    style Prometheus fill:#ff9800
    style Grafana fill:#2196f3
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            WAF[Web Application Firewall]
            TLS[TLS/SSL Termination]
            VPN[VPN Access]
        end
        
        subgraph "Application Security"
            Auth[JWT Authentication]
            RBAC[Role-Based Access Control]
            RateLimit[Rate Limiting]
            InputVal[Input Validation]
        end
        
        subgraph "Data Security"
            Encryption[Data Encryption]
            Hashing[Password Hashing]
            Audit[Audit Logging]
            Backup[Encrypted Backups]
        end
        
        subgraph "Integration Security"
            WebhookSig[Webhook Signatures]
            APIKeys[API Key Management]
            SecretMgmt[Secret Management]
        end
    end
    
    subgraph "Monitoring & Compliance"
        SIEM[Security Information & Event Management]
        Compliance[Compliance Monitoring]
        Vulnerability[Vulnerability Scanning]
    end
    
    WAF --> TLS
    TLS --> Auth
    Auth --> RBAC
    RBAC --> RateLimit
    RateLimit --> InputVal
    
    InputVal --> Encryption
    Encryption --> Hashing
    Hashing --> Audit
    
    Auth --> WebhookSig
    WebhookSig --> APIKeys
    APIKeys --> SecretMgmt
    
    Audit --> SIEM
    SIEM --> Compliance
    Compliance --> Vulnerability
    
    style WAF fill:#f44336
    style Auth fill:#4caf50
    style RBAC fill:#4caf50
    style Encryption fill:#2196f3
    style WebhookSig fill:#ff9800
    style SIEM fill:#9c27b0
```

This software architecture documentation provides comprehensive technical diagrams showing the current system structure, proposed improvements, technology stack, deployment architecture, and security considerations. It serves as a blueprint for development teams and technical stakeholders to understand the system's technical implementation and enhancement roadmap.

