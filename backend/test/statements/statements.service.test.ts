import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { StatementsService } from '../../src/statements/statements.service';
import { Statement, StatementStatus } from '../../src/statements/statement.entity';
import { createMockRepository, MockRepository } from '../utils/mock-repository';
import { createMockQueue, MockQueue } from '../utils/mock-queue';
import { createMockStatement } from '../utils/factories';

jest.mock('fs');

describe('StatementsService', () => {
  let service: StatementsService;
  let statementRepository: MockRepository<Statement>;
  let statementQueue: MockQueue;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatementsService,
        {
          provide: getRepositoryToken(Statement),
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
});
