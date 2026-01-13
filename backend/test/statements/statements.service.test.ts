import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { StatementsService } from '../../src/statements/statements.service';
import { Statement, StatementStatus } from '../../src/statements/statement.entity';
import { Expense } from '../../src/expenses/expense.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockQueue, MockQueue } from '../utils/mock-queue';
import { createMockStatement } from '../utils/factories';

jest.mock('fs');

describe('StatementsService', () => {
  let service: StatementsService;
  let statementRepository: MockRepository<Statement>;
  let expenseRepository: MockRepository<Expense>;
  let statementQueue: MockQueue;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  // Helper to create a chainable query builder mock
  const createMockQueryBuilder = (result: any) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
      getRawMany: jest.fn().mockResolvedValue(result),
    };
    return qb;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatementsService,
        {
          provide: getRepositoryToken(Statement),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Expense),
          useValue: createMockRepository(),
        },
        {
          provide: getQueueToken('statement-processing'),
          useValue: createMockQueue(),
        },
      ],
    }).compile();

    service = module.get<StatementsService>(StatementsService);
    statementRepository = module.get(getRepositoryToken(Statement));
    expenseRepository = module.get(getRepositoryToken(Expense));
    statementQueue = module.get(getQueueToken('statement-processing'));

    // Mock fs methods - default to false for existsSync so mkdir gets called
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation();
    (fs.writeFileSync as jest.Mock).mockImplementation();
    (fs.unlinkSync as jest.Mock).mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a statement and queue it for processing', async () => {
      const mockFile = {
        originalname: 'test-statement.pdf',
        buffer: Buffer.from('test pdf content'),
      } as Express.Multer.File;

      const mockStatement = createMockStatement({ userId: mockUserId });

      statementRepository.create!.mockReturnValue(mockStatement);
      statementRepository.save!.mockResolvedValue(mockStatement);

      const result = await service.create(mockUserId, mockFile);

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(statementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          originalFilename: mockFile.originalname,
          status: StatementStatus.PENDING,
        })
      );
      expect(statementRepository.save).toHaveBeenCalledWith(mockStatement);
      expect(statementQueue.add).toHaveBeenCalledWith('process', {
        statementId: mockStatement.id,
      });
      expect(result).toEqual(mockStatement);
    });

    it('should create upload directory if it does not exist', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('content'),
      } as Express.Multer.File;

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const mockStatement = createMockStatement();
      statementRepository.create!.mockReturnValue(mockStatement);
      statementRepository.save!.mockResolvedValue(mockStatement);

      await service.create(mockUserId, mockFile);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(mockUserId),
        { recursive: true }
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return all statements for a user', async () => {
      const mockStatements = [
        createMockStatement({ userId: mockUserId }),
        createMockStatement({ userId: mockUserId, id: 'another-id' }),
      ];

      statementRepository.find!.mockResolvedValue(mockStatements);

      const result = await service.findAllByUser(mockUserId);

      expect(statementRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockStatements);
    });

    it('should return empty array if no statements found', async () => {
      statementRepository.find!.mockResolvedValue([]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a statement with relations', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      statementRepository.findOne!.mockResolvedValue(mockStatement);

      const result = await service.findOne(mockStatement.id, mockUserId);

      expect(statementRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockStatement.id, userId: mockUserId },
        relations: ['expenses', 'expenses.card'],
      });
      expect(result).toEqual(mockStatement);
    });

    it('should throw NotFoundException if statement not found', async () => {
      statementRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if statement belongs to different user', async () => {
      statementRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.findOne('statement-id', 'different-user-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reprocess', () => {
    it('should reset statement status and re-queue for processing', async () => {
      const mockStatement = createMockStatement({
        userId: mockUserId,
        status: StatementStatus.FAILED,
        errorMessage: 'Previous error',
      });

      statementRepository.findOne!.mockResolvedValue(mockStatement);
      statementRepository.save!.mockResolvedValue(mockStatement);

      const result = await service.reprocess(mockStatement.id, mockUserId);

      expect(result.status).toBe(StatementStatus.PENDING);
      expect(result.errorMessage).toBeNull();
      expect(statementRepository.save).toHaveBeenCalled();
      expect(statementQueue.add).toHaveBeenCalledWith('process', {
        statementId: mockStatement.id,
      });
    });
  });

  describe('delete', () => {
    it('should delete statement and remove file', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      // For delete test, the file should exist
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      statementRepository.findOne!.mockResolvedValue(mockStatement);
      statementRepository.remove!.mockResolvedValue(mockStatement);

      await service.delete(mockStatement.id, mockUserId);

      expect(fs.existsSync).toHaveBeenCalledWith(mockStatement.filePath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockStatement.filePath);
      expect(statementRepository.remove).toHaveBeenCalledWith(mockStatement);
    });

    it('should delete statement even if file does not exist', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      statementRepository.findOne!.mockResolvedValue(mockStatement);
      statementRepository.remove!.mockResolvedValue(mockStatement);

      await service.delete(mockStatement.id, mockUserId);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(statementRepository.remove).toHaveBeenCalledWith(mockStatement);
    });
  });

  describe('updateStatus', () => {
    it('should update statement status', async () => {
      const statementId = 'test-id';
      const newStatus = StatementStatus.COMPLETED;

      await service.updateStatus(statementId, newStatus);

      expect(statementRepository.update).toHaveBeenCalledWith(statementId, {
        status: newStatus,
        errorMessage: undefined,
      });
    });

    it('should update statement status with error message', async () => {
      const statementId = 'test-id';
      const newStatus = StatementStatus.FAILED;
      const errorMessage = 'Processing failed';

      await service.updateStatus(statementId, newStatus, errorMessage);

      expect(statementRepository.update).toHaveBeenCalledWith(statementId, {
        status: newStatus,
        errorMessage,
      });
    });
  });

  describe('updateParsedData', () => {
    it('should update statement parsed data', async () => {
      const statementId = 'test-id';
      const data = {
        totalArs: 10000,
        totalUsd: 50,
        dueDate: new Date('2024-02-01'),
        statementDate: new Date('2024-01-15'),
      };

      await service.updateParsedData(statementId, data);

      expect(statementRepository.update).toHaveBeenCalledWith(statementId, data);
    });
  });

  describe('findAllByUserFiltered', () => {
    it('should return all statements when no filters provided', async () => {
      const mockStatements = [
        createMockStatement({ userId: mockUserId, statementDate: new Date('2024-01-15') }),
        createMockStatement({ userId: mockUserId, id: 'another-id', statementDate: new Date('2024-02-15') }),
      ];

      const qb = createMockQueryBuilder(mockStatements);
      statementRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await service.findAllByUserFiltered(mockUserId);

      expect(statementRepository.createQueryBuilder).toHaveBeenCalledWith('statement');
      expect(qb.where).toHaveBeenCalledWith('statement.userId = :userId', { userId: mockUserId });
      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(qb.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockStatements);
    });

    it('should filter by year only', async () => {
      const mockStatements = [
        createMockStatement({ userId: mockUserId, statementDate: new Date('2024-03-15') }),
      ];

      const qb = createMockQueryBuilder(mockStatements);
      statementRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await service.findAllByUserFiltered(mockUserId, 2024);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM statement.statementDate) = :year',
        { year: 2024 }
      );
      expect(result).toEqual(mockStatements);
    });

    it('should filter by year and month', async () => {
      const mockStatements = [
        createMockStatement({ userId: mockUserId, statementDate: new Date('2024-03-15') }),
      ];

      const qb = createMockQueryBuilder(mockStatements);
      statementRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await service.findAllByUserFiltered(mockUserId, 2024, 3);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'EXTRACT(YEAR FROM statement.statementDate) = :year',
        { year: 2024 }
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'EXTRACT(MONTH FROM statement.statementDate) = :month',
        { month: 3 }
      );
      expect(result).toEqual(mockStatements);
    });

    it('should return empty array when no matches', async () => {
      const qb = createMockQueryBuilder([]);
      statementRepository.createQueryBuilder!.mockReturnValue(qb);

      const result = await service.findAllByUserFiltered(mockUserId, 2020, 1);

      expect(result).toEqual([]);
    });
  });

  describe('getSummaryByUser', () => {
    it('should return available years sorted descending', async () => {
      const yearsQb = createMockQueryBuilder([
        { year: '2024' },
        { year: '2023' },
        { year: '2022' },
      ]);
      const monthlyQb = createMockQueryBuilder([]);
      const cardQb = createMockQueryBuilder([]);

      statementRepository.createQueryBuilder!
        .mockReturnValueOnce(yearsQb)
        .mockReturnValueOnce(monthlyQb);
      expenseRepository.createQueryBuilder!.mockReturnValue(cardQb);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.availableYears).toEqual([2024, 2023, 2022]);
    });

    it('should aggregate monthly totals correctly', async () => {
      const yearsQb = createMockQueryBuilder([{ year: '2024' }]);
      const monthlyQb = createMockQueryBuilder([
        { month: '1', totalArs: '10000.00', totalUsd: '50.00', statementCount: '2' },
        { month: '2', totalArs: '15000.00', totalUsd: '75.00', statementCount: '1' },
        { month: '3', totalArs: '5000.00', totalUsd: '25.00', statementCount: '1' },
      ]);
      const cardQb = createMockQueryBuilder([]);

      statementRepository.createQueryBuilder!
        .mockReturnValueOnce(yearsQb)
        .mockReturnValueOnce(monthlyQb);
      expenseRepository.createQueryBuilder!.mockReturnValue(cardQb);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.yearSummary.year).toBe(2024);
      expect(result.yearSummary.totalArs).toBe(30000);
      expect(result.yearSummary.totalUsd).toBe(150);
      expect(result.yearSummary.monthlyData).toHaveLength(3);
      expect(result.yearSummary.monthlyData[0]).toEqual({
        month: 1,
        totalArs: 10000,
        totalUsd: 50,
        statementCount: 2,
      });
    });

    it('should return card breakdown with correct totals', async () => {
      const yearsQb = createMockQueryBuilder([{ year: '2024' }]);
      const monthlyQb = createMockQueryBuilder([]);
      const cardQb = createMockQueryBuilder([
        {
          cardId: 'card-1',
          cardName: 'Visa',
          lastFourDigits: '1234',
          totalArs: '8000.00',
          totalUsd: '40.00',
        },
        {
          cardId: 'card-2',
          cardName: 'Mastercard',
          lastFourDigits: '5678',
          totalArs: '2000.00',
          totalUsd: '10.00',
        },
      ]);

      statementRepository.createQueryBuilder!
        .mockReturnValueOnce(yearsQb)
        .mockReturnValueOnce(monthlyQb);
      expenseRepository.createQueryBuilder!.mockReturnValue(cardQb);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.cardBreakdown).toHaveLength(2);
      expect(result.cardBreakdown[0]).toEqual({
        cardId: 'card-1',
        cardName: 'Visa',
        lastFourDigits: '1234',
        totalArs: 8000,
        totalUsd: 40,
      });
    });

    it('should handle statements with null statementDate', async () => {
      const yearsQb = createMockQueryBuilder([]);
      const monthlyQb = createMockQueryBuilder([]);
      const cardQb = createMockQueryBuilder([]);

      statementRepository.createQueryBuilder!
        .mockReturnValueOnce(yearsQb)
        .mockReturnValueOnce(monthlyQb);
      expenseRepository.createQueryBuilder!.mockReturnValue(cardQb);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.availableYears).toEqual([]);
      expect(result.yearSummary.monthlyData).toEqual([]);
      expect(result.yearSummary.totalArs).toBe(0);
      expect(result.yearSummary.totalUsd).toBe(0);
    });

    it('should handle unknown cards', async () => {
      const yearsQb = createMockQueryBuilder([{ year: '2024' }]);
      const monthlyQb = createMockQueryBuilder([]);
      const cardQb = createMockQueryBuilder([
        {
          cardId: null,
          cardName: 'Unknown Card',
          lastFourDigits: null,
          totalArs: '1000.00',
          totalUsd: '5.00',
        },
      ]);

      statementRepository.createQueryBuilder!
        .mockReturnValueOnce(yearsQb)
        .mockReturnValueOnce(monthlyQb);
      expenseRepository.createQueryBuilder!.mockReturnValue(cardQb);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.cardBreakdown[0].cardName).toBe('Unknown Card');
    });
  });
});
