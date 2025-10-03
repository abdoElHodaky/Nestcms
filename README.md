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
- **Payment Processing**: Integrated PayTabs payment gateway
- **Contract Management**: Digital contract creation and management
- **Earnings Tracking**: Project-based earnings and commission calculations
- **Offer Management**: Bid and proposal management system

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
- **Users**: Multi-role user system with organization affiliations
- **Contracts**: Legal agreements linked to projects and payments
- **Payments**: Financial transactions with PayTabs integration
- **Schedules**: Time-based project planning and resource allocation

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
