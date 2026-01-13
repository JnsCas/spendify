import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statement, StatementStatus } from './statement.entity';

export interface CreateStatementData {
  userId: string;
  uploadDate: Date;
  originalFilename: string;
  filePath: string;
  status: StatementStatus;
}

export interface MonthlyData {
  month: number;
  totalArs: number;
  totalUsd: number;
  statementCount: number;
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

  async update(
    id: string,
    data: Partial<{
      status: StatementStatus;
      errorMessage: string | null;
      totalArs: number;
      totalUsd: number;
      dueDate: Date;
      statementDate: Date;
    }>,
  ): Promise<void> {
    await this.repository.update(id, data);
  }

  async remove(statement: Statement): Promise<void> {
    await this.repository.remove(statement);
  }

  async findAllByUserFiltered(
    userId: string,
    year?: number,
    month?: number,
  ): Promise<Statement[]> {
    const query = this.repository
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

  async getAvailableYears(userId: string): Promise<number[]> {
    const result = await this.repository
      .createQueryBuilder('statement')
      .select('DISTINCT EXTRACT(YEAR FROM statement.statementDate)', 'year')
      .where('statement.userId = :userId', { userId })
      .andWhere('statement.statementDate IS NOT NULL')
      .orderBy('year', 'DESC')
      .getRawMany();

    return result
      .map((r) => parseInt(r.year, 10))
      .filter((y) => !isNaN(y));
  }

  async getMonthlyAggregates(userId: string, year: number): Promise<MonthlyData[]> {
    const result = await this.repository
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

    return result.map((r) => ({
      month: parseInt(r.month, 10),
      totalArs: parseFloat(r.totalArs) || 0,
      totalUsd: parseFloat(r.totalUsd) || 0,
      statementCount: parseInt(r.statementCount, 10),
    }));
  }
}
