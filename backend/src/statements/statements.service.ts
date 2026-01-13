import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Statement, StatementStatus } from './statement.entity';
import { StatementRepository, MonthlyData } from './statement.repository';
import { ExpenseRepository, CardBreakdown } from '../expenses/expense.repository';
import * as fs from 'fs';
import * as path from 'path';

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

  async create(
    userId: string,
    file: Express.Multer.File,
  ): Promise<Statement> {
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

  async reprocess(id: string, userId: string): Promise<Statement> {
    const statement = await this.findOne(id, userId);

    // Reset status and add to queue
    statement.status = StatementStatus.PENDING;
    statement.errorMessage = null;
    await this.statementRepository.save(statement);

    await this.statementQueue.add('process', {
      statementId: statement.id,
    });

    return statement;
  }

  async delete(id: string, userId: string): Promise<void> {
    const statement = await this.findOne(id, userId);

    // Delete file
    if (fs.existsSync(statement.filePath)) {
      fs.unlinkSync(statement.filePath);
    }

    await this.statementRepository.remove(statement);
  }

  async updateStatus(
    id: string,
    status: StatementStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.statementRepository.update(id, {
      status,
      errorMessage: errorMessage || null,
    });
  }

  async updateParsedData(
    id: string,
    data: {
      totalArs?: number;
      totalUsd?: number;
      dueDate?: Date;
      statementDate?: Date;
    },
  ): Promise<void> {
    await this.statementRepository.update(id, data);
  }
}
