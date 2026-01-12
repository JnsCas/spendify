import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../../../src/common/guards/admin.guard';
import { createMockUser } from '../../utils/factories';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any = null): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access for admin user', () => {
      const mockUser = createMockUser({ email: 'admin@test.com' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('admin@test.com,other@test.com');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith('ADMIN_EMAILS', '');
    });

    it('should allow access regardless of email case', () => {
      const mockUser = createMockUser({ email: 'Admin@Test.COM' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('admin@test.com');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access for non-admin user', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('admin@test.com');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should deny access if user is not authenticated', () => {
      const context = createMockExecutionContext(null);

      configService.get.mockReturnValue('admin@test.com');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should handle multiple admin emails', () => {
      const mockUser = createMockUser({ email: 'second@test.com' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('admin@test.com, second@test.com, third@test.com');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle empty admin emails config', () => {
      const mockUser = createMockUser({ email: 'user@example.com' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Admin access required');
    });

    it('should handle admin emails with extra whitespace', () => {
      const mockUser = createMockUser({ email: 'admin@test.com' });
      const context = createMockExecutionContext(mockUser);

      configService.get.mockReturnValue('  admin@test.com  ,  other@test.com  ');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
