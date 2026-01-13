import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseRepository } from '../../src/expenses/expense.repository';
import { Expense } from '../../src/expenses/expense.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockExpense } from '../utils/factories';

describe('ExpenseRepository', () => {
  let repository: ExpenseRepository;
  let typeOrmRepository: MockRepository<Expense>;

  const mockStatementId = '123e4567-e89b-12d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  const createMockQueryBuilder = (result: any) => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(result),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpenseRepository,
        {
          provide: getRepositoryToken(Expense),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    repository = module.get<ExpenseRepository>(ExpenseRepository);
    typeOrmRepository = module.get(getRepositoryToken(Expense));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save an expense', async () => {
      const expenseData = {
        statementId: mockStatementId,
        description: 'Test Expense',
        amountArs: 1000,
      };
      const mockExpense = createMockExpense(expenseData);

      typeOrmRepository.create!.mockReturnValue(mockExpense);
      typeOrmRepository.save!.mockResolvedValue(mockExpense);

      const result = await repository.create(expenseData);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(expenseData);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockExpense);
      expect(result).toEqual(mockExpense);
    });
  });

  describe('createMany', () => {
    it('should create and save multiple expenses', async () => {
      const expensesData = [
        { statementId: mockStatementId, description: 'Expense 1', amountArs: 100 },
        { statementId: mockStatementId, description: 'Expense 2', amountArs: 200 },
      ];
      const mockExpenses = expensesData.map((data) => createMockExpense(data));

      typeOrmRepository.create!.mockImplementation((data) =>
        createMockExpense(data)
      );
      typeOrmRepository.save!.mockResolvedValue(mockExpenses);

      const result = await repository.createMany(expensesData);

      expect(typeOrmRepository.create).toHaveBeenCalledTimes(2);
      expect(typeOrmRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockExpenses);
    });
  });

  describe('findByStatement', () => {
    it('should find all expenses for a statement', async () => {
      const mockExpenses = [createMockExpense({ statementId: mockStatementId })];
      typeOrmRepository.find!.mockResolvedValue(mockExpenses);

      const result = await repository.findByStatement(mockStatementId);

      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { statementId: mockStatementId },
        relations: ['card'],
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockExpenses);
    });
  });

  describe('findOne', () => {
    it('should find an expense by id', async () => {
      const mockExpense = createMockExpense();
      typeOrmRepository.findOne!.mockResolvedValue(mockExpense);

      const result = await repository.findOne(mockExpense.id);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockExpense.id },
        relations: ['card'],
      });
      expect(result).toEqual(mockExpense);
    });

    it('should return null if not found', async () => {
      typeOrmRepository.findOne!.mockResolvedValue(null);

      const result = await repository.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an expense', async () => {
      const expenseId = 'expense-id';
      const updateData = { description: 'Updated' };

      await repository.update(expenseId, updateData);

      expect(typeOrmRepository.update).toHaveBeenCalledWith(expenseId, updateData);
    });
  });

  describe('deleteByStatement', () => {
    it('should delete all expenses for a statement', async () => {
      await repository.deleteByStatement(mockStatementId);

      expect(typeOrmRepository.delete).toHaveBeenCalledWith({
        statementId: mockStatementId,
      });
    });
  });

  describe('getCardBreakdownByUserAndYear', () => {
    it('should return card breakdown with totals', async () => {
      const mockResult = [
        {
          cardId: 'card-1',
          cardName: 'Visa',
          lastFourDigits: '1234',
          totalArs: '8000.00',
          totalUsd: '40.00',
        },
      ];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getCardBreakdownByUserAndYear(mockUserId, 2024);

      expect(typeOrmRepository.createQueryBuilder).toHaveBeenCalledWith('e');
      expect(qb.leftJoin).toHaveBeenCalledWith('e.statement', 's');
      expect(qb.leftJoin).toHaveBeenCalledWith('e.card', 'c');
      expect(qb.where).toHaveBeenCalledWith('s.userId = :userId', { userId: mockUserId });
      expect(qb.andWhere).toHaveBeenCalledWith('EXTRACT(YEAR FROM s.statementDate) = :year', { year: 2024 });
      expect(result).toEqual([
        {
          cardId: 'card-1',
          cardName: 'Visa',
          lastFourDigits: '1234',
          totalArs: 8000,
          totalUsd: 40,
        },
      ]);
    });

    it('should handle null values', async () => {
      const mockResult = [
        {
          cardId: null,
          cardName: 'Unknown Card',
          lastFourDigits: null,
          totalArs: '1000.00',
          totalUsd: null,
        },
      ];
      const qb = createMockQueryBuilder(mockResult);
      typeOrmRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await repository.getCardBreakdownByUserAndYear(mockUserId, 2024);

      expect(result[0].cardId).toBeNull();
      expect(result[0].cardName).toBe('Unknown Card');
      expect(result[0].totalUsd).toBe(0);
    });
  });
});
