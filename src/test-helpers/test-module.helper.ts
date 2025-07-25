import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

/**
 * Helper function to create a testing module with common dependencies
 */
export async function createTestingModule(
  imports: any[] = [],
  providers: any[] = [],
  controllers: any[] = [],
): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    imports: [
      // MongoDB connection for testing
      MongooseModule.forRoot(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        },
      ),
      // JWT module for authentication testing
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'test-secret',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
      }),
      // Passport module for authentication
      PassportModule,
      ...imports,
    ],
    controllers,
    providers,
  });

  return moduleBuilder.compile();
}

/**
 * Helper function to create mock repository
 */
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  exec: jest.fn(),
});

/**
 * Helper function to create mock service
 */
export const createMockService = (methods: string[] = []) => {
  const mockService: any = {};
  methods.forEach(method => {
    mockService[method] = jest.fn();
  });
  return mockService;
};

/**
 * Helper function to create JWT token for testing
 */
export const createTestJwtToken = (payload: any = { sub: '1', username: 'test' }) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret');
};

/**
 * Helper function to create mock request object
 */
export const createMockRequest = (user?: any, body?: any, params?: any, query?: any) => ({
  user: user || testUtils.createMockUser(),
  body: body || {},
  params: params || {},
  query: query || {},
  headers: {
    authorization: `Bearer ${createTestJwtToken()}`,
  },
});

/**
 * Helper function to create mock response object
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Helper function to clean up database after tests
 */
export const cleanupDatabase = async (connection: any) => {
  if (connection && connection.db) {
    await connection.db.dropDatabase();
  }
};

