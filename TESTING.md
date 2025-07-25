# 🧪 Testing Guide for Nestcms

This document provides comprehensive information about the testing setup and best practices for the Nestcms project.

## 📋 Table of Contents

- [Testing Stack](#testing-stack)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Running Tests Locally](#running-tests-locally)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🛠️ Testing Stack

- **Test Framework**: Jest
- **Testing Utilities**: @nestjs/testing
- **Database**: MongoDB (with MongoDB Memory Server for local testing)
- **Coverage**: Istanbul (built into Jest)
- **E2E Testing**: Supertest
- **CI/CD**: GitHub Actions

## 🚀 GitHub Actions Workflow

The project includes a comprehensive GitHub Actions workflow (`.github/workflows/unit-tests.yml`) that:

### Features:
- ✅ **Multi-Node Testing**: Tests against Node.js 18.x and 20.x
- ✅ **MongoDB Service**: Runs MongoDB 6.0 as a service container
- ✅ **Security Audit**: Checks for vulnerabilities using npm audit
- ✅ **Build Verification**: Ensures the application builds successfully
- ✅ **Coverage Reporting**: Uploads coverage to Codecov
- ✅ **PR Comments**: Automatically comments on PRs with test results
- ✅ **Artifact Upload**: Saves test results and coverage reports

### Workflow Jobs:

1. **Unit Tests** (`unit-tests`)
   - Runs on multiple Node.js versions
   - Sets up MongoDB service
   - Runs linting, unit tests, and E2E tests
   - Generates coverage reports

2. **Security Audit** (`security-audit`)
   - Checks for security vulnerabilities
   - Fails on high-severity issues
   - Uses audit-ci for enhanced security checking

3. **Build Test** (`build-test`)
   - Verifies the application builds correctly
   - Checks for build artifacts

4. **Test Summary** (`test-summary`)
   - Provides overall test status
   - Depends on all other jobs

## 🏃‍♂️ Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Start MongoDB (if not using MongoDB Memory Server)
# Docker approach:
docker run -d -p 27017:27017 --name mongodb mongo:6.0

# Or use MongoDB Memory Server (recommended for testing)
# It's automatically configured in the test setup
```

### Test Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run tests in debug mode
npm run test:debug

# Run specific test file
npm run test -- users.service.spec.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should create"
```

### Environment Variables

Create a `.env.test` file for local testing:

```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/nestcms_test
JWT_SECRET=your-test-jwt-secret
JWT_EXPIRES_IN=1h
```

## 📁 Test Structure

```
src/
├── test-helpers/
│   └── test-module.helper.ts     # Common test utilities
├── test-setup.ts                 # Global test configuration
├── **/*.spec.ts                  # Unit tests
└── **/*.e2e-spec.ts             # E2E tests (in test/ directory)
```

### Test File Naming Conventions

- **Unit Tests**: `*.spec.ts` (e.g., `users.service.spec.ts`)
- **E2E Tests**: `*.e2e-spec.ts` (e.g., `app.e2e-spec.ts`)
- **Test Helpers**: `*.helper.ts`

## ✍️ Writing Tests

### Basic Test Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { createMockRepository } from '../test-helpers/test-module.helper';

describe('YourService', () => {
  let service: YourService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: getModelToken('YourModel'),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests here...
});
```

### Using Test Utilities

The project provides several test utilities in `src/test-helpers/test-module.helper.ts`:

```typescript
// Create mock repository
const mockRepo = createMockRepository();

// Create mock service
const mockService = createMockService(['findAll', 'create', 'update']);

// Create test JWT token
const token = createTestJwtToken({ sub: '1', username: 'test' });

// Create mock request/response
const req = createMockRequest(user, body, params, query);
const res = createMockResponse();
```

### Global Test Utilities

Available via `global.testUtils`:

```typescript
// Create mock data
const mockUser = testUtils.createMockUser();
const mockArticle = testUtils.createMockArticle();
const mockProject = testUtils.createMockProject();

// Custom matchers
expect(objectId).toBeValidObjectId();
```

## 📊 Coverage Requirements

The project enforces minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Exclusions

The following files are excluded from coverage:
- `*.spec.ts` - Test files
- `*.e2e-spec.ts` - E2E test files
- `*.interface.ts` - TypeScript interfaces
- `*.dto.ts` - Data Transfer Objects
- `*.entity.ts` - Database entities
- `*.schema.ts` - Database schemas
- `main.ts` - Application entry point

## 🎯 Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (databases, APIs, services)
- Use the provided mock utilities for consistency
- Clear mocks between tests using `jest.clearAllMocks()`

### 3. Async Testing
- Always use `async/await` for asynchronous operations
- Handle promise rejections properly
- Set appropriate timeouts for long-running tests

### 4. Database Testing
- Use MongoDB Memory Server for isolated testing
- Clean up data between tests
- Test both success and error scenarios

### 5. Error Testing
```typescript
// Test error scenarios
it('should throw error when user not found', async () => {
  mockRepository.findById.mockResolvedValue(null);
  
  await expect(service.findOne('invalid-id')).rejects.toThrow('User not found');
});
```

### 6. Controller Testing
```typescript
// Test HTTP responses
it('should return 200 and user data', async () => {
  const mockUser = testUtils.createMockUser();
  mockService.findOne.mockResolvedValue(mockUser);

  const result = await controller.findOne('1');

  expect(result).toEqual(mockUser);
});
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Ensure MongoDB is running
   docker ps | grep mongo
   
   # Check connection string
   echo $MONGODB_URI
   ```

2. **Jest Timeout Errors**
   ```typescript
   // Increase timeout for specific tests
   it('should handle long operation', async () => {
     // test code
   }, 60000); // 60 second timeout
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max_old_space_size=4096"
   npm run test
   ```

4. **Coverage Issues**
   ```bash
   # Generate detailed coverage report
   npm run test:cov
   open coverage/lcov-report/index.html
   ```

### GitHub Actions Debugging

1. **Check workflow logs** in the Actions tab
2. **Verify environment variables** are set correctly
3. **Check MongoDB service health** in the logs
4. **Review test artifacts** uploaded by the workflow

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## 🤝 Contributing

When adding new features:

1. Write tests for new functionality
2. Ensure coverage thresholds are met
3. Update this documentation if needed
4. Run the full test suite before submitting PRs

---

Happy Testing! 🎉

