import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Statement, StatementStatus } from './statement.entity';

export interface CreateStatementData {
  userId: string;
  uploadDate: Date;
  originalFilename: string;
  filePath: string;
  status: StatementStatus;
  fileHash?: string;
}

export interface MonthlyData {
  month: number;
  year: number;
  totalArs: number;
  totalUsd: number;
  statementCount: number;
}

export interface AvailableMonth {
  year: number;
  month: number;
}

@Injectable()
export class StatementRepository {
  constructor(
    @InjectRepository(Statement)
    private readonly repository: Repository<Statement>,
  ) {}

  async create(data: CreateStatementData): Promise<Statement> {
    const statement = this.repository.create(data);
    return this.repository.save(statement);
  }

  async save(statement: Statement): Promise<Statement> {
    return this.repository.save(statement);
  }

  async findAllByUser(userId: string): Promise<Statement[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Statement | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async findOneWithRelations(id: string, userId: string): Promise<Statement | null> {
    return this.repository.findOne({
      where: { id, userId },
      relations: ['expenses', 'expenses.card'],
    });
  }

  async remove(statement: Statement): Promise<void> {
    await this.repository.remove(statement);
  }

  async getAvailableMonths(userId: string): Promise<AvailableMonth[]> {
    const result = await this.repository
      .createQueryBuilder('statement')
      .select([
        'EXTRACT(YEAR FROM statement.statementDate) as year',
        'EXTRACT(MONTH FROM statement.statementDate) as month',
      ])
      .distinct(true)
      .where('statement.userId = :userId', { userId })
      .andWhere('statement.statementDate IS NOT NULL')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .getRawMany();

    return result
      .map((r) => ({
        year: parseInt(r.year, 10),
        month: parseInt(r.month, 10),
      }))
      .filter((m) => !isNaN(m.year) && !isNaN(m.month));
  }

  async findAllByUserInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Statement[]> {
    return this.repository
      .createQueryBuilder('statement')
      .where('statement.userId = :userId', { userId })
      .andWhere('statement.statementDate >= :startDate', { startDate })
      .andWhere('statement.statementDate <= :endDate', { endDate })
      .orderBy('statement.statementDate', 'DESC')
      .addOrderBy('statement.createdAt', 'DESC')
      .getMany();
  }

  async getMonthlyAggregatesInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MonthlyData[]> {
    const result = await this.repository
      .createQueryBuilder('statement')
      .select([
        'EXTRACT(YEAR FROM statement.statementDate) as year',
        'EXTRACT(MONTH FROM statement.statementDate) as month',
        'COALESCE(SUM(statement.totalArs), 0) as "totalArs"',
        'COALESCE(SUM(statement.totalUsd), 0) as "totalUsd"',
        'COUNT(*) as "statementCount"',
      ])
      .where('statement.userId = :userId', { userId })
      .andWhere('statement.statementDate >= :startDate', { startDate })
      .andWhere('statement.statementDate <= :endDate', { endDate })
      .groupBy('EXTRACT(YEAR FROM statement.statementDate)')
      .addGroupBy('EXTRACT(MONTH FROM statement.statementDate)')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      year: parseInt(r.year, 10),
      month: parseInt(r.month, 10),
      totalArs: parseFloat(r.totalArs) || 0,
      totalUsd: parseFloat(r.totalUsd) || 0,
      statementCount: parseInt(r.statementCount, 10),
    }));
  }

  async findManyByIds(ids: string[], userId: string): Promise<Statement[]> {
    if (ids.length === 0) {
      return [];
    }

    // Filter out invalid UUIDs to prevent DB errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = ids.filter((id) => uuidRegex.test(id));

    if (validIds.length === 0) {
      return [];
    }

    return this.repository.find({
      where: {
        id: In(validIds),
        userId,
      },
      select: ['id', 'status', 'errorMessage'],
    });
  }

  async hasAnyByUser(userId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { userId } });
    return count > 0;
  }

  async findByFileHash(fileHash: string, userId: string): Promise<Statement | null> {
    return this.repository.findOne({
      where: { fileHash, userId },
      select: ['id', 'originalFilename', 'status', 'statementDate'],
    });
  }

  async findPendingOrProcessing(userId: string): Promise<Statement[]> {
    return this.repository.find({
      where: {
        userId,
        status: In(['pending', 'processing'] as StatementStatus[]),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
