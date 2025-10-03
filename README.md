# 🏗️ NestCMS - Construction Company Management System

<p align="center">
  <img src="https://nestjs.com/img/logo_text.svg" width="200" alt="NestJS Logo" />
  <img src="https://raw.githubusercontent.com/mongodb/mongo/master/docs/leaf.svg" width="100" alt="MongoDB Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10.4.4-red?logo=nestjs" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.6.2-blue?logo=typescript" alt="TypeScript Version" />
  <img src="https://img.shields.io/badge/MongoDB-8.7.0-green?logo=mongodb" alt="MongoDB Version" />
  <img src="https://img.shields.io/badge/Docker-Enabled-blue?logo=docker" alt="Docker Support" />
  <img src="https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes" alt="Kubernetes Ready" />
  <img src="https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?logo=swagger" alt="Swagger Documentation" />
</p>

<p align="center">
  <strong>Enterprise-grade Construction Company Management System built with NestJS, TypeScript, and MongoDB</strong>
</p>

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

#### **PayTabs Integration Flow**
```mermaid
graph LR
    Client[👤 Client] --> NestCMS[🏗️ NestCMS API]
    NestCMS --> PayTabs[💳 PayTabs Gateway]
    PayTabs --> Bank[🏦 Bank/Card Processor]
    Bank --> PayTabs
    PayTabs --> |Webhook| NestCMS
    NestCMS --> |Confirmation| Client
    
    style Client fill:#e3f2fd
    style NestCMS fill:#e91e63
    style PayTabs fill:#ff9800
    style Bank fill:#4caf50
```

#### **Database Aggregation Architecture**
```mermaid
graph TB
    subgraph "Services Layer"
        US[Users Service]
        PS[Projects Service]
        CS[Contracts Service]
        ES[Earnings Service]
    end
    
    subgraph "Aggregation Pipelines"
        UL[User Lookups]
        PL[Project Relations]
        CL[Contract-Employee]
        EL[Earnings Calc]
    end
    
    subgraph "MongoDB Cluster"
        Primary[(Primary DB)]
        Replica1[(Read Replica 1)]
        Replica2[(Read Replica 2)]
    end
    
    US --> UL
    PS --> PL
    CS --> CL
    ES --> EL
    
    UL --> Replica1
    PL --> Replica2
    CL --> Replica1
    EL --> Replica2
    
    US --> Primary
    PS --> Primary
    CS --> Primary
    ES --> Primary
    
    style Primary fill:#4caf50
    style Replica1 fill:#81c784
    style Replica2 fill:#81c784
```

#### **System Security Architecture**
```mermaid
graph TB
    subgraph "Security Layers"
        WAF[🛡️ Web Application Firewall]
        Auth[🔐 JWT Authentication]
        RBAC[👥 Role-Based Access Control]
        Encrypt[🔒 Data Encryption]
    end
    
    subgraph "Application"
        API[🚀 NestJS API]
        Guards[⚔️ Guards & Middleware]
        Services[⚙️ Business Services]
    end
    
    subgraph "Data Layer"
        MongoDB[(🍃 MongoDB)]
        Redis[(⚡ Redis Cache)]
    end
    
    WAF --> Auth
    Auth --> RBAC
    RBAC --> API
    API --> Guards
    Guards --> Services
    Services --> Encrypt
    Encrypt --> MongoDB
    Services --> Redis
    
    style WAF fill:#f44336
    style Auth fill:#4caf50
    style RBAC fill:#2196f3
    style Encrypt fill:#9c27b0
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
