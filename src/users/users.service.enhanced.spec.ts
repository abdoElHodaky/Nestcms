import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { createMockRepository, createTestingModule } from '../test-helpers/test-module.helper';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Service Tests', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [testUtils.createMockUser(), testUtils.createMockUser()];
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockUserModel.find).toHaveBeenCalled();
    });

    it('should handle empty result', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(mockUserModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = testUtils.createMockUser();
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne(mockUser._id);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('should return null for non-existent user', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('nonexistent-id');

      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith('nonexistent-id');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      const mockUser = { ...testUtils.createMockUser(), ...createUserDto };
      
      mockUserModel.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle creation errors', async () => {
      const createUserDto = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      };
      
      mockUserModel.create.mockRejectedValue(new Error('Validation failed'));

      await expect(service.create(createUserDto)).rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto = { username: 'updateduser' };
      const updatedUser = { ...testUtils.createMockUser(), ...updateUserDto };
      
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateUserDto,
        { new: true }
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = testUtils.createMockUser();
      
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.remove(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-id';
      
      mockUserModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove(userId);

      expect(result).toBeNull();
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });
  });
});

