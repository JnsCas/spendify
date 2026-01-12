import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService, AuthResponse, MeResponse } from '../../src/auth/auth.service';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { createMockUser } from '../utils/factories';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getMe: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        inviteCode: 'INVITE123',
      };

      const mockResponse: AuthResponse = {
        accessToken: 'jwt.token.here',
        user: {
          id: '123',
          email: registerDto.email,
          name: registerDto.name,
        },
      };

      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
        registerDto.inviteCode
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse: AuthResponse = {
        accessToken: 'jwt.token.here',
        user: {
          id: '123',
          email: loginDto.email,
          name: 'Test User',
        },
      };

      authService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMe', () => {
    it('should return current user info', () => {
      const mockUser = createMockUser();
      const mockResponse: MeResponse = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        isAdmin: false,
      };

      authService.getMe.mockReturnValue(mockResponse);

      const result = controller.getMe(mockUser);

      expect(authService.getMe).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockResponse);
    });

    it('should return admin status for admin user', () => {
      const mockUser = createMockUser({ email: 'admin@test.com' });
      const mockResponse: MeResponse = {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        isAdmin: true,
      };

      authService.getMe.mockReturnValue(mockResponse);

      const result = controller.getMe(mockUser);

      expect(result.isAdmin).toBe(true);
    });
  });
});
