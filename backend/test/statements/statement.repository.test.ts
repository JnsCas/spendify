import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatementRepository } from '../../src/statements/statement.repository';
import { Statement, StatementStatus } from '../../src/statements/statement.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockStatement } from '../utils/factories';

describe('StatementRepository', () => {
  let repository: StatementRepository;
  let typeOrmRepository: MockRepository<Statement>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  const createMockQueryBuilder = (result: any) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
      getRawMany: jest.fn().mockResolvedValue(result),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatementRepository,
        {
          provide: getRepositoryToken(Statement),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    repository = module.get<StatementRepository>(StatementRepository);
    typeOrmRepository = module.get(getRepositoryToken(Statement));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a statement', async () => {
      const statementData = {
        userId: mockUserId,
        uploadDate: new Date(),
        originalFilename: 'test.pdf',
        filePath: '/uploads/test.pdf',
        status: StatementStatus.PENDING,
      };
      const mockStatement = createMockStatement(statementData);

      typeOrmRepository.create!.mockReturnValue(mockStatement);
      typeOrmRepository.save!.mockResolvedValue(mockStatement);

      const result = await repository.create(statementData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(statementData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockStatement);
      expect(result).toEqual(mockStatement);
    });
  });

  describe('save', () => {
    it('should save a statement', async () => {
      const mockStatement = createMockStatement();
      typeOrmRepository.save!.mockResolvedValue(mockStatement);

      const result = await repository.save(mockStatement);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockStatement);
      expect(result).toEqual(mockStatement);
    });
  });

  describe('findAllByUser', () => {
    it('should find all statements for a user', async () => {
      const mockStatements = [createMockStatement({ userId: mockUserId })];
      typeOrmRepository.find!.mockResolvedValue(mockStatements);

      const result = await repository.findAllByUser(mockUserId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockStatements);
    });
  });

  describe('findOne', () => {
    it('should find a statement by id and userId', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });
      typeOrmRepository.findOne!.mockResolvedValue(mockStatement);

      const result = await repository.findOne(mockStatement.id, mockUserId);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockStatement.id, userId: mockUserId },
      });
      expect(result).toEqual(mockStatement);
    });
  });

  describe('findOneWithRelations', () => {
    it('should find a statement with relations', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });
      typeOrmRepository.findOne!.mockResolvedValue(mockStatement);

      const result = await repository.findOneWithRelations(mockStatement.id, mockUserId);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockStatement.id, userId: mockUserId },
        relations: ['expenses', 'expenses.card'],
      });
      expect(result).toEqual(mockStatement);
    });
  });

  describe('update', () => {
    it('should update a statement', async () => {
      const statementId = 'statement-id';
      const updateData = { status: StatementStatus.COMPLETED };

      await repository.update(statementId, updateData);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(statementId, updateData);
    });
  });

  describe('remove', () => {
    it('should remove a statement', async () => {
      const mockStatement = createMockStatement();
      typeOrmRepository.remove!.mockResolvedValue(mockStatement);

      await repository.remove(mockStatement);

      expect(typeOrmRepository.remove).toHaveBeenCalledWith(mockStatement);
    });
  });

  describe('findAllByUserFiltered', () => {
    it('should filter by year and month', async () => {
      const mockStatements = [createMockStatement()];
      const qb = createMockQueryBuilder(mockStatements);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.findAllByUserFiltered(mockUserId, 2024, 3);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('statement');
      expect(qb.where).toHaveBeenCalledWith('statement.userId = :userId', { userId: mockUserId });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM statement.statementDate) = :year',
        { year: 2024 }
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM statement.statementDate) = :month',
        { month: 3 }
      );
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockStatements);
    });

    it('should not filter when no year/month provided', async () => {
      const qb = createMockQueryBuilder([]);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      await repository.findAllByUserFiltered(mockUserId);

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableYears', () => {
    it('should return available years sorted descending', async () => {
      const mockResult = [{ year: '2024' }, { year: '2023' }, { year: '2022' }];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getAvailableYears(mockUserId);

      expect(result).toEqual([2024, 2023, 2022]);
    });

    it('should filter out invalid years', async () => {
      const mockResult = [{ year: '2024' }, { year: null }, { year: 'invalid' }];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getAvailableYears(mockUserId);

      expect(result).toEqual([2024]);
    });
  });

  describe('getMonthlyAggregates', () => {
    it('should return monthly aggregates', async () => {
      const mockResult = [
        { month: '1', totalArs: '10000.00', totalUsd: '50.00', statementCount: '2' },
        { month: '2', totalArs: '15000.00', totalUsd: '75.00', statementCount: '1' },
      ];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getMonthlyAggregates(mockUserId, 2024);

      expect(result).toEqual([
        { month: 1, totalArs: 10000, totalUsd: 50, statementCount: 2 },
        { month: 2, totalArs: 15000, totalUsd: 75, statementCount: 1 },
      ]);
    });

    it('should handle zero values', async () => {
      const mockResult = [
        { month: '1', totalArs: '0', totalUsd: null, statementCount: '0' },
      ];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getMonthlyAggregates(mockUserId, 2024);

      expect(result[0].totalArs).toBe(0);
      expect(result[0].totalUsd).toBe(0);
      expect(result[0].statementCount).toBe(0);
    });
  });
});
