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
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      findOneWithRelations: jest.fn(),
      remove: jest.fn(),
      getAvailableMonths: jest.fn(),
      findAllByUserInDateRange: jest.fn(),
      getMonthlyAggregatesInDateRange: jest.fn(),
      findManyByIds: jest.fn(),
      hasAnyByUser: jest.fn(),
      findByFileHash: jest.fn(),
      findPendingOrProcessing: jest.fn(),
    };

    const mockExpenseRepository = {
      getCardBreakdownByUserInDateRange: jest.fn(),
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

  describe('delete', () => {
    it('should delete statement from database', async () => {
      const mockStatement = createMockStatement({ userId: mockUserId });

      statementRepository.findOneWithRelations.mockResolvedValue(mockStatement);

      await service.delete(mockStatement.id, mockUserId);

      expect(statementRepository.remove).toHaveBeenCalledWith(mockStatement);
    });
  });

  describe('getSummaryByUserDateRange', () => {
    it('should return summary with available months and monthly data', async () => {
      statementRepository.getAvailableMonths.mockResolvedValue([
        { year: 2024, month: 3 },
        { year: 2024, month: 2 },
        { year: 2024, month: 1 },
      ]);
      statementRepository.getMonthlyAggregatesInDateRange.mockResolvedValue([
        { year: 2024, month: 1, totalArs: 10000, totalUsd: 50, statementCount: 2 },
        { year: 2024, month: 2, totalArs: 15000, totalUsd: 75, statementCount: 1 },
      ]);
      expenseRepository.getCardBreakdownByUserInDateRange.mockResolvedValue([
        { cardId: 'card-1', customName: 'Visa', lastFourDigits: '1234', totalArs: 8000, totalUsd: 40 },
      ]);

      const result = await service.getSummaryByUserDateRange(mockUserId, 2024, 3);

      expect(statementRepository.getAvailableMonths).toHaveBeenCalledWith(mockUserId);
      expect(statementRepository.getMonthlyAggregatesInDateRange).toHaveBeenCalled();
      expect(expenseRepository.getCardBreakdownByUserInDateRange).toHaveBeenCalled();

      expect(result.availableMonths).toHaveLength(3);
      expect(result.rangeSummary.totalArs).toBe(25000);
      expect(result.rangeSummary.totalUsd).toBe(125);
      expect(result.rangeSummary.monthlyData).toHaveLength(2);
      expect(result.cardBreakdown).toHaveLength(1);
    });

    it('should handle empty data', async () => {
      statementRepository.getAvailableMonths.mockResolvedValue([]);
      statementRepository.getMonthlyAggregatesInDateRange.mockResolvedValue([]);
      expenseRepository.getCardBreakdownByUserInDateRange.mockResolvedValue([]);

      const result = await service.getSummaryByUserDateRange(mockUserId, 2024, 1);

      expect(result.availableMonths).toEqual([]);
      expect(result.rangeSummary.totalArs).toBe(0);
      expect(result.rangeSummary.totalUsd).toBe(0);
      expect(result.rangeSummary.monthlyData).toEqual([]);
      expect(result.cardBreakdown).toEqual([]);
    });
  });

  describe('findAllByUserInDateRange', () => {
    it('should call repository with date range', async () => {
      const mockStatements = [createMockStatement()];
      statementRepository.findAllByUserInDateRange.mockResolvedValue(mockStatements);

      const result = await service.findAllByUserInDateRange(mockUserId, 2024, 3);

      expect(statementRepository.findAllByUserInDateRange).toHaveBeenCalled();
      expect(result).toEqual(mockStatements);
    });
  });

  describe('createBulk', () => {
    it('should create multiple statements and queue all for processing', async () => {
      const mockFiles = [
        { originalname: 'statement1.pdf', buffer: Buffer.from('content1') },
        { originalname: 'statement2.pdf', buffer: Buffer.from('content2') },
        { originalname: 'statement3.pdf', buffer: Buffer.from('content3') },
      ] as Express.Multer.File[];

      const mockStatements = mockFiles.map((file, index) =>
        createMockStatement({
          id: `statement-${index}`,
          userId: mockUserId,
          originalFilename: file.originalname,
        })
      );

      // No duplicates
      statementRepository.findByFileHash.mockResolvedValue(null);
      mockStatements.forEach((_, index) => {
        statementRepository.create.mockResolvedValueOnce(mockStatements[index]);
      });

      const result = await service.createBulk(mockUserId, mockFiles);

      expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
      expect(statementRepository.create).toHaveBeenCalledTimes(3);
      expect(statementQueue.add).toHaveBeenCalledTimes(3);
      expect(result.statements).toHaveLength(3);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should create upload directory once for multiple files', async () => {
      const mockFiles = [
        { originalname: 'file1.pdf', buffer: Buffer.from('1') },
        { originalname: 'file2.pdf', buffer: Buffer.from('2') },
      ] as Express.Multer.File[];

      // No duplicates
      statementRepository.findByFileHash.mockResolvedValue(null);
      mockFiles.forEach(() => {
        statementRepository.create.mockResolvedValueOnce(
          createMockStatement({ userId: mockUserId })
        );
      });

      await service.createBulk(mockUserId, mockFiles);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.mkdirSync).toHaveBeenCalledTimes(1);
    });

    it('should return Statement entities in result', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockStatement = createMockStatement({
        id: 'test-id',
        userId: mockUserId,
        originalFilename: 'test.pdf',
        status: StatementStatus.PENDING,
      });

      // No duplicates
      statementRepository.findByFileHash.mockResolvedValue(null);
      statementRepository.create.mockResolvedValue(mockStatement);

      const result = await service.createBulk(mockUserId, [mockFile]);

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0]).toEqual(mockStatement);
      expect(result.duplicates).toEqual([]);
    });

    it('should detect duplicate files and skip them', async () => {
      const mockFiles = [
        { originalname: 'statement1.pdf', buffer: Buffer.from('content1') },
        { originalname: 'statement2.pdf', buffer: Buffer.from('content2') },
      ] as Express.Multer.File[];

      const existingStatement = createMockStatement({
        id: 'existing-id',
        userId: mockUserId,
        originalFilename: 'existing.pdf',
      });

      const newStatement = createMockStatement({
        id: 'new-id',
        userId: mockUserId,
        originalFilename: 'statement2.pdf',
      });

      // First file is a duplicate, second is new
      statementRepository.findByFileHash
        .mockResolvedValueOnce(existingStatement)
        .mockResolvedValueOnce(null);
      statementRepository.create.mockResolvedValue(newStatement);

      const result = await service.createBulk(mockUserId, mockFiles);

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0]).toEqual(newStatement);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0]).toEqual({
        originalFilename: 'statement1.pdf',
        existingStatementId: 'existing-id',
        existingFilename: 'existing.pdf',
      });
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(statementQueue.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByIds', () => {
    it('should return statements for multiple IDs', async () => {
      const ids = ['id-1', 'id-2', 'id-3'];
      const mockStatements = [
        createMockStatement({ id: 'id-1', status: StatementStatus.COMPLETED }),
        createMockStatement({ id: 'id-2', status: StatementStatus.PROCESSING }),
        createMockStatement({ id: 'id-3', status: StatementStatus.FAILED, errorMessage: 'Parse error' }),
      ];

      statementRepository.findManyByIds.mockResolvedValue(mockStatements);

      const result = await service.findByIds(ids, mockUserId);

      expect(statementRepository.findManyByIds).toHaveBeenCalledWith(ids, mockUserId);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('id-1');
      expect(result[0].status).toBe(StatementStatus.COMPLETED);
      expect(result[2].id).toBe('id-3');
      expect(result[2].status).toBe(StatementStatus.FAILED);
      expect(result[2].errorMessage).toBe('Parse error');
    });

    it('should return empty array for no matching IDs', async () => {
      statementRepository.findManyByIds.mockResolvedValue([]);

      const result = await service.findByIds(['nonexistent'], mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('hasAnyByUser', () => {
    it('should return true when user has statements', async () => {
      statementRepository.hasAnyByUser.mockResolvedValue(true);

      const result = await service.hasAnyByUser(mockUserId);

      expect(statementRepository.hasAnyByUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toBe(true);
    });

    it('should return false when user has no statements', async () => {
      statementRepository.hasAnyByUser.mockResolvedValue(false);

      const result = await service.hasAnyByUser(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('findPendingOrProcessing', () => {
    it('should return pending and processing statements', async () => {
      const mockStatements = [
        createMockStatement({
          id: 'pending-1',
          userId: mockUserId,
          status: StatementStatus.PENDING,
        }),
        createMockStatement({
          id: 'processing-1',
          userId: mockUserId,
          status: StatementStatus.PROCESSING,
        }),
      ];

      statementRepository.findPendingOrProcessing.mockResolvedValue(mockStatements);

      const result = await service.findPendingOrProcessing(mockUserId);

      expect(statementRepository.findPendingOrProcessing).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockStatements);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no pending or processing statements', async () => {
      statementRepository.findPendingOrProcessing.mockResolvedValue([]);

      const result = await service.findPendingOrProcessing(mockUserId);

      expect(statementRepository.findPendingOrProcessing).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([]);
    });
  });
});
