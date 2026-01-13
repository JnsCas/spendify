import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../src/users/users.service';
import { UserRepository } from '../../src/users/user.repository';
import { createMockUser } from '../utils/factories';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      userRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const mockUser = createMockUser();
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';
      const hashedPassword = 'hashed_password_123';

      const mockUser = createMockUser({ email, name, passwordHash: hashedPassword });

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      userRepository.create.mockResolvedValue(mockUser);

      const result = await service.create(email, password, name);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email,
        passwordHash: hashedPassword,
        name,
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      const mockUser = createMockUser({ passwordHash: 'hashed_password' });
      const password = 'correct_password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(mockUser, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const mockUser = createMockUser({ passwordHash: 'hashed_password' });
      const password = 'wrong_password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(mockUser, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(result).toBe(false);
    });
  });
});
