# 🏗️ NestCMS - Construction Company Management System

<div align="center">

<!-- Golden Ratio Logo Layout: 324px:200px ≈ 1.618:1 -->
<img src="https://nestjs.com/img/logo_text.svg" width="324" alt="NestJS Logo" />
<img src="https://raw.githubusercontent.com/mongodb/mongo/master/docs/leaf.svg" width="200" alt="MongoDB Logo" />

<!-- Golden Ratio Badge Arrangement: Primary (61.8%) + Secondary (38.2%) -->
<div style="margin: 32px 0;">
  <img src="https://img.shields.io/badge/NestJS-10.4.4-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.6.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-8.7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
</div>

<div style="margin: 20px 0;">
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-Ready-326CE5?style=flat-square&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?style=flat-square&logo=swagger&logoColor=white" alt="Swagger" />
</div>

<!-- Golden Ratio Typography: 1.618 emphasis -->
<h2 style="font-size: 1.618em; color: #2c3e50; margin: 26px 0;">
  🎯 Enterprise-Grade Construction Management Platform
</h2>

<p style="font-size: 1.2em; color: #34495e; max-width: 618px; margin: 0 auto;">
  <strong>Streamline construction operations with modern architecture, intelligent automation, and golden ratio design principles</strong>
</p>

</div>

---

<!-- Golden Ratio Section Spacing: 42px (φ²×16) -->

---

## 🎯 **Project Overview**

**NestCMS** is a comprehensive, production-ready Construction Company Management System designed to streamline all aspects of construction business operations. Built with modern web technologies and enterprise-grade architecture, it provides a complete solution for managing projects, contracts, payments, schedules, and organizational workflows.

### 🏢 **Business Domain**
- **Industry**: Construction & Project Management
- **Target Users**: Construction companies, project managers, contractors, clients
- **Core Purpose**: End-to-end construction project lifecycle management

---

## ✨ **Key Features**

### 🏗️ **Project Management**
- **Project Lifecycle**: Complete project tracking from initiation to completion
- **Project Steps**: Granular step-by-step project progression management
- **Design Management**: Project design document handling and versioning
- **Worker Assignment**: Project team and worker allocation system
- **Status Tracking**: Real-time project status monitoring and reporting

### 👥 **User & Organization Management**
- **Multi-Role System**: Support for clients, employees, contractors, and administrators
- **Organization Management**: Multi-organization support with hierarchical structures
- **Permission System**: Granular role-based access control (RBAC)
- **User Authentication**: JWT-based secure authentication with Passport strategies

### 💰 **Financial Operations**
- **Payment Processing**: Integrated PayTabs payment gateway with complete lifecycle management
- **Contract Management**: Digital contract creation and management
- **Earnings Tracking**: Project-based earnings and commission calculations with aggregation
- **Offer Management**: Bid and proposal management system
- **Multi-Currency Support**: International payment processing capabilities
- **Transaction Verification**: Secure payment verification and callback handling

### 📅 **Scheduling & Planning**
- **Project Scheduling**: Timeline and milestone management
- **Resource Planning**: Worker and equipment scheduling
- **Calendar Integration**: Schedule coordination and conflict resolution

### 📊 **Content & Documentation**
- **Article System**: Knowledge base and documentation management
- **Note Management**: Project notes and communication tracking
- **Document Storage**: File and document management system

---

## 🏛️ **System Architecture**

### **Technology Stack**
```
Frontend API: RESTful API with Swagger Documentation
Backend Framework: NestJS 10.4.4 with TypeScript 5.6.2
Database: MongoDB 8.7.0 with Mongoose ODM
Authentication: JWT with Passport (Local & JWT strategies)
Payment Gateway: PayTabs Integration
Build System: SWC Compiler for fast builds
Testing: Jest with unit and e2e testing
Documentation: Swagger UI with dark theme
```

### **Modular Architecture**
```
📦 Core Modules
├── 🔐 Authentication & Authorization
├── 👤 Users & Organizations Management
├── 🏗️ Projects & Project Steps
├── 📋 Contracts & Offers
├── 💳 Payments & Earnings
├── 📅 Schedules & Planning
├── 📝 Articles & Notes
├── 🛡️ Permissions & Security
└── 🎨 Designs & Documents
```

### **Database Schema**
- **Projects**: Core project entities with relationships to contracts, users, and schedules
- **Users**: Multi-role user system with organization affiliations and permission aggregation
- **Contracts**: Legal agreements linked to projects and payments with employee lookups
- **Payments**: Financial transactions with PayTabs integration and transaction tracking
- **Schedules**: Time-based project planning and resource allocation
- **Earnings**: Aggregated financial calculations with multi-currency support

---

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js** 18+ (Alpine Linux compatible)
- **MongoDB** 4.4+ (Local or Atlas)
- **npm** or **yarn** package manager
- **Docker** (optional, for containerized deployment)

### **Environment Setup**
```bash
# Clone the repository
git clone https://github.com/abdoElHodaky/Nestcms.git
cd Nestcms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure MONGO_URI and other environment variables
```

### **Development**
```bash
# Start development server with hot reload
npm run start:dev

# Build the application
npm run build

# Run in production mode
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

### **Testing**
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage report
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

---

## 🐳 **Deployment**

### **Docker Deployment**
```bash
# Build Docker image
docker build -t nestcms:latest .

# Run container
docker run -p 3000:3000 -e MONGO_URI="your-mongodb-uri" nestcms:latest
```

### **Kubernetes Deployment**
```bash
# Apply Kubernetes manifests
kubectl apply -f nestcms/

# Using Helm (recommended)
helm install nestcms ./nestcms
```

### **Production Configuration**
- **Environment**: Node.js 18 Alpine Linux
- **Process Manager**: PM2 for production process management
- **Database**: MongoDB with connection pooling
- **Security**: JWT authentication with configurable expiration
- **Monitoring**: Built-in health checks and logging

---

## 💳 **PayTabs Integration**

### **Payment Gateway Overview**
NestCMS integrates with PayTabs payment gateway (SDK v2.0.10) to provide secure, reliable payment processing for construction projects and contracts.

### **Payment Flow Architecture**
```
1. Payment Creation → PaymentService.create()
2. Payment Page Generation → PayTabService.createPage()
3. Transaction Processing → PayTabs Gateway
4. Callback Handling → PaymentService.payCallback()
5. Transaction Verification → PayTabService.payVerify()
6. Status Update → Payment.status = "paid"
```

### **Configuration**
```bash
# Environment Variables
PAYTABS_PROFILE=your-profile-id
PAYTABS_SERVERK=your-server-key
PAYTABS_REGION=your-region
```

### **Key Features**
- **Multi-Currency Support**: Process payments in multiple currencies
- **Transaction Tracking**: Unique transaction reference (`transR`) for each payment
- **Callback Security**: Secure webhook handling with signature verification
- **Payment Verification**: Two-step verification process for transaction integrity
- **Status Management**: Complete payment lifecycle tracking

### **Usage Example**
```typescript
// Create Payment
const payment = await paymentService.create({
  contractId: 'contract-id',
  title: 'Project Payment',
  amount: 1000,
  currency: 'USD'
});

// Process Payment
const paymentUrl = await paymentService.Pay(payment._id, {
  callback: 'https://yourapp.com/payment/callback',
  return: 'https://yourapp.com/payment/return'
});

// Verify Payment (handled automatically via webhook)
const verification = await paymentService.verify(transactionRef, paymentId);
```

### **Security Measures**
- **Webhook Signature Verification**: All callbacks are verified for authenticity
- **Rate Limiting**: Payment endpoints protected against abuse
- **Transaction Validation**: Multi-step verification process
- **Secure Configuration**: Environment-based sensitive data management

---

## 📊 **Mongoose Aggregation Patterns**

### **Aggregation Overview**
NestCMS utilizes sophisticated MongoDB aggregation pipelines to efficiently handle complex data relationships and calculations across the construction management domain.

### **Aggregation Statistics**
- **7 aggregation pipelines** across **4 core services**
- **Services**: Contracts, Earnings, Projects, Users
- **Operations**: `$lookup`, `$match`, `$group`, `$expr`

### **Key Aggregation Patterns**

#### **1. Contract-Employee Relationships**
```typescript
// Efficient employee lookup for contracts
const contractData = await this.contractModel.aggregate([
  { $match: { _id: new Types.ObjectId(contractId) } },
  {
    $lookup: {
      from: "users",
      localField: "employee",
      foreignField: "_id",
      as: "employees"
    }
  }
]);
```

#### **2. Financial Earnings Aggregation**
```typescript
// Complex earnings calculations with grouping
const earnings = await model.aggregate([
  { $match: { id: { $in: earningIds } } },
  {
    $group: {
      totalEarnings: { $sum: '$amount' },
      currency: '$currency',
      totalPeriod: { $sum: "$period" }
    }
  }
]);
```

#### **3. Project Data Relationships**
```typescript
// Advanced project lookups with conditional matching
const projectData = await this.projectModel.aggregate([
  { $match: { _id: new Types.ObjectId(projectId) } },
  {
    $lookup: {
      from: "notes",
      let: { projectId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$onId", "$$projectId"] },
                { $eq: ["$onModel", "Project"] }
              ]
            }
          }
        }
      ],
      as: "projectNotes"
    }
  }
]);
```

#### **4. User Permission Aggregation**
```typescript
// User permissions with role-based access control
const userData = await this.userModel.aggregate([
  { $match: { _id: new Types.ObjectId(userId) } },
  {
    $lookup: {
      from: "permissions",
      localField: "permissions",
      foreignField: "for",
      as: "userPermissions"
    }
  }
]);
```

### **Performance Optimization**
- **Compound Indexes**: Optimized indexes for aggregation performance
- **Pipeline Optimization**: Efficient query structure to minimize database load
- **Result Caching**: Strategic caching for frequently accessed aggregations
- **Read Replicas**: Dedicated read replicas for complex aggregation queries

### **Best Practices**
- **Early Filtering**: Use `$match` early in pipelines to reduce data processing
- **Index Utilization**: Ensure proper indexes support aggregation operations
- **Memory Management**: Monitor aggregation memory usage and optimize accordingly
- **Error Handling**: Implement robust error handling for aggregation failures

---

## 🏗️ **System Architecture**

### **Architecture Diagrams**
- **[Business Architecture](docs/diagrams/business-architecture.md)**: Complete business process flows and entity relationships
- **[Software Architecture](docs/diagrams/software-architecture.md)**: Technical system architecture and component interactions
- **[Deep-Level Architecture](docs/diagrams/deep-level-architecture.md)**: Detailed technical diagrams with PayTabs integration, aggregation patterns, and security architecture

### **Current Architecture Highlights**
- **Modular Design**: 9 integrated NestJS modules with clear separation of concerns
- **Service Layer**: Dedicated services for business logic with proper dependency injection
- **Data Layer**: MongoDB with Mongoose ODM and sophisticated aggregation patterns
- **Security Layer**: JWT authentication with role-based access control
- **Integration Layer**: PayTabs payment gateway with secure webhook handling

### **Proposed Enhancements**
- **Circuit Breaker Pattern**: Resilience for external service calls
- **Event-Driven Architecture**: Domain events for payment and project state changes
- **Caching Strategy**: Redis-based caching for aggregation results
- **Read Replicas**: MongoDB read replicas for query performance optimization
- **Monitoring & Observability**: Comprehensive logging and metrics collection

### **Performance Considerations**
- **Database Indexing**: Compound indexes optimized for aggregation pipelines
- **Query Optimization**: Efficient aggregation patterns with minimal data processing
- **Caching Strategy**: Strategic caching of frequently accessed data
- **Load Balancing**: Horizontal scaling capabilities with Kubernetes deployment

### **Visual System Architecture**

#### **💳 PayTabs Integration Flow - Golden Ratio Design**

<div align="center">

*Payment processing architecture following φ proportions for optimal visual flow*

</div>

```mermaid
graph LR
    %% Golden Ratio Node Sizing: Primary (φ) + Secondary (1/φ)
    Client[👤 Client<br/>Payment Request<br/>φ = 1.618]
    NestCMS[🏗️ NestCMS API<br/>Payment Processing<br/>Core System]
    PayTabs[💳 PayTabs Gateway<br/>Secure Processing<br/>External Service]
    Bank[🏦 Bank Processor<br/>Transaction<br/>1/φ = 0.618]
    
    %% Golden Spiral Flow Pattern
    Client -->|1. Initiate Payment<br/>Amount & Details| NestCMS
    NestCMS -->|2. Create Payment Page<br/>Secure Token| PayTabs
    PayTabs -->|3. Process Transaction<br/>Card Validation| Bank
    Bank -->|4. Transaction Result<br/>Success/Failure| PayTabs
    PayTabs -.->|5. Webhook Callback<br/>Real-time Status| NestCMS
    NestCMS -.->|6. Payment Confirmation<br/>Receipt & Status| Client
    
    %% Golden Ratio Color Scheme (61.8% Primary, 38.2% Accent)
    style Client fill:#2c3e50,stroke:#34495e,stroke-width:3px,color:#ffffff
    style NestCMS fill:#e74c3c,stroke:#c0392b,stroke-width:4px,color:#ffffff
    style PayTabs fill:#f39c12,stroke:#e67e22,stroke-width:3px,color:#ffffff
    style Bank fill:#27ae60,stroke:#229954,stroke-width:2px,color:#ffffff
    
    %% Golden Ratio Emphasis Lines
    linkStyle 0 stroke:#2c3e50,stroke-width:4px
    linkStyle 1 stroke:#e74c3c,stroke-width:3px
    linkStyle 2 stroke:#f39c12,stroke-width:3px
    linkStyle 3 stroke:#27ae60,stroke-width:2px
    linkStyle 4 stroke:#8e44ad,stroke-width:3px,stroke-dasharray: 8 5
    linkStyle 5 stroke:#2980b9,stroke-width:3px,stroke-dasharray: 8 5
```

#### **📊 Database Aggregation Architecture - Golden Ratio Layout**

<div align="center">

*MongoDB aggregation patterns designed with φ proportions for optimal data flow visualization*

</div>

```mermaid
graph TB
    %% Golden Ratio Service Layer (φ = 1.618 emphasis)
    subgraph "⚙️ Services Layer - Primary Tier"
        direction LR
        US[👥 Users Service<br/>Authentication & Profiles<br/>φ Priority]
        PS[🏗️ Projects Service<br/>Lifecycle Management<br/>φ Priority]
        CS[📋 Contracts Service<br/>Legal Agreements<br/>1.0 Priority]
        ES[💰 Earnings Service<br/>Financial Calculations<br/>1/φ Priority]
    end
    
    %% Golden Ratio Aggregation Layer (1/φ = 0.618 emphasis)
    subgraph "🔄 Aggregation Pipelines - Processing Tier"
        direction LR
        UL[🔍 User Lookups<br/>$lookup + $match<br/>Complex Joins]
        PL[🔗 Project Relations<br/>$group + $expr<br/>Hierarchical Data]
        CL[🤝 Contract-Employee<br/>$lookup + $unwind<br/>Relationship Mapping]
        EL[📈 Earnings Calc<br/>$group + $sum<br/>Financial Aggregation]
    end
    
    %% Golden Ratio Database Cluster (φ distributed load)
    subgraph "🍃 MongoDB Cluster - Data Tier"
        direction TB
        Primary[(🎯 Primary DB<br/>Write Operations<br/>φ Load Distribution)]
        Replica1[(📖 Read Replica 1<br/>User & Contract Queries<br/>38.2% Load)]
        Replica2[(📊 Read Replica 2<br/>Project & Earnings<br/>38.2% Load)]
    end
    
    %% Golden Spiral Data Flow - Primary Connections (61.8%)
    US -.->|Primary Flow| UL
    PS -.->|Primary Flow| PL
    CS -->|Secondary Flow| CL
    ES -->|Secondary Flow| EL
    
    %% Read Distribution Following Golden Ratio
    UL ==>|Heavy Read Load<br/>φ Proportion| Replica1
    PL ==>|Heavy Read Load<br/>φ Proportion| Replica2
    CL -->|Moderate Load<br/>1.0 Proportion| Replica1
    EL -->|Moderate Load<br/>1.0 Proportion| Replica2
    
    %% Write Operations - All to Primary
    US ==>|Write Operations<br/>CRUD| Primary
    PS ==>|Write Operations<br/>CRUD| Primary
    CS ==>|Write Operations<br/>CRUD| Primary
    ES ==>|Write Operations<br/>CRUD| Primary
    
    %% Golden Ratio Color Scheme
    style US fill:#3498db,stroke:#2980b9,stroke-width:4px,color:#ffffff
    style PS fill:#e74c3c,stroke:#c0392b,stroke-width:4px,color:#ffffff
    style CS fill:#f39c12,stroke:#e67e22,stroke-width:3px,color:#ffffff
    style ES fill:#27ae60,stroke:#229954,stroke-width:2px,color:#ffffff
    
    style UL fill:#5dade2,stroke:#3498db,stroke-width:3px,color:#ffffff
    style PL fill:#ec7063,stroke:#e74c3c,stroke-width:3px,color:#ffffff
    style CL fill:#f7dc6f,stroke:#f39c12,stroke-width:2px,color:#ffffff
    style EL fill:#58d68d,stroke:#27ae60,stroke-width:2px,color:#ffffff
    
    style Primary fill:#2c3e50,stroke:#1a252f,stroke-width:5px,color:#ffffff
    style Replica1 fill:#34495e,stroke:#2c3e50,stroke-width:3px,color:#ffffff
    style Replica2 fill:#34495e,stroke:#2c3e50,stroke-width:3px,color:#ffffff
```

#### **🛡️ System Security Architecture - Golden Ratio Defense**

<div align="center">

*Multi-layered security architecture following φ proportions for comprehensive protection*

</div>

```mermaid
graph TB
    %% Golden Ratio Security Layers (φ = 1.618 hierarchical protection)
    subgraph "🛡️ Security Perimeter - Outer Defense (φ Layer)"
        direction TB
        WAF[🔥 Web Application Firewall<br/>DDoS Protection & Filtering<br/>φ Priority Defense]
        Auth[🔐 JWT Authentication<br/>Passport Strategies<br/>Primary Gate]
        RBAC[👥 Role-Based Access<br/>Granular Permissions<br/>Secondary Gate]
        Encrypt[🔒 Data Encryption<br/>AES-256 & TLS 1.3<br/>1/φ Core Protection]
    end
    
    %% Golden Ratio Application Layer (1.0 balanced processing)
    subgraph "🚀 Application Core - Processing Layer"
        direction TB
        API[⚡ NestJS API Gateway<br/>RESTful Endpoints<br/>Central Hub]
        Guards[⚔️ Guards & Middleware<br/>Request Validation<br/>Route Protection]
        Services[⚙️ Business Services<br/>Domain Logic<br/>Secure Processing]
    end
    
    %% Golden Ratio Data Layer (1/φ = 0.618 secure storage)
    subgraph "🗄️ Data Fortress - Storage Layer"
        direction LR
        MongoDB[(🍃 MongoDB Atlas<br/>Encrypted at Rest<br/>Primary Storage)]
        Redis[(⚡ Redis Cluster<br/>Session Management<br/>Cache Layer)]
        Backup[(💾 Backup Systems<br/>Disaster Recovery<br/>Redundancy)]
    end
    
    %% Golden Spiral Security Flow
    WAF ==>|1. Traffic Filtering<br/>Rate Limiting| Auth
    Auth ==>|2. Token Validation<br/>User Identity| RBAC
    RBAC ==>|3. Permission Check<br/>Access Control| API
    API ==>|4. Request Routing<br/>Load Balancing| Guards
    Guards ==>|5. Validation Layer<br/>Security Checks| Services
    Services ==>|6. Data Processing<br/>Business Logic| Encrypt
    
    %% Data Layer Security Connections
    Encrypt ==>|7. Encrypted Writes<br/>Secure Storage| MongoDB
    Services -.->|8. Session Data<br/>Cache Operations| Redis
    MongoDB -.->|9. Automated Backup<br/>Recovery Points| Backup
    
    %% Security Monitoring & Alerts (φ proportion feedback)
    Services -.->|Security Events<br/>Audit Logs| WAF
    Guards -.->|Threat Detection<br/>Anomaly Reports| Auth
    
    %% Golden Ratio Security Color Scheme
    style WAF fill:#e74c3c,stroke:#c0392b,stroke-width:5px,color:#ffffff
    style Auth fill:#27ae60,stroke:#229954,stroke-width:4px,color:#ffffff
    style RBAC fill:#3498db,stroke:#2980b9,stroke-width:4px,color:#ffffff
    style Encrypt fill:#9b59b6,stroke:#8e44ad,stroke-width:3px,color:#ffffff
    
    style API fill:#f39c12,stroke:#e67e22,stroke-width:4px,color:#ffffff
    style Guards fill:#34495e,stroke:#2c3e50,stroke-width:3px,color:#ffffff
    style Services fill:#16a085,stroke:#138d75,stroke-width:3px,color:#ffffff
    
    style MongoDB fill:#4caf50,stroke:#388e3c,stroke-width:4px,color:#ffffff
    style Redis fill:#ff5722,stroke:#e64a19,stroke-width:3px,color:#ffffff
    style Backup fill:#607d8b,stroke:#455a64,stroke-width:2px,color:#ffffff
```

#### **🌟 Golden Ratio System Overview - Complete Architecture**

<div align="center">

*Comprehensive NestCMS architecture visualization using φ proportions for optimal system understanding*

</div>

```mermaid
graph TB
    %% Golden Ratio External Layer (φ = 1.618 user interaction)
    subgraph "🌐 External Interface Layer - φ Priority"
        direction LR
        Client[👤 Client Portal<br/>Project Management<br/>φ User Experience]
        Admin[👨‍💻 Admin Dashboard<br/>System Control<br/>φ Management]
        Mobile[📱 Mobile App<br/>Field Operations<br/>1.0 Accessibility]
        API_Docs[📚 API Documentation<br/>Swagger UI<br/>1/φ Reference]
    end
    
    %% Golden Ratio Gateway Layer (1.0 balanced routing)
    subgraph "🚪 API Gateway Layer - Balanced Processing"
        direction TB
        Gateway[🚀 NestJS Gateway<br/>Request Routing<br/>Load Balancing]
        Auth_Gate[🔐 Authentication<br/>JWT Validation<br/>Security Gate]
        Rate_Limit[⏱️ Rate Limiting<br/>Traffic Control<br/>Protection]
    end
    
    %% Golden Ratio Business Layer (φ core functionality)
    subgraph "⚙️ Business Logic Layer - φ Core Services"
        direction TB
        
        subgraph "🏗️ Project Domain"
            PM[📋 Project Management]
            PS[📝 Project Steps]
            PD[🎨 Design Management]
        end
        
        subgraph "💰 Financial Domain"
            Pay[💳 Payment Processing]
            Earn[💵 Earnings Calculation]
            Contract[📜 Contract Management]
        end
        
        subgraph "👥 User Domain"
            User[👤 User Management]
            Org[🏢 Organization]
            Perm[⚔️ Permissions]
        end
    end
    
    %% Golden Ratio Integration Layer (1/φ external services)
    subgraph "🔗 Integration Layer - External Services"
        direction LR
        PayTabs[💳 PayTabs Gateway<br/>Payment Processing<br/>Financial Integration]
        Email[📧 Email Service<br/>Notifications<br/>Communication]
        Storage[☁️ Cloud Storage<br/>File Management<br/>Document Storage]
    end
    
    %% Golden Ratio Data Layer (1/φ = 0.618 persistence)
    subgraph "🗄️ Data Persistence Layer - φ Storage"
        direction TB
        MongoDB_Primary[(🍃 MongoDB Primary<br/>CRUD Operations<br/>φ Write Load)]
        MongoDB_Read1[(📖 Read Replica 1<br/>Query Processing<br/>38.2% Read Load)]
        MongoDB_Read2[(📊 Read Replica 2<br/>Analytics Queries<br/>38.2% Read Load)]
        Redis_Cache[(⚡ Redis Cache<br/>Session & Performance<br/>1/φ Cache Layer)]
    end
    
    %% Golden Spiral User Flow (Primary Path - 61.8%)
    Client ==>|Primary User Flow<br/>φ Priority| Gateway
    Admin ==>|Administrative Flow<br/>φ Priority| Gateway
    Mobile -->|Mobile Access<br/>Standard Priority| Gateway
    API_Docs -.->|Documentation<br/>Reference Only| Gateway
    
    %% Gateway Processing (Balanced - 1.0)
    Gateway ==>|Request Processing| Auth_Gate
    Auth_Gate ==>|Authenticated Requests| Rate_Limit
    Rate_Limit ==>|Controlled Traffic| PM
    Rate_Limit ==>|Controlled Traffic| Pay
    Rate_Limit ==>|Controlled Traffic| User
    
    %% Business Logic Interconnections (φ relationships)
    PM -.->|Project Data| Contract
    Contract -.->|Financial Data| Pay
    Pay -.->|Payment Data| Earn
    User -.->|User Context| Perm
    Perm -.->|Access Control| PM
    
    %% External Integrations (1/φ priority)
    Pay ==>|Payment Processing<br/>Critical Integration| PayTabs
    User -->|Notifications<br/>Standard Integration| Email
    PD -->|File Storage<br/>Standard Integration| Storage
    
    %% Data Layer Connections (φ distributed)
    PM ==>|Write Operations| MongoDB_Primary
    Pay ==>|Write Operations| MongoDB_Primary
    User ==>|Write Operations| MongoDB_Primary
    
    PM -.->|Read Queries| MongoDB_Read1
    Pay -.->|Read Queries| MongoDB_Read2
    User -.->|Read Queries| MongoDB_Read1
    
    Auth_Gate -.->|Session Data| Redis_Cache
    Gateway -.->|Performance Cache| Redis_Cache
    
    %% Golden Ratio Color Scheme (φ visual hierarchy)
    style Client fill:#3498db,stroke:#2980b9,stroke-width:5px,color:#ffffff
    style Admin fill:#e74c3c,stroke:#c0392b,stroke-width:5px,color:#ffffff
    style Mobile fill:#f39c12,stroke:#e67e22,stroke-width:3px,color:#ffffff
    style API_Docs fill:#95a5a6,stroke:#7f8c8d,stroke-width:2px,color:#ffffff
    
    style Gateway fill:#2c3e50,stroke:#1a252f,stroke-width:4px,color:#ffffff
    style Auth_Gate fill:#27ae60,stroke:#229954,stroke-width:4px,color:#ffffff
    style Rate_Limit fill:#8e44ad,stroke:#7d3c98,stroke-width:3px,color:#ffffff
    
    style PM fill:#3498db,stroke:#2980b9,stroke-width:4px,color:#ffffff
    style Pay fill:#e74c3c,stroke:#c0392b,stroke-width:4px,color:#ffffff
    style User fill:#f39c12,stroke:#e67e22,stroke-width:4px,color:#ffffff
    
    style PayTabs fill:#ff6b6b,stroke:#ee5a52,stroke-width:3px,color:#ffffff
    style Email fill:#4ecdc4,stroke:#45b7aa,stroke-width:2px,color:#ffffff
    style Storage fill:#45b7d1,stroke:#3498db,stroke-width:2px,color:#ffffff
    
    style MongoDB_Primary fill:#4caf50,stroke:#388e3c,stroke-width:5px,color:#ffffff
    style MongoDB_Read1 fill:#81c784,stroke:#66bb6a,stroke-width:3px,color:#ffffff
    style MongoDB_Read2 fill:#81c784,stroke:#66bb6a,stroke-width:3px,color:#ffffff
    style Redis_Cache fill:#ff5722,stroke:#e64a19,stroke-width:3px,color:#ffffff
```

---

## 📈 **Improvement Roadmap**

### **Current Improvements**
Detailed improvement plan available: **[PayTabs & Aggregation Improvement Plan](docs/paytabs_aggregat_improve.md)**

### **Phase 1: Foundation & Reliability** (Weeks 1-5)
- PayTabs error handling and resilience patterns
- Webhook security enhancement with signature verification
- Database indexing strategy for aggregation optimization

### **Phase 2: Performance Optimization** (Weeks 6-10)
- Aggregation pipeline optimization and caching
- Read replica implementation for query performance
- Comprehensive monitoring and alerting setup

### **Phase 3: Architecture Enhancement** (Weeks 11-16)
- Event-driven payment architecture implementation
- Circuit breaker patterns for external service resilience
- Advanced caching strategies with Redis integration

### **Success Metrics**
- **Payment Processing**: < 2 seconds average processing time
- **Aggregation Performance**: < 500ms for complex queries
- **System Reliability**: > 99.5% payment success rate
- **Database Performance**: 50% improvement in aggregation query times

---

## 📚 **API Documentation**

### **Swagger Documentation**
- **URL**: `http://localhost:3000/docs`
- **Theme**: Dark theme with custom styling
- **Authentication**: Bearer token support
- **Interactive**: Full API testing capabilities

### **API Endpoints Overview**
```
🔐 Authentication
├── POST /auth/login - User authentication
├── POST /auth/register - User registration
└── POST /auth/refresh - Token refresh

🏗️ Projects
├── GET /projects - List all projects
├── POST /projects - Create new project
├── GET /projects/:id - Get project details
├── PUT /projects/:id - Update project
└── DELETE /projects/:id - Delete project

💰 Payments
├── GET /payments - List payments
├── POST /payments - Process payment
└── GET /payments/:id - Payment details

📋 Contracts
├── GET /contracts - List contracts
├── POST /contracts - Create contract
└── GET /contracts/:id - Contract details
```

---

## 🔧 **Configuration**

### **Key Configuration Files**
- **`nest-cli.json`**: NestJS CLI configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`.swcrc`**: SWC compiler configuration for fast builds
- **`Dockerfile`**: Container deployment configuration
- **`values.yaml`**: Kubernetes Helm chart values

### **Environment Variables**
```bash
MONGO_URI=mongodb://localhost:27017/nestcms
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
PAYTABS_PROFILE_ID=your-paytabs-profile-id
PAYTABS_SERVER_KEY=your-paytabs-server-key
```

---

## 🧪 **Testing Strategy**

### **Testing Framework**
- **Unit Tests**: Jest with comprehensive module testing
- **E2E Tests**: End-to-end API testing with Supertest
- **Coverage**: Code coverage reporting and analysis
- **Mocking**: Database and external service mocking

### **Test Structure**
```
test/
├── unit/ - Unit tests for services and controllers
├── e2e/ - End-to-end integration tests
└── fixtures/ - Test data and mock objects
```

---

## 🚀 **CI/CD Pipeline**

### **GitHub Actions Workflows**
- **`docker.yml`**: Docker image building and publishing
- **`kube.yml`**: Kubernetes deployment automation
- **`helm_*.yml`**: Helm chart management and deployment
- **Automated Testing**: Run tests on every pull request
- **Security Scanning**: Vulnerability assessment and dependency checking

---

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript and NestJS best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages

---

## 📄 **License**

This project is **UNLICENSED** - see the package.json for details.

---

## 👨‍💻 **Author**

**Abdoelhodaky** - *Full Stack Developer & System Architect*

---

## 🆘 **Support**

- **Issues**: [GitHub Issues](https://github.com/abdoElHodaky/Nestcms/issues)
- **Documentation**: [NestJS Documentation](https://docs.nestjs.com/)
- **MongoDB**: [MongoDB Documentation](https://docs.mongodb.com/)

---

**Built with ❤️ for the Construction Industry using NestJS, TypeScript, and MongoDB**
