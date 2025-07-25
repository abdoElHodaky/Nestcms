import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';

// Global test setup
let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_EXPIRES_IN = '1h';
  
  // Start in-memory MongoDB instance for testing
  if (process.env.CI !== 'true') {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
  }
});

afterAll(async () => {
  // Clean up MongoDB instance
  if (mongod) {
    await mongod.stop();
  }
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockArticle: () => ({
    _id: '507f1f77bcf86cd799439012',
    title: 'Test Article',
    content: 'Test content',
    author: '507f1f77bcf86cd799439011',
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockProject: () => ({
    _id: '507f1f77bcf86cd799439013',
    name: 'Test Project',
    description: 'Test project description',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
    }
  }
  
  var testUtils: {
    createMockUser: () => any;
    createMockArticle: () => any;
    createMockProject: () => any;
  };
}

// Custom Jest matcher for MongoDB ObjectIds
expect.extend({
  toBeValidObjectId(received) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    const pass = objectIdRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ObjectId`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ObjectId`,
        pass: false,
      };
    }
  },
});

