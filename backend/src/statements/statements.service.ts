import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { Statement, StatementStatus } from './statement.entity';
import {
  StatementRepository,
  AvailableMonth,
  MonthlyData,
} from './statement.repository';
import {
  ExpenseRepository,
  CardBreakdown,
  CompletingInstallment,
} from '../expenses/expense.repository';
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

export interface RangeSummaryResponse {
  availableMonths: AvailableMonth[];
  rangeSummary: {
    startDate: string;
    endDate: string;
    totalArs: number;
    totalUsd: number;
    monthlyData: MonthlyData[];
  };
  cardBreakdown: CardBreakdown[];
}

export interface CompletingInstallmentsResult {
  installments: CompletingInstallment[];
  totalArs: number;
  totalUsd: number;
}

@Injectable()
export class StatementsService {
  constructor(
    private readonly statementRepository: StatementRepository,
    private readonly expenseRepository: ExpenseRepository,
    @InjectQueue('statement-processing')
    private statementQueue: Queue,
  ) {}

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

  async findPendingOrProcessing(userId: string): Promise<Statement[]> {
    return this.statementRepository.findPendingOrProcessing(userId);
  }

  async getSummaryByUserDateRange(
    userId: string,
    endYear: number,
    endMonth: number,
  ): Promise<RangeSummaryResponse> {
    const { startDate, endDate } = this.calculateDateRange(endYear, endMonth);

    // Get available months for the dropdown
    const availableMonths =
      await this.statementRepository.getAvailableMonths(userId);

    // Get monthly aggregates for the 12-month range
    const monthlyData =
      await this.statementRepository.getMonthlyAggregatesInDateRange(
        userId,
        startDate,
        endDate,
      );

    // Calculate totals
    const totalArs = monthlyData.reduce((sum, m) => sum + m.totalArs, 0);
    const totalUsd = monthlyData.reduce((sum, m) => sum + m.totalUsd, 0);

    // Get card breakdown for the range
    const cardBreakdown =
      await this.expenseRepository.getCardBreakdownByUserInDateRange(
        userId,
        startDate,
        endDate,
      );

    return {
      availableMonths,
      rangeSummary: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalArs,
        totalUsd,
        monthlyData,
      },
      cardBreakdown,
    };
  }

  async findAllByUserInDateRange(
    userId: string,
    endYear: number,
    endMonth: number,
  ): Promise<Statement[]> {
    const { startDate, endDate } = this.calculateDateRange(endYear, endMonth);
    return this.statementRepository.findAllByUserInDateRange(
      userId,
      startDate,
      endDate,
    );
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

  async getLatestCompletedStatementMonth(
    userId: string,
  ): Promise<AvailableMonth | null> {
    return this.statementRepository.findLatestCompletedStatementMonth(userId);
  }

  async getCompletingInstallments(
    userId: string,
    year: number,
    month: number,
  ): Promise<CompletingInstallmentsResult> {
    const installments =
      await this.expenseRepository.findCompletingInstallmentsByStatementMonth(
        userId,
        year,
        month,
      );

    const totalArs = installments.reduce(
      (sum, i) => sum + (i.amountArs || 0),
      0,
    );
    const totalUsd = installments.reduce(
      (sum, i) => sum + (i.amountUsd || 0),
      0,
    );

    return { installments, totalArs, totalUsd };
  }

  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private calculateDateRange(
    endYear: number,
    endMonth: number,
  ): { startDate: Date; endDate: Date } {
    // End date is the last day of the end month
    const endDate = new Date(endYear, endMonth, 0); // Day 0 of next month = last day of this month

    // Start date is 11 months before (12 months total including end month)
    let startMonth = endMonth - 11;
    let startYear = endYear;
    if (startMonth <= 0) {
      startMonth += 12;
      startYear -= 1;
    }
    const startDate = new Date(startYear, startMonth - 1, 1); // First day of start month

    return { startDate, endDate };
  }
}
