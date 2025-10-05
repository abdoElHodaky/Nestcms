# 📚 NestCMS API Reference

## Overview

This document provides comprehensive API reference for the NestCMS Construction Company Management System. All endpoints require proper authentication unless otherwise specified.

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

### Bearer Token Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "isEmployee": true,
      "employeeType": "manager"
    }
  }
}
```

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123",
  "Age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "isEmployee": true,
  "employeeType": "developer"
}
```

## User Management

### GET /users
Retrieve list of users with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by user role
- `isEmployee` (boolean): Filter by employee status

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "username": "john_doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "isEmployee": true,
        "employeeType": "manager",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST /users
Create a new user.

**Request Body:** Same as registration endpoint

### GET /users/:id
Retrieve specific user details.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "Age": 30,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "isEmployee": true,
    "employeeType": "manager",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Project Management

### GET /projects
Retrieve list of projects.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by project status
- `employee` (string): Filter by assigned employee ID
- `orgz` (string): Filter by organization ID

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "startDate": "2024-01-01",
        "endDate": "2024-06-01",
        "content": "Office building construction project",
        "status": "in_progress",
        "employee": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe"
        },
        "orgz": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "ABC Construction"
        },
        "contract": {
          "_id": "507f1f77bcf86cd799439014",
          "title": "Office Building Contract"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /projects
Create a new project.

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "content": "Office building construction project",
  "status": "planning",
  "employee": "507f1f77bcf86cd799439011",
  "orgz": "507f1f77bcf86cd799439013",
  "contract": "507f1f77bcf86cd799439014"
}
```

### GET /projects/:id/steps
Retrieve project steps.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Foundation Work",
      "description": "Excavation and foundation pouring",
      "status": "completed",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T00:00:00.000Z",
      "project": "507f1f77bcf86cd799439012"
    }
  ]
}
```

### POST /projects/:id/steps
Add a new project step.

**Request Body:**
```json
{
  "title": "Foundation Work",
  "description": "Excavation and foundation pouring",
  "status": "planning",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-15T00:00:00.000Z"
}
```

## Payment Processing

### POST /payments/create
Create a new payment request.

**Request Body:**
```json
{
  "title": "Project Milestone Payment",
  "content": "Payment for foundation completion",
  "amount": "5000.00",
  "currency": "USD",
  "contractId": "507f1f77bcf86cd799439014",
  "client": "507f1f77bcf86cd799439016"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "title": "Project Milestone Payment",
    "amount": "5000.00",
    "currency": "USD",
    "status": "pending",
    "paymentUrl": "https://secure.paytabs.com/payment/page/...",
    "transR": "TXN_123456789"
  }
}
```

### POST /payments/verify
Verify payment status.

**Request Body:**
```json
{
  "paymentId": "507f1f77bcf86cd799439017",
  "transactionReference": "TXN_123456789"
}
```

### POST /payments/callback
PayTabs payment callback endpoint (webhook).

**Request Body:** PayTabs callback data

## Contract Management

### GET /contracts
Retrieve list of contracts.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Office Building Contract",
      "content": "Contract for office building construction",
      "status": "active",
      "creationDate": "2024-01-01",
      "client": {
        "_id": "507f1f77bcf86cd799439016",
        "fullName": "Jane Smith"
      },
      "employee": {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe"
      },
      "offerId": "507f1f77bcf86cd799439018"
    }
  ]
}
```

### POST /contracts
Create a new contract.

**Request Body:**
```json
{
  "title": "Office Building Contract",
  "content": "Contract for office building construction",
  "status": "draft",
  "client": "507f1f77bcf86cd799439016",
  "employee": "507f1f77bcf86cd799439011",
  "offerId": "507f1f77bcf86cd799439018"
}
```

## Organization Management

### GET /organizations
Retrieve list of organizations.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "ABC Construction",
      "description": "Leading construction company",
      "status": "open",
      "address": {
        "street": "456 Business Ave",
        "city": "New York",
        "state": "NY",
        "zipCode": "10002",
        "country": "USA"
      },
      "owner": {
        "_id": "507f1f77bcf86cd799439019",
        "fullName": "Owner Name"
      },
      "profit_percentage": 0.201
    }
  ]
}
```

## Earnings & Financial Reports

### GET /earnings
Retrieve earnings data.

**Query Parameters:**
- `type` (string): "profit" or "loss"
- `period` (string): "monthly", "4-month", "cumulative-quarter", "yearly"
- `project` (string): Filter by project ID
- `orgz` (string): Filter by organization ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "type": "profit",
      "period": "monthly",
      "title": "January 2024 Earnings",
      "description": "Monthly earnings summary",
      "amount": 15000.00,
      "currency": "USD",
      "project": {
        "_id": "507f1f77bcf86cd799439012",
        "content": "Office building construction project"
      }
    }
  ]
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Request validation failed
- `INTERNAL_ERROR` (500): Server error
- `PAYMENT_ERROR` (402): Payment processing error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Payment endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination information is included in the response:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:
- **Filtering**: Use query parameters matching field names
- **Sorting**: Use `sort` parameter with field name and direction
  - `sort=createdAt:desc` (descending)
  - `sort=title:asc` (ascending)

Example:
```
GET /projects?status=active&sort=createdAt:desc&page=1&limit=20
```

