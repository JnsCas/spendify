import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { Statement, StatementStatus } from './statement.entity';
import { StatementRepository, MonthlyData } from './statement.repository';
import { ExpenseRepository, CardBreakdown } from '../expenses/expense.repository';
import * as fs from 'fs';
import * as path from 'path';

export interface DuplicateFile {
  originalFilename: string;
  existingStatementId: string;
  existingFilename: string;
}

export interface BulkUploadResult {
  statements: Statement[];
  duplicates: DuplicateFile[];
}

export interface StatementSummaryResponse {
  availableYears: number[];
  yearSummary: {
    year: number;
    totalArs: number;
    totalUsd: number;
    monthlyData: MonthlyData[];
  };
  cardBreakdown: CardBreakdown[];
}

@Injectable()
export class StatementsService {
  constructor(
    private readonly statementRepository: StatementRepository,
    private readonly expenseRepository: ExpenseRepository,
    @InjectQueue('statement-processing')
    private statementQueue: Queue,
  ) {}

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async create(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Statement> {
    // Calculate file hash
    const fileHash = this.calculateFileHash(file.buffer);

    // Create upload directory
    const uploadDir = path.join('uploads', userId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Create statement record
    const savedStatement = await this.statementRepository.create({
      userId,
      uploadDate: new Date(),
      originalFilename: file.originalname,
      filePath,
      status: StatementStatus.PENDING,
      fileHash,
    });

    // Add to processing queue
    await this.statementQueue.add('process', {
      statementId: savedStatement.id,
    });

    return savedStatement;
  }

  async findAllByUser(userId: string): Promise<Statement[]> {
    return this.statementRepository.findAllByUser(userId);
  }

  async findAllByUserFiltered(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Statement[]> {
    return this.statementRepository.findAllByUserFiltered(userId, year, month);
  }

  async findPendingOrProcessing(userId: string): Promise<Statement[]> {
    return this.statementRepository.findPendingOrProcessing(userId);
  }

  async getSummaryByUser(
    userId: string,
    year: number,
  ): Promise<StatementSummaryResponse> {
    // Get available years (distinct years from statements)
    const availableYears = await this.statementRepository.getAvailableYears(userId);

    // Get monthly aggregates for the requested year
    const monthlyData = await this.statementRepository.getMonthlyAggregates(userId, year);

    // Calculate year totals
    const yearTotalArs = monthlyData.reduce((sum, m) => sum + m.totalArs, 0);
    const yearTotalUsd = monthlyData.reduce((sum, m) => sum + m.totalUsd, 0);

    // Get card breakdown from expenses for the year
    const cardBreakdown = await this.expenseRepository.getCardBreakdownByUserAndYear(userId, year);

    return {
      availableYears,
      yearSummary: {
        year,
        totalArs: yearTotalArs,
        totalUsd: yearTotalUsd,
        monthlyData,
      },
      cardBreakdown,
    };
  }

  async findOne(id: string, userId: string): Promise<Statement> {
    const statement = await this.statementRepository.findOneWithRelations(id, userId);

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return statement;
  }

  async delete(id: string, userId: string): Promise<void> {
    const statement = await this.findOne(id, userId);
    await this.statementRepository.remove(statement);
  }

  async createBulk(
    userId: string,
    files: Express.Multer.File[],
  ): Promise<BulkUploadResult> {
    const uploadDir = path.join('uploads', userId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const statements: Statement[] = [];
    const duplicates: DuplicateFile[] = [];

    for (const file of files) {
      // Calculate file hash
      const fileHash = this.calculateFileHash(file.buffer);

      // Check for existing statement with same hash
      const existingStatement = await this.statementRepository.findByFileHash(
        fileHash,
        userId,
      );

      if (existingStatement) {
        duplicates.push({
          originalFilename: file.originalname,
          existingStatementId: existingStatement.id,
          existingFilename: existingStatement.originalFilename,
        });
        continue;
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, file.buffer);

      const savedStatement = await this.statementRepository.create({
        userId,
        uploadDate: new Date(),
        originalFilename: file.originalname,
        filePath,
        status: StatementStatus.PENDING,
        fileHash,
      });

      await this.statementQueue.add('process', {
        statementId: savedStatement.id,
      });

      statements.push(savedStatement);
    }

    return {
      statements,
      duplicates,
    };
  }

  async findByIds(ids: string[], userId: string): Promise<Statement[]> {
    return this.statementRepository.findManyByIds(ids, userId);
  }

  async hasAnyByUser(userId: string): Promise<boolean> {
    return this.statementRepository.hasAnyByUser(userId);
  }
}
