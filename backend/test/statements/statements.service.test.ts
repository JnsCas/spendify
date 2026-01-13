import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { StatementsService } from '../../src/statements/statements.service';
import { StatementRepository } from '../../src/statements/statement.repository';
import { ExpenseRepository } from '../../src/expenses/expense.repository';
import { StatementStatus } from '../../src/statements/statement.entity';
import { createMockQueue, MockQueue } from '../utils/mock-queue';
import { createMockStatement } from '../utils/factories';

jest.mock('fs');

describe('StatementsService', () => {
  let service: StatementsService;
  let statementRepository: jest.Mocked<StatementRepository>;
  let expenseRepository: jest.Mocked<ExpenseRepository>;
  let statementQueue: MockQueue;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const mockStatementRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      findOneWithRelations: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findAllByUserFiltered: jest.fn(),
      getAvailableYears: jest.fn(),
      getMonthlyAggregates: jest.fn(),
    };

    const mockExpenseRepository = {
      getCardBreakdownByUserAndYear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatementsService,
        {
          provide: StatementRepository,
          useValue: mockStatementRepository,
        },
        {
          provide: ExpenseRepository,
          useValue: mockExpenseRepository,
        },
        {
          provide: getQueueToken('statement-processing'),
          useValue: createMockQueue(),
        },
      ],
    }).compile();

    service = module.get<StatementsService>(StatementsService);
    statementRepository = module.get(StatementRepository);
    expenseRepository = module.get(ExpenseRepository);
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

      statementRepository.create.mockResolvedValue(mockStatement);

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
      statementRepository.create.mockResolvedValue(mockStatement);

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

      statementRepository.findAllByUser.mockResolvedValue(mockStatements);

      const result = await service.findAllByUser(mockUserId);

      expect(statementRepository.findAllByUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockStatements);
    });

    it('should return empty array if no statements found', async () => {
      statementRepository.findAllByUser.mockResolvedValue([]);

      const result = await service.findAllByUser(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a statement with relations', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      statementRepository.findOneWithRelations.mockResolvedValue(mockStatement);

      const result = await service.findOne(mockStatement.id, mockUserId);

      expect(statementRepository.findOneWithRelations).toHaveBeenCalledWith(
        mockStatement.id,
        mockUserId
      );
      expect(result).toEqual(mockStatement);
    });

    it('should throw NotFoundException if statement not found', async () => {
      statementRepository.findOneWithRelations.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', mockUserId)
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

      statementRepository.findOneWithRelations.mockResolvedValue(mockStatement);
      statementRepository.save.mockResolvedValue(mockStatement);

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
      statementRepository.findOneWithRelations.mockResolvedValue(mockStatement);

      await service.delete(mockStatement.id, mockUserId);

      expect(fs.existsSync).toHaveBeenCalledWith(mockStatement.filePath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockStatement.filePath);
      expect(statementRepository.remove).toHaveBeenCalledWith(mockStatement);
    });

    it('should delete statement even if file does not exist', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      statementRepository.findOneWithRelations.mockResolvedValue(mockStatement);

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
        errorMessage: null,
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
    it('should call repository with filters', async () => {
      const mockStatements = [createMockStatement()];
      statementRepository.findAllByUserFiltered.mockResolvedValue(mockStatements);

      const result = await service.findAllByUserFiltered(mockUserId, 2024, 3);

      expect(statementRepository.findAllByUserFiltered).toHaveBeenCalledWith(
        mockUserId,
        2024,
        3
      );
      expect(result).toEqual(mockStatements);
    });
  });

  describe('getSummaryByUser', () => {
    it('should return summary with available years and monthly data', async () => {
      statementRepository.getAvailableYears.mockResolvedValue([2024, 2023]);
      statementRepository.getMonthlyAggregates.mockResolvedValue([
        { month: 1, totalArs: 10000, totalUsd: 50, statementCount: 2 },
        { month: 2, totalArs: 15000, totalUsd: 75, statementCount: 1 },
      ]);
      expenseRepository.getCardBreakdownByUserAndYear.mockResolvedValue([
        { cardId: 'card-1', cardName: 'Visa', lastFourDigits: '1234', totalArs: 8000, totalUsd: 40 },
      ]);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(statementRepository.getAvailableYears).toHaveBeenCalledWith(mockUserId);
      expect(statementRepository.getMonthlyAggregates).toHaveBeenCalledWith(mockUserId, 2024);
      expect(expenseRepository.getCardBreakdownByUserAndYear).toHaveBeenCalledWith(mockUserId, 2024);

      expect(result.availableYears).toEqual([2024, 2023]);
      expect(result.yearSummary.year).toBe(2024);
      expect(result.yearSummary.totalArs).toBe(25000);
      expect(result.yearSummary.totalUsd).toBe(125);
      expect(result.yearSummary.monthlyData).toHaveLength(2);
      expect(result.cardBreakdown).toHaveLength(1);
    });

    it('should handle empty data', async () => {
      statementRepository.getAvailableYears.mockResolvedValue([]);
      statementRepository.getMonthlyAggregates.mockResolvedValue([]);
      expenseRepository.getCardBreakdownByUserAndYear.mockResolvedValue([]);

      const result = await service.getSummaryByUser(mockUserId, 2024);

      expect(result.availableYears).toEqual([]);
      expect(result.yearSummary.totalArs).toBe(0);
      expect(result.yearSummary.totalUsd).toBe(0);
      expect(result.yearSummary.monthlyData).toEqual([]);
      expect(result.cardBreakdown).toEqual([]);
    });
  });
});
