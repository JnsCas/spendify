import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRepository } from '../../src/users/user.repository';
import { User } from '../../src/users/user.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockUser } from '../utils/factories';

describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const mockUser = createMockUser({ email: 'test@example.com' });
      typeOrmRepository.findOne!.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      typeOrmRepository.findOne!.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const mockUser = createMockUser();
      typeOrmRepository.findOne!.mockResolvedValue(mockUser);

      const result = await repository.findById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      typeOrmRepository.findOne!.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        passwordHash: 'hashed_password',
        name: 'New User',
      };
      const mockUser = createMockUser(userData);

      typeOrmRepository.create!.mockReturnValue(mockUser);
      typeOrmRepository.save!.mockResolvedValue(mockUser);

      const result = await repository.create(userData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(userData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
