import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InviteCodeRepository } from '../../src/invite-codes/invite-code.repository';
import { InviteCode, InviteCodeStatus } from '../../src/invite-codes/invite-code.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockInviteCode } from '../utils/factories';

describe('InviteCodeRepository', () => {
  let repository: InviteCodeRepository;
  let typeOrmRepository: MockRepository<InviteCode>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteCodeRepository,
        {
          provide: getRepositoryToken(InviteCode),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    repository = module.get<InviteCodeRepository>(InviteCodeRepository);
    typeOrmRepository = module.get(getRepositoryToken(InviteCode));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByCode', () => {
    it('should find an invite code by code', async () => {
      const mockInviteCode = createMockInviteCode({ code: 'TEST1234' });
      typeOrmRepository.findOne!.mockResolvedValue(mockInviteCode);

      const result = await repository.findByCode('TEST1234');

      expect(result).toEqual(mockInviteCode);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { code: 'TEST1234' },
      });
    });

    it('should return null if not found', async () => {
      typeOrmRepository.findOne!.mockResolvedValue(null);

      const result = await repository.findByCode('NONEXIST');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find an invite code by id', async () => {
      const mockInviteCode = createMockInviteCode();
      typeOrmRepository.findOne!.mockResolvedValue(mockInviteCode);

      const result = await repository.findById(mockInviteCode.id);

      expect(result).toEqual(mockInviteCode);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockInviteCode.id },
      });
    });
  });

  describe('findAllWithRelations', () => {
    it('should find all invite codes with relations', async () => {
      const mockInviteCodes = [createMockInviteCode()];
      typeOrmRepository.find!.mockResolvedValue(mockInviteCodes);

      const result = await repository.findAllWithRelations();

      expect(result).toEqual(mockInviteCodes);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        relations: ['usedBy'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create and save an invite code', async () => {
      const mockInviteCode = createMockInviteCode({ code: 'NEWCODE1' });
      typeOrmRepository.create!.mockReturnValue(mockInviteCode);
      typeOrmRepository.save!.mockResolvedValue(mockInviteCode);

      const result = await repository.create('NEWCODE1');

      expect(typeOrmRepository.create).toHaveBeenCalledWith({
        code: 'NEWCODE1',
        status: InviteCodeStatus.AVAILABLE,
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInviteCode);
      expect(result).toEqual(mockInviteCode);
    });
  });

  describe('save', () => {
    it('should save an invite code', async () => {
      const mockInviteCode = createMockInviteCode();
      typeOrmRepository.save!.mockResolvedValue(mockInviteCode);

      const result = await repository.save(mockInviteCode);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockInviteCode);
      expect(result).toEqual(mockInviteCode);
    });
  });

  describe('remove', () => {
    it('should remove an invite code', async () => {
      const mockInviteCode = createMockInviteCode();
      typeOrmRepository.remove!.mockResolvedValue(mockInviteCode);

      await repository.remove(mockInviteCode);

      expect(typeOrmRepository.remove).toHaveBeenCalledWith(mockInviteCode);
    });
  });
});
