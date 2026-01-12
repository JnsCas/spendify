import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { InviteCodesService } from '../../src/invite-codes/invite-codes.service';
import { createMockUser } from '../utils/factories';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let inviteCodesService: jest.Mocked<InviteCodesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: InviteCodesService,
          useValue: {
            validateAndUse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    inviteCodesService = module.get(InviteCodesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';
      const inviteCode = 'INVITE123';
      const mockUser = createMockUser({ email, name });
      const accessToken = 'jwt.token.here';

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      inviteCodesService.validateAndUse.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.register(email, password, name, inviteCode);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.create).toHaveBeenCalledWith(email, password, name);
      expect(inviteCodesService.validateAndUse).toHaveBeenCalledWith(inviteCode, mockUser.id);
      expect(result).toEqual({
        accessToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const email = 'existing@example.com';
      const mockUser = createMockUser({ email });

      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register(email, 'password', 'Name', 'CODE')
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = createMockUser({ email });
      const accessToken = 'jwt.token.here';

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(email, password);

      expect(usersService.findByEmail).toHaveBeenCalledWith(email);
      expect(usersService.validatePassword).toHaveBeenCalledWith(mockUser, password);
      expect(result).toEqual({
        accessToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const email = 'test@example.com';
      const mockUser = createMockUser({ email });

      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(
        service.login(email, 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should validate and return user by payload', async () => {
      const mockUser = createMockUser();
      const payload = { sub: mockUser.id, email: mockUser.email };

      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const payload = { sub: 'nonexistent-id', email: 'test@example.com' };

      usersService.findById.mockResolvedValue(null);

      const result = await service.validateUser(payload);

      expect(result).toBeNull();
    });
  });

  describe('getMe', () => {
    it('should return user info with admin status', () => {
      const mockUser = createMockUser({ email: 'admin@test.com' });
      configService.get.mockReturnValue('admin@test.com,other@test.com');

      const result = service.getMe(mockUser);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        isAdmin: true,
      });
    });

    it('should return non-admin status for regular user', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      configService.get.mockReturnValue('admin@test.com');

      const result = service.getMe(mockUser);

      expect(result.isAdmin).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin email', () => {
      configService.get.mockReturnValue('admin@test.com,another@test.com');

      const result = service.isAdmin('admin@test.com');

      expect(result).toBe(true);
    });

    it('should return true for admin email regardless of case', () => {
      configService.get.mockReturnValue('admin@test.com');

      const result = service.isAdmin('ADMIN@TEST.COM');

      expect(result).toBe(true);
    });

    it('should return false for non-admin email', () => {
      configService.get.mockReturnValue('admin@test.com');

      const result = service.isAdmin('user@example.com');

      expect(result).toBe(false);
    });

    it('should handle empty admin emails config', () => {
      configService.get.mockReturnValue('');

      const result = service.isAdmin('any@example.com');

      expect(result).toBe(false);
    });
  });
});
