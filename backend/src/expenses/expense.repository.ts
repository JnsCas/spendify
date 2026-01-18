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

  async getCardBreakdownByUserAndYear(
    userId: string,
    year: number,
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
      .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', { year })
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
}
