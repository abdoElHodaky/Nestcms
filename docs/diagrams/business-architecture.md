# Business Architecture Diagram

## Construction Management System - Business Flow

```mermaid
graph TB
    %% External Actors
    Client[👤 Client]
    Employee[👨‍💼 Employee/Contractor]
    Admin[👨‍💻 Administrator]
    PayTabs[💳 PayTabs Gateway]
    
    %% Core Business Domains
    subgraph "User Management Domain"
        UM[User Management]
        Auth[Authentication & Authorization]
        Perms[Permissions & Roles]
    end
    
    subgraph "Project Management Domain"
        PM[Project Management]
        PS[Project Steps]
        PD[Project Designs]
        PN[Project Notes]
    end
    
    subgraph "Contract Management Domain"
        CM[Contract Management]
        CO[Contract Offers]
        CE[Contract-Employee Relations]
    end
    
    subgraph "Financial Domain"
        Pay[Payment Processing]
        Earn[Earnings Management]
        Trans[Transaction Tracking]
    end
    
    subgraph "Content Management Domain"
        Art[Articles & Documentation]
        Sched[Scheduling System]
        Org[Organization Management]
    end
    
    %% Business Process Flows
    Client -->|1. Register/Login| Auth
    Employee -->|1. Register/Login| Auth
    Admin -->|1. System Access| Auth
    
    Auth -->|2. Assign Roles| Perms
    Perms -->|3. Access Control| UM
    
    Client -->|4. Request Project| PM
    PM -->|5. Create Contract| CM
    CM -->|6. Generate Offer| CO
    
    Employee -->|7. Accept Contract| CE
    CE -->|8. Assign to Project| PM
    
    PM -->|9. Define Steps| PS
    PM -->|10. Add Designs| PD
    PM -->|11. Track Progress| PN
    
    Client -->|12. Initiate Payment| Pay
    Pay -->|13. Process Payment| PayTabs
    PayTabs -->|14. Callback/Verification| Trans
    Trans -->|15. Update Status| Pay
    
    Pay -->|16. Calculate Earnings| Earn
    Earn -->|17. Distribute Payments| Employee
    
    Admin -->|18. Manage Content| Art
    Admin -->|19. Schedule Tasks| Sched
    Admin -->|20. Organize Structure| Org
    
    %% Data Relationships
    UM -.->|User Data| PM
    UM -.->|User Data| CM
    UM -.->|User Data| Pay
    
    CM -.->|Contract Data| Pay
    PM -.->|Project Data| Earn
    Pay -.->|Payment Data| Earn
    
    style Client fill:#e1f5fe
    style Employee fill:#f3e5f5
    style Admin fill:#fff3e0
    style PayTabs fill:#e8f5e8
```

## Payment Processing Business Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as NestCMS System
    participant PT as PayTabs Gateway
    participant E as Employee
    
    Note over C,E: Payment Lifecycle
    
    C->>S: 1. Create Payment Request
    S->>S: 2. Link to Contract
    S->>S: 3. Generate Payment Record
    
    C->>S: 4. Initiate Payment
    S->>PT: 5. Create Payment Page
    PT-->>S: 6. Return Payment URL
    S-->>C: 7. Redirect to Payment
    
    C->>PT: 8. Complete Payment
    PT->>S: 9. Payment Callback
    S->>PT: 10. Verify Transaction
    PT-->>S: 11. Verification Response
    
    S->>S: 12. Update Payment Status
    S->>S: 13. Calculate Earnings
    S->>E: 14. Notify Payment Complete
    
    Note over C,E: Payment Complete
```

## Data Aggregation Business Logic

```mermaid
graph LR
    subgraph "Contract Management"
        C1[Contract Creation]
        C2[Employee Assignment]
        C3[Contract Validation]
    end
    
    subgraph "Project Execution"
        P1[Project Initiation]
        P2[Step Management]
        P3[Design Integration]
        P4[Progress Tracking]
    end
    
    subgraph "Financial Operations"
        F1[Payment Processing]
        F2[Earnings Calculation]
        F3[Revenue Distribution]
    end
    
    subgraph "Data Aggregation Layer"
        A1[Contract-Employee Lookup]
        A2[Project-User Relations]
        A3[Earnings Aggregation]
        A4[Permission Mapping]
    end
    
    C2 --> A1
    P1 --> A2
    F2 --> A3
    C3 --> A4
    
    A1 --> |Employee Data| P1
    A2 --> |Project Data| F1
    A3 --> |Financial Data| F3
    A4 --> |Access Control| C1
    
    style A1 fill:#ffecb3
    style A2 fill:#ffecb3
    style A3 fill:#ffecb3
    style A4 fill:#ffecb3
```

## Business Entity Relationships

```mermaid
erDiagram
    USER ||--o{ CONTRACT : "creates/assigned"
    USER ||--o{ PROJECT : "manages/works_on"
    USER ||--o{ PAYMENT : "initiates"
    USER ||--o{ PERMISSION : "has"
    
    CONTRACT ||--|| PAYMENT : "requires"
    CONTRACT ||--|| PROJECT : "defines"
    CONTRACT }|--|| USER : "employee"
    CONTRACT }|--|| USER : "client"
    
    PROJECT ||--o{ PROJECT_STEP : "contains"
    PROJECT ||--o{ DESIGN : "includes"
    PROJECT ||--o{ NOTE : "has"
    
    PAYMENT ||--|| TRANSACTION : "generates"
    PAYMENT ||--o{ EARNING : "creates"
    
    ORGANIZATION ||--o{ USER : "contains"
    ORGANIZATION ||--o{ PROJECT : "owns"
    
    USER {
        ObjectId _id
        string email
        string name
        string role
        ObjectId[] permissions
        ObjectId organization
    }
    
    CONTRACT {
        ObjectId _id
        ObjectId client
        ObjectId employee
        string status
        number amount
        string currency
    }
    
    PROJECT {
        ObjectId _id
        string title
        ObjectId contract
        ObjectId[] employees
        ObjectId[] steps
        ObjectId[] designs
        string status
    }
    
    PAYMENT {
        ObjectId _id
        ObjectId client
        ObjectId contractId
        number amount
        string currency
        string status
        string transR
    }
    
    EARNING {
        ObjectId _id
        ObjectId userId
        number amount
        string currency
        number period
        string type
    }
```

## Business Process Decision Points

```mermaid
flowchart TD
    Start([Project Request]) --> Auth{User Authenticated?}
    Auth -->|No| Login[Redirect to Login]
    Auth -->|Yes| Perm{Has Permission?}
    
    Perm -->|No| Deny[Access Denied]
    Perm -->|Yes| Create[Create Project]
    
    Create --> Contract{Contract Required?}
    Contract -->|Yes| GenContract[Generate Contract]
    Contract -->|No| DirectAssign[Direct Assignment]
    
    GenContract --> Offer[Create Offer]
    Offer --> Accept{Offer Accepted?}
    Accept -->|No| Modify[Modify Terms]
    Accept -->|Yes| Payment{Payment Required?}
    
    Payment -->|Yes| PayProcess[Payment Processing]
    Payment -->|No| StartProject[Start Project]
    
    PayProcess --> PayVerify{Payment Verified?}
    PayVerify -->|No| PayFail[Payment Failed]
    PayVerify -->|Yes| StartProject
    
    StartProject --> Assign[Assign Employees]
    Assign --> Execute[Execute Project]
    Execute --> Complete[Project Complete]
    
    DirectAssign --> Assign
    Modify --> Offer
    PayFail --> Offer
    Login --> Auth
    
    style Start fill:#e8f5e8
    style Complete fill:#e8f5e8
    style Deny fill:#ffebee
    style PayFail fill:#ffebee
```

## Key Business Rules

### Payment Processing Rules
1. **Payment Verification**: All payments must be verified through PayTabs before status update
2. **Multi-Currency Support**: System supports multiple currencies with proper conversion tracking
3. **Transaction Integrity**: Each payment must have a unique transaction reference
4. **Callback Security**: Payment callbacks must be verified for authenticity

### Contract Management Rules
1. **Employee Assignment**: Contracts must have assigned employees before project initiation
2. **Client Validation**: Only authenticated clients can create payment requests
3. **Status Tracking**: Contract status must reflect current payment and project state
4. **Offer Management**: Contract offers can be modified until acceptance

### Project Execution Rules
1. **Step Dependencies**: Project steps must follow defined sequence and dependencies
2. **Design Integration**: Project designs must be linked to specific project phases
3. **Progress Tracking**: Project progress must be updated based on completed steps
4. **Employee Access**: Only assigned employees can update project status

### Data Aggregation Rules
1. **Performance Optimization**: Complex queries must use aggregation pipelines for efficiency
2. **Data Consistency**: Aggregated data must maintain consistency across related entities
3. **Access Control**: Aggregation results must respect user permissions and data visibility
4. **Caching Strategy**: Frequently accessed aggregations should implement caching mechanisms

This business architecture provides a comprehensive view of the construction management system's business processes, data relationships, and decision flows, enabling stakeholders to understand the system's business value and operational requirements.

