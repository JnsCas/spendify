import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { Statement, StatementStatus } from './statement.entity';
import { Expense } from '../expenses/expense.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface MonthlyData {
  month: number;
  totalArs: number;
  totalUsd: number;
  statementCount: number;
}

export interface CardBreakdown {
  cardId: string | null;
  cardName: string | null;
  lastFourDigits: string | null;
  totalArs: number;
  totalUsd: number;
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
    @InjectRepository(Statement)
    private statementsRepository: Repository<Statement>,
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
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
    const statement = this.statementsRepository.create({
      userId,
      uploadDate: new Date(),
      originalFilename: file.originalname,
      filePath,
      status: StatementStatus.PENDING,
    });

    const savedStatement = await this.statementsRepository.save(statement);

    // Add to processing queue
    await this.statementQueue.add('process', {
      statementId: savedStatement.id,
    });

    return savedStatement;
  }

  async findAllByUser(userId: string): Promise<Statement[]> {
    return this.statementsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUserFiltered(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Statement[]> {
    const query = this.statementsRepository
      .createQueryBuilder('statement')
      .where('statement.userId = :userId', { userId })
      .orderBy('statement.statementDate', 'DESC')
      .addOrderBy('statement.createdAt', 'DESC');

    if (year) {
      query.andWhere('EXTRACT(YEAR FROM statement.statementDate) = :year', {
        year,
      });
    }

    if (month) {
      query.andWhere('EXTRACT(MONTH FROM statement.statementDate) = :month', {
        month,
      });
    }

    return query.getMany();
  }

  async getSummaryByUser(
    userId: string,
    year: number,
  ): Promise<StatementSummaryResponse> {
    // Get available years (distinct years from statements)
    const yearsResult = await this.statementsRepository
      .createQueryBuilder('statement')
      .select('DISTINCT EXTRACT(YEAR FROM statement.statementDate)', 'year')
      .where('statement.userId = :userId', { userId })
      .andWhere('statement.statementDate IS NOT NULL')
      .orderBy('year', 'DESC')
      .getRawMany();

    const availableYears = yearsResult
      .map((r) => parseInt(r.year, 10))
      .filter((y) => !isNaN(y));

    // Get monthly aggregates for the requested year
    const monthlyResult = await this.statementsRepository
      .createQueryBuilder('statement')
      .select([
        'EXTRACT(MONTH FROM statement.statementDate) as month',
        'COALESCE(SUM(statement.totalArs), 0) as "totalArs"',
        'COALESCE(SUM(statement.totalUsd), 0) as "totalUsd"',
        'COUNT(*) as "statementCount"',
      ])
      .where('statement.userId = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM statement.statementDate) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM statement.statementDate)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const monthlyData: MonthlyData[] = monthlyResult.map((r) => ({
      month: parseInt(r.month, 10),
      totalArs: parseFloat(r.totalArs) || 0,
      totalUsd: parseFloat(r.totalUsd) || 0,
      statementCount: parseInt(r.statementCount, 10),
    }));

    // Calculate year totals
    const yearTotalArs = monthlyData.reduce((sum, m) => sum + m.totalArs, 0);
    const yearTotalUsd = monthlyData.reduce((sum, m) => sum + m.totalUsd, 0);

    // Get card breakdown from expenses for the year
    const cardResult = await this.expensesRepository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .leftJoin('e.card', 'c')
      .select([
        'e.cardId as "cardId"',
        'COALESCE(c.cardName, \'Unknown Card\') as "cardName"',
        'c.lastFourDigits as "lastFourDigits"',
        'COALESCE(SUM(e.amountArs), 0) as "totalArs"',
        'COALESCE(SUM(e.amountUsd), 0) as "totalUsd"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', { year })
      .groupBy('e.cardId')
      .addGroupBy('c.cardName')
      .addGroupBy('c.lastFourDigits')
      .orderBy('"totalArs"', 'DESC')
      .getRawMany();

    const cardBreakdown: CardBreakdown[] = cardResult.map((r) => ({
      cardId: r.cardId,
      cardName: r.cardName || null,
      lastFourDigits: r.lastFourDigits,
      totalArs: parseFloat(r.totalArs) || 0,
      totalUsd: parseFloat(r.totalUsd) || 0,
    }));

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
    const statement = await this.statementsRepository.findOne({
      where: { id, userId },
      relations: ['expenses', 'expenses.card'],
    });

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
    await this.statementsRepository.save(statement);

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

    await this.statementsRepository.remove(statement);
  }

  async updateStatus(
    id: string,
    status: StatementStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.statementsRepository.update(id, {
      status,
      errorMessage,
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
    await this.statementsRepository.update(id, data);
  }
}
