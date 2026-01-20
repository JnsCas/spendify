import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';

export interface CreateExpenseData {
  statementId: string;
  cardId?: string;
  description: string;
  amountArs?: number;
  amountUsd?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  purchaseDate?: Date;
}

export interface CardBreakdown {
  cardId: string | null;
  customName: string | null;
  lastFourDigits: string | null;
  totalArs: number;
  totalUsd: number;
}

export interface CompletingInstallment {
  id: string;
  description: string;
  amountArs: number | null;
  amountUsd: number | null;
  currentInstallment: number;
  totalInstallments: number;
  cardId: string | null;
  customName: string | null;
  lastFourDigits: string | null;
}

@Injectable()
export class ExpenseRepository {
  constructor(
    @InjectRepository(Expense)
    private readonly repository: Repository<Expense>,
  ) {}

  async create(data: CreateExpenseData): Promise<Expense> {
    const expense = this.repository.create(data);
    return this.repository.save(expense);
  }

  async createMany(expenses: CreateExpenseData[]): Promise<Expense[]> {
    const entities = expenses.map((e) => this.repository.create(e));
    return this.repository.save(entities);
  }

  async findByStatement(statementId: string): Promise<Expense[]> {
    return this.repository.find({
      where: { statementId },
      relations: ['card'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Expense | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['card'],
    });
  }

  async update(id: string, data: Partial<CreateExpenseData>): Promise<void> {
    await this.repository.update(id, data);
  }

  async deleteByStatement(statementId: string): Promise<void> {
    await this.repository.delete({ statementId });
  }

  async getCardBreakdownByUserInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CardBreakdown[]> {
    const result = await this.repository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .leftJoin('e.card', 'c')
      .select([
        'e.cardId as "cardId"',
        'c.customName as "customName"',
        'c.lastFourDigits as "lastFourDigits"',
        'COALESCE(SUM(e.amountArs), 0) as "totalArs"',
        'COALESCE(SUM(e.amountUsd), 0) as "totalUsd"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('s.statementDate >= :startDate', { startDate })
      .andWhere('s.statementDate <= :endDate', { endDate })
      .groupBy('e.cardId')
      .addGroupBy('c.customName')
      .addGroupBy('c.lastFourDigits')
      .orderBy('"totalArs"', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      cardId: r.cardId,
      customName: r.customName || null,
      lastFourDigits: r.lastFourDigits,
      totalArs: parseFloat(r.totalArs) || 0,
      totalUsd: parseFloat(r.totalUsd) || 0,
    }));
  }

  async findCompletingInstallmentsByStatementMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<CompletingInstallment[]> {
    const result = await this.repository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .leftJoin('e.card', 'c')
      .select([
        'e.id as "id"',
        'e.description as "description"',
        'e.amountArs as "amountArs"',
        'e.amountUsd as "amountUsd"',
        'e.currentInstallment as "currentInstallment"',
        'e.totalInstallments as "totalInstallments"',
        'e.cardId as "cardId"',
        'c.customName as "customName"',
        'c.lastFourDigits as "lastFourDigits"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('s.status = :status', { status: 'completed' })
      .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM s.statementDate) = :month', { month })
      .andWhere('e.currentInstallment = e.totalInstallments')
      .andWhere('e.totalInstallments > 1')
      .orderBy('e.amountArs', 'DESC', 'NULLS LAST')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      description: r.description,
      amountArs: r.amountArs ? parseFloat(r.amountArs) : null,
      amountUsd: r.amountUsd ? parseFloat(r.amountUsd) : null,
      currentInstallment: parseInt(r.currentInstallment, 10),
      totalInstallments: parseInt(r.totalInstallments, 10),
      cardId: r.cardId || null,
      customName: r.customName || null,
      lastFourDigits: r.lastFourDigits || null,
    }));
  }
}
