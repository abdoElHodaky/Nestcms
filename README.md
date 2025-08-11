# NestCMS - Construction Company Management System

A comprehensive NestJS-based management system designed specifically for construction companies to streamline project management, client relationships, payments, and operational workflows.

## 🏗️ System Overview

NestCMS is a full-featured backend API that provides construction companies with tools to manage:

- **Project Management**: Complete project lifecycle from planning to completion
- **Client & Employee Management**: User roles, permissions, and organizational structure
- **Contract Management**: Digital contracts with project associations
- **Payment Processing**: Integrated PayTabs payment gateway
- **Scheduling**: Project timelines and milestone tracking
- **Financial Tracking**: Earnings, commissions, and payment records
- **Document Management**: Project designs, notes, and articles

## 🎯 Key Features

### 📋 Project Management
- **Project Lifecycle**: Track projects from initiation to completion
- **Design Management**: Upload and manage project designs
- **Step-by-Step Workflow**: Break projects into manageable steps
- **Worker Assignment**: Assign workers to specific projects
- **Progress Tracking**: Monitor project status and milestones

### 👥 User Management
- **Role-Based Access**: Admin, Employee, Client role management
- **JWT Authentication**: Secure token-based authentication
- **Permission System**: Granular permissions for different operations
- **Organization Support**: Multi-organization structure

### 💰 Financial Management
- **PayTabs Integration**: Secure payment processing
- **Earnings Tracking**: Project-based earnings calculation
- **Commission Management**: Employee commission tracking
- **Payment History**: Complete payment audit trail

### 📊 Business Intelligence
- **Project Analytics**: Track project performance and profitability
- **Financial Reports**: Earnings and payment summaries
- **Schedule Management**: Timeline and deadline tracking
- **Document Repository**: Centralized document storage

## 🛠️ Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport strategies
- **API Documentation**: Swagger/OpenAPI 3.0
- **Payment Gateway**: PayTabs
- **Containerization**: Docker
- **Orchestration**: Kubernetes with Helm charts
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

### Required Software
- [Node.js](https://nodejs.org/) >= 18.x
- [MongoDB](https://www.mongodb.com/) >= 5.0
- [Docker](https://www.docker.com/) (for containerized deployment)
- [Kubernetes](https://kubernetes.io/) (for production deployment)

### Required Accounts
- MongoDB Atlas account (or local MongoDB instance)
- PayTabs merchant account for payment processing
- Docker Hub account (for container registry)

## 🚀 Quick Start

### 1. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/abdoElHodaky/Nestcms.git
cd Nestcms

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run start:dev
```

### 2. Environment Configuration

Create a `.env` file with the following variables:

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/nestcms
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/nestcms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# PayTabs Configuration
PAYTABS_PROFILE_ID=your-paytabs-profile-id
PAYTABS_SERVER_KEY=your-paytabs-server-key
PAYTABS_REGION=your-paytabs-region

# Application Configuration
NODE_ENV=development
PORT=3000
```

### 3. Database Setup

The application will automatically connect to MongoDB using the provided `MONGO_URI`. Ensure your MongoDB instance is running and accessible.

### 4. Access the Application

- **API Server**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000 (returns "Hello World!")

## 🐳 Docker Deployment

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t nestcms:latest .

# Run the container
docker run -d \
  --name nestcms \
  -p 3000:3000 \
  -e MONGO_URI="your-mongodb-connection-string" \
  -e JWT_SECRET="your-jwt-secret" \
  nestcms:latest
```

### Docker Compose (Recommended for Development)

```yaml
version: '3.8'
services:
  nestcms:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/nestcms
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## ☸️ Kubernetes Deployment

### Using Helm Charts

```bash
# Navigate to the Helm chart directory
cd nestcms

# Install the application
helm install nestcms . \
  --set mongodb.uri="your-mongodb-uri" \
  --set jwt.secret="your-jwt-secret" \
  --set paytabs.profileId="your-profile-id" \
  --set paytabs.serverKey="your-server-key"
```

### Manual Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f nestcms/deployment.yaml
kubectl apply -f nestcms/clusterIp-service.yaml
kubectl apply -f nestcms/ingress.yaml
```

## 📚 API Documentation

### Swagger Documentation
Access the interactive API documentation at `/docs` when the server is running. The documentation includes:

- **Authentication endpoints** (`/auth`)
- **User management** (`/users`)
- **Project management** (`/projects`)
- **Contract management** (`/contracts`)
- **Payment processing** (`/payments`)
- **Schedule management** (`/schedules`)

### API Modules Overview

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Auth** | `/auth` | User authentication and JWT token management |
| **Users** | `/users` | User CRUD operations and profile management |
| **Projects** | `/projects` | Project lifecycle management |
| **Contracts** | `/contracts` | Contract creation and management |
| **Payments** | `/payments` | PayTabs payment processing |
| **Schedules** | `/schedules` | Project scheduling and timeline management |
| **Offers** | `/offers` | Project proposals and quotations |
| **Organizations** | `/orgs` | Multi-tenant organization management |
| **Earnings** | `/earnings` | Financial tracking and reporting |

### Authentication

The API uses JWT Bearer token authentication:

```bash
# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'

# Use token in subsequent requests
curl -X GET http://localhost:3000/projects \
  -H "Authorization: Bearer your-jwt-token"
```

## 🏗️ System Architecture

### Module Structure

```
src/
├── auth/              # Authentication & authorization
├── users/             # User management
├── projects/          # Project management
│   ├── controllers/   # API endpoints
│   ├── services/      # Business logic
│   ├── models/        # Database schemas
│   ├── dto/           # Data transfer objects
│   └── interfaces/    # TypeScript interfaces
├── contracts/         # Contract management
├── payments/          # Payment processing
├── schedules/         # Project scheduling
├── earnings/          # Financial tracking
└── shared/            # Common utilities and guards
```

### Database Schema

The system uses MongoDB with the following main collections:

- **Users**: System users (admins, employees, clients)
- **Projects**: Construction projects with associated data
- **Contracts**: Legal agreements and project contracts
- **Payments**: Payment records and transaction history
- **Schedules**: Project timelines and milestones
- **Organizations**: Multi-tenant organization data

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Password Hashing**: Secure password storage
- **CORS Configuration**: Cross-origin request handling
- **Input Validation**: Request data validation using class-validator
- **MongoDB Injection Protection**: Mongoose ODM security features

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run test coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## 🚀 CI/CD Pipeline

The repository includes GitHub Actions workflows for:

### Docker Build & Push
- **Workflow**: `.github/workflows/docker.yml`
- **Trigger**: Manual dispatch
- **Output**: Container image pushed to GitHub Container Registry

### Kubernetes Deployment
- **Workflow**: `.github/workflows/kube.yml`
- **Features**: Automated deployment to Kubernetes cluster
- **Includes**: Helm chart deployment and service configuration

### Helm Chart Management
- **Registry**: `.github/workflows/helm_registry.yml`
- **Template**: `.github/workflows/helm_template.yml`
- **Initialization**: `.github/workflows/helm_init.yml`

## 📊 Monitoring & Logging

### Health Checks
- **Endpoint**: `GET /`
- **Response**: Application status and version info

### Logging
The application uses NestJS built-in logging with configurable log levels.

### Performance Monitoring
Monitor key metrics:
- API response times
- Database query performance
- Memory and CPU usage
- Active user sessions

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start with debugging enabled

# Production
npm run build          # Build the application
npm run start:prod     # Start production server

# Code Quality
npm run format         # Format code with Prettier
npm run lint           # Run TSLint checks

# Testing
npm run test           # Run unit tests
npm run test:e2e       # Run end-to-end tests
npm run test:cov       # Generate test coverage report
```

### Code Structure Guidelines

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and data processing
- **Models**: Define database schemas and relationships
- **DTOs**: Define data transfer objects for API validation
- **Guards**: Implement authentication and authorization logic
- **Interceptors**: Handle cross-cutting concerns (logging, transformation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update API documentation for new endpoints
- Follow the existing code structure and naming conventions

## 📄 License

This project is licensed under the UNLICENSED License - see the package.json file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Verify `MONGO_URI` is correctly configured
   - Ensure MongoDB service is running
   - Check network connectivity and firewall settings

2. **JWT Authentication Errors**
   - Verify `JWT_SECRET` is set and secure
   - Check token expiration settings
   - Ensure proper Authorization header format

3. **PayTabs Integration Issues**
   - Verify PayTabs credentials are correct
   - Check PayTabs region configuration
   - Review PayTabs API documentation for updates

4. **Docker Deployment Issues**
   - Ensure all environment variables are properly set
   - Check container logs: `docker logs nestcms`
   - Verify port mappings and network configuration

### Getting Help

- **API Documentation**: Visit `/docs` for interactive API documentation
- **GitHub Issues**: Report bugs and request features
- **Development**: Check the source code and inline comments

---

**Built with ❤️ for the construction industry**

*This system is designed to streamline construction company operations and improve project management efficiency.*

