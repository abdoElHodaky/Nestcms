# 🏗️ NestCMS Architecture Diagrams

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Application]
        MOBILE[Mobile App]
        API_CLIENT[API Clients]
    end
    
    subgraph "API Gateway Layer"
        SWAGGER[Swagger UI]
        CORS[CORS Middleware]
        AUTH_GUARD[Auth Guard]
        PERM_GUARD[Permission Guard]
    end
    
    subgraph "Application Layer"
        subgraph "Core Modules"
            AUTH[Authentication Module]
            USERS[Users Module]
            ORGS[Organizations Module]
            PROJECTS[Projects Module]
            CONTRACTS[Contracts Module]
            PAYMENTS[Payments Module]
            SCHEDULES[Schedules Module]
            EARNINGS[Earnings Module]
        end
        
        subgraph "Supporting Modules"
            ARTICLES[Articles Module]
            NOTES[Notes Module]
            OFFERS[Offers Module]
            PERMISSIONS[Permissions Module]
            COMMISSION[Commission Module]
        end
    end
    
    subgraph "External Services"
        PAYTABS[PayTabs Gateway]
        EMAIL[Email Service]
        FILE_STORAGE[File Storage]
    end
    
    subgraph "Data Layer"
        MONGODB[(MongoDB Database)]
        REDIS[(Redis Cache)]
    end
    
    WEB --> SWAGGER
    MOBILE --> AUTH_GUARD
    API_CLIENT --> CORS
    
    SWAGGER --> AUTH
    AUTH_GUARD --> USERS
    PERM_GUARD --> PERMISSIONS
    
    PROJECTS --> CONTRACTS
    CONTRACTS --> PAYMENTS
    PAYMENTS --> PAYTABS
    PAYMENTS --> EARNINGS
    EARNINGS --> COMMISSION
    
    USERS --> ORGS
    PROJECTS --> SCHEDULES
    PROJECTS --> NOTES
    CONTRACTS --> OFFERS
    
    AUTH --> MONGODB
    USERS --> MONGODB
    PROJECTS --> MONGODB
    PAYMENTS --> MONGODB
    EARNINGS --> REDIS
```

## 2. Database Entity Relationship Diagram

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string fullName
        string username UK
        string phone UK
        string email
        string password
        number Age
        Object address
        boolean isEmployee
        boolean isAdmin
        string employeeType
        string adminType
        Date createdAt
        Date updatedAt
    }
    
    Employee {
        ObjectId _id PK
        boolean isEmployee
        string employeeType
        ObjectId[] commissions FK
        ObjectId[] salaries FK
    }
    
    Client {
        ObjectId _id PK
        boolean isEmployee
        boolean isAdmin
    }
    
    Admin {
        ObjectId _id PK
        boolean isAdmin
        string adminType
    }
    
    Owner {
        ObjectId _id PK
        boolean isEmployee
        boolean isAdmin
        string adminType
    }
    
    Organization {
        ObjectId _id PK
        Object address
        string status
        ObjectId[] projects FK
        string title
        string description
        ObjectId owner FK
        ObjectId[] earnings FK
        number profit_percentage
        Date createdAt
        Date updatedAt
    }
    
    Project {
        ObjectId _id PK
        string startDate
        string endDate
        string content
        string status
        ObjectId[] earnings FK
        ObjectId orgz FK
        ObjectId employee FK
        ObjectId[] designs FK
        ObjectId contract FK
        ObjectId[] steps FK
        ObjectId[] workers FK
        Date createdAt
        Date updatedAt
    }
    
    ProjectStep {
        ObjectId _id PK
        string title
        string description
        string status
        Date startDate
        Date endDate
        ObjectId project FK
    }
    
    Design {
        ObjectId _id PK
        string title
        string description
        string filePath
        ObjectId project FK
    }
    
    ProjectWorker {
        ObjectId _id PK
        ObjectId employee FK
        ObjectId project FK
        string role
        Date assignedDate
    }
    
    Contract {
        ObjectId _id PK
        string title
        string content
        string creationDate
        string status
        string path
        ObjectId offerId FK
        ObjectId client FK
        ObjectId employee FK
        ObjectId[] paymentsIds FK
        Date createdAt
        Date updatedAt
    }
    
    Payment {
        ObjectId _id PK
        string title
        string content
        string date
        string status
        string amount
        string currency
        ObjectId contractId FK
        ObjectId client FK
        string transR
        Date createdAt
        Date updatedAt
    }
    
    Offer {
        ObjectId _id PK
        string title
        string description
        number amount
        string currency
        string status
        ObjectId client FK
        ObjectId employee FK
        Date createdAt
        Date updatedAt
    }
    
    Schedule {
        ObjectId _id PK
        string title
        string description
        Date startDate
        Date endDate
        ObjectId project FK
        ObjectId[] resources FK
    }
    
    Earning {
        ObjectId _id PK
        string type
        string period
        string distribute_period
        string title
        string description
        number amount
        string currency
        Date createdAt
        Date updatedAt
    }
    
    ProjectEarning {
        ObjectId _id PK
        ObjectId project FK
    }
    
    OrgzEarning {
        ObjectId _id PK
        ObjectId orgz FK
        Object[] earningIds
    }
    
    Commission {
        ObjectId _id PK
        ObjectId employee FK
        number amount
        string currency
        string type
        Date calculatedDate
    }
    
    Salary {
        ObjectId _id PK
        ObjectId employee FK
        number amount
        string currency
        string period
        Date payDate
    }
    
    Article {
        ObjectId _id PK
        string title
        string content
        ObjectId author FK
        string status
        Date createdAt
        Date updatedAt
    }
    
    Note {
        ObjectId _id PK
        string title
        string content
        ObjectId project FK
        ObjectId author FK
        Date createdAt
        Date updatedAt
    }
    
    Permission {
        ObjectId _id PK
        string name
        string resource
        string action
        string[] roles
    }
    
    %% Relationships
    User ||--o{ Employee : "inherits"
    User ||--o{ Client : "inherits"
    User ||--o{ Admin : "inherits"
    Employee ||--o{ Owner : "inherits"
    
    Organization ||--o{ Project : "has"
    Owner ||--o{ Organization : "owns"
    
    Project ||--o{ ProjectStep : "has"
    Project ||--o{ Design : "has"
    Project ||--o{ ProjectWorker : "has"
    Project ||--o{ Note : "has"
    Project ||--o{ Schedule : "has"
    Project ||--o{ ProjectEarning : "generates"
    
    Employee ||--o{ Project : "manages"
    Employee ||--o{ ProjectWorker : "assigned_to"
    Employee ||--o{ Commission : "earns"
    Employee ||--o{ Salary : "receives"
    
    Client ||--o{ Contract : "signs"
    Employee ||--o{ Contract : "manages"
    Contract ||--o{ Payment : "has"
    Contract ||--o{ Project : "defines"
    
    Offer ||--o{ Contract : "becomes"
    Client ||--o{ Offer : "receives"
    Employee ||--o{ Offer : "creates"
    
    Client ||--o{ Payment : "makes"
    
    Organization ||--o{ OrgzEarning : "generates"
    
    User ||--o{ Article : "authors"
    User ||--o{ Note : "authors"
```

## 3. User Role Hierarchy

```mermaid
graph TD
    User[👤 User<br/>Base User Entity]
    
    User --> Client[👥 Client<br/>External Customer]
    User --> Employee[👷 Employee<br/>Company Worker]
    User --> Admin[👨‍💼 Admin<br/>System Administrator]
    
    Employee --> Owner[👑 Owner<br/>Company Owner]
    
    Client --> ClientFeatures[🔹 Client Features<br/>• View Projects<br/>• Make Payments<br/>• Sign Contracts<br/>• Submit Offers]
    
    Employee --> EmployeeFeatures[🔹 Employee Features<br/>• Manage Projects<br/>• Create Contracts<br/>• Process Payments<br/>• Earn Commissions<br/>• Receive Salaries]
    
    Admin --> AdminFeatures[🔹 Admin Features<br/>• User Management<br/>• System Configuration<br/>• Permission Management<br/>• Reports & Analytics]
    
    Owner --> OwnerFeatures[🔹 Owner Features<br/>• Organization Management<br/>• Financial Oversight<br/>• Strategic Planning<br/>• All Admin Features]
    
    style User fill:#e1f5fe
    style Client fill:#f3e5f5
    style Employee fill:#e8f5e8
    style Admin fill:#fff3e0
    style Owner fill:#fce4ec
```

## 4. Project Lifecycle Workflow

```mermaid
graph TD
    Start([Project Initiation]) --> Offer[📋 Create Offer]
    Offer --> OfferReview{Client Review}
    OfferReview -->|Accepted| Contract[📄 Generate Contract]
    OfferReview -->|Rejected| OfferRevision[📝 Revise Offer]
    OfferRevision --> Offer
    
    Contract --> ContractSigning[✍️ Contract Signing]
    ContractSigning --> ProjectCreation[🏗️ Create Project]
    
    ProjectCreation --> ProjectPlanning[📅 Project Planning]
    ProjectPlanning --> ResourceAllocation[👷 Assign Workers]
    ResourceAllocation --> ScheduleCreation[⏰ Create Schedule]
    
    ScheduleCreation --> ProjectExecution[🔨 Project Execution]
    
    ProjectExecution --> StepManagement[📋 Manage Project Steps]
    StepManagement --> StepComplete{Step Complete?}
    StepComplete -->|No| StepWork[Continue Work]
    StepWork --> StepManagement
    StepComplete -->|Yes| NextStep{More Steps?}
    NextStep -->|Yes| StepManagement
    NextStep -->|No| ProjectReview[🔍 Project Review]
    
    ProjectReview --> QualityCheck{Quality OK?}
    QualityCheck -->|No| Rework[🔧 Rework Required]
    Rework --> StepManagement
    QualityCheck -->|Yes| ProjectCompletion[✅ Project Completion]
    
    ProjectCompletion --> FinalPayment[💰 Final Payment]
    FinalPayment --> EarningsCalculation[📊 Calculate Earnings]
    EarningsCalculation --> CommissionDistribution[💸 Distribute Commissions]
    CommissionDistribution --> ProjectClosure[🏁 Project Closure]
    
    %% Payment Flow (Parallel Process)
    Contract --> InitialPayment[💳 Initial Payment]
    InitialPayment --> PaymentVerification[✅ Payment Verification]
    PaymentVerification --> MilestonePayments[💰 Milestone Payments]
    MilestonePayments --> ProjectExecution
    
    style Start fill:#e8f5e8
    style ProjectClosure fill:#ffcdd2
    style Contract fill:#e1f5fe
    style ProjectExecution fill:#fff3e0
```

## 5. Payment Processing Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as NestCMS API
    participant PT as PayTabs Gateway
    participant DB as MongoDB
    participant E as Employee
    
    C->>API: Initiate Payment
    API->>DB: Create Payment Record
    API->>PT: Request Payment Page
    PT-->>API: Payment Page URL
    API-->>C: Redirect to Payment Page
    
    C->>PT: Enter Payment Details
    PT->>PT: Process Payment
    PT->>API: Payment Callback
    
    API->>DB: Update Payment Status
    API->>DB: Update Contract Status
    
    alt Payment Successful
        API->>DB: Create Earning Record
        API->>DB: Calculate Commission
        API->>E: Notify Payment Success
        API-->>C: Payment Confirmation
    else Payment Failed
        API->>DB: Mark Payment Failed
        API-->>C: Payment Error
    end
    
    API->>DB: Log Transaction
```

## 6. Module Dependencies

```mermaid
graph LR
    subgraph "Core Infrastructure"
        AUTH[Auth Module]
        PERM[Permissions Module]
        USERS[Users Module]
    end
    
    subgraph "Business Logic"
        ORGS[Organizations Module]
        PROJECTS[Projects Module]
        CONTRACTS[Contracts Module]
        PAYMENTS[Payments Module]
        SCHEDULES[Schedules Module]
    end
    
    subgraph "Financial Management"
        EARNINGS[Earnings Module]
        COMMISSION[Commission Module]
        OFFERS[Offers Module]
    end
    
    subgraph "Content Management"
        ARTICLES[Articles Module]
        NOTES[Notes Module]
    end
    
    AUTH --> USERS
    PERM --> AUTH
    USERS --> ORGS
    ORGS --> PROJECTS
    PROJECTS --> CONTRACTS
    CONTRACTS --> PAYMENTS
    PAYMENTS --> EARNINGS
    EARNINGS --> COMMISSION
    CONTRACTS --> OFFERS
    PROJECTS --> SCHEDULES
    PROJECTS --> NOTES
    USERS --> ARTICLES
    
    PERM -.-> PROJECTS
    PERM -.-> CONTRACTS
    PERM -.-> PAYMENTS
    PERM -.-> EARNINGS
    
    style AUTH fill:#ffcdd2
    style PERM fill:#ffcdd2
    style USERS fill:#ffcdd2
    style PROJECTS fill:#e8f5e8
    style PAYMENTS fill:#fff3e0
```

## 7. API Endpoint Structure

```mermaid
graph TD
    API[🌐 NestCMS API]
    
    API --> AUTH_EP[🔐 /auth<br/>Authentication Endpoints]
    API --> USERS_EP[👤 /users<br/>User Management]
    API --> ORGS_EP[🏢 /organizations<br/>Organization Management]
    API --> PROJ_EP[🏗️ /projects<br/>Project Management]
    API --> CONT_EP[📄 /contracts<br/>Contract Management]
    API --> PAY_EP[💳 /payments<br/>Payment Processing]
    API --> SCHED_EP[📅 /schedules<br/>Schedule Management]
    API --> EARN_EP[📊 /earnings<br/>Earnings & Reports]
    API --> ART_EP[📝 /articles<br/>Content Management]
    API --> NOTE_EP[📋 /notes<br/>Notes Management]
    API --> OFFER_EP[💼 /offers<br/>Offer Management]
    API --> PERM_EP[🛡️ /permissions<br/>Permission Management]
    
    AUTH_EP --> LOGIN[POST /login]
    AUTH_EP --> REGISTER[POST /register]
    AUTH_EP --> REFRESH[POST /refresh]
    
    PROJ_EP --> PROJ_CRUD[CRUD Operations]
    PROJ_EP --> PROJ_STEPS[/projects/:id/steps]
    PROJ_EP --> PROJ_DESIGNS[/projects/:id/designs]
    PROJ_EP --> PROJ_WORKERS[/projects/:id/workers]
    PROJ_EP --> PROJ_NOTES[/projects/:id/notes]
    
    PAY_EP --> PAY_CREATE[POST /create]
    PAY_EP --> PAY_VERIFY[POST /verify]
    PAY_EP --> PAY_CALLBACK[POST /callback]
    PAY_EP --> PAY_STATUS[GET /:id/status]
    
    style API fill:#e1f5fe
    style AUTH_EP fill:#ffcdd2
    style PROJ_EP fill:#e8f5e8
    style PAY_EP fill:#fff3e0
```

## 8. Security Architecture

```mermaid
graph TB
    subgraph "Request Flow"
        REQ[Incoming Request]
        CORS_MW[CORS Middleware]
        AUTH_GUARD[Authentication Guard]
        PERM_GUARD[Permission Guard]
        CONTROLLER[Controller]
    end
    
    subgraph "Authentication Layer"
        JWT[JWT Strategy]
        LOCAL[Local Strategy]
        PASSPORT[Passport.js]
    end
    
    subgraph "Authorization Layer"
        ROLES[Role-Based Access]
        PERMS[Permission System]
        RESOURCE[Resource Protection]
    end
    
    subgraph "Data Protection"
        ENCRYPT[Password Encryption]
        VALIDATE[Input Validation]
        SANITIZE[Data Sanitization]
    end
    
    REQ --> CORS_MW
    CORS_MW --> AUTH_GUARD
    AUTH_GUARD --> JWT
    AUTH_GUARD --> LOCAL
    JWT --> PASSPORT
    LOCAL --> PASSPORT
    
    AUTH_GUARD --> PERM_GUARD
    PERM_GUARD --> ROLES
    PERM_GUARD --> PERMS
    PERMS --> RESOURCE
    
    PERM_GUARD --> CONTROLLER
    CONTROLLER --> VALIDATE
    VALIDATE --> SANITIZE
    SANITIZE --> ENCRYPT
    
    style REQ fill:#e8f5e8
    style AUTH_GUARD fill:#ffcdd2
    style PERM_GUARD fill:#fff3e0
    style CONTROLLER fill:#e1f5fe
```

---

*These diagrams provide a comprehensive view of the NestCMS architecture, from high-level system overview to detailed component interactions. They serve as living documentation that should be updated as the system evolves.*

