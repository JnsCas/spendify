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

export interface MonthExpense {
  id: string;
  description: string;
  amountArs: number | null;
  amountUsd: number | null;
  currentInstallment: number | null;
  totalInstallments: number | null;
  cardId: string | null;
  cardCustomName: string | null;
  cardLastFourDigits: string | null;
  statementId: string;
  statementFilename: string;
}

export interface InstallmentDetail {
  id: string;
  description: string;
  purchaseDate: Date | null;
  currentInstallment: number;
  totalInstallments: number;
  monthlyAmountArs: number | null;
  monthlyAmountUsd: number | null;
  remainingAmountArs: number | null;
  remainingAmountUsd: number | null;
  remainingMonths: number;
  cardId: string | null;
  customName: string | null;
  lastFourDigits: string | null;
  statementMonth: string;
  status: 'active' | 'completing';
}

export interface InstallmentsSummary {
  activeCount: number;
  completingThisMonthCount: number;
  totalRemainingArs: number;
  totalRemainingUsd: number;
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

  async findByUserAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthExpense[]> {
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
        'c.customName as "cardCustomName"',
        'c.lastFourDigits as "cardLastFourDigits"',
        's.id as "statementId"',
        's.originalFilename as "statementFilename"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('s.status = :status', { status: 'completed' })
      .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM s.statementDate) = :month', { month })
      .orderBy('e.createdAt', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      description: r.description,
      amountArs: r.amountArs ? parseFloat(r.amountArs) : null,
      amountUsd: r.amountUsd ? parseFloat(r.amountUsd) : null,
      currentInstallment: r.currentInstallment
        ? parseInt(r.currentInstallment, 10)
        : null,
      totalInstallments: r.totalInstallments
        ? parseInt(r.totalInstallments, 10)
        : null,
      cardId: r.cardId || null,
      cardCustomName: r.cardCustomName || null,
      cardLastFourDigits: r.cardLastFourDigits || null,
      statementId: r.statementId,
      statementFilename: r.statementFilename,
    }));
  }

  async findAllInstallmentsByUser(
    userId: string,
    status?: 'active' | 'completing',
  ): Promise<InstallmentDetail[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let query = this.repository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .leftJoin('e.card', 'c')
      .select([
        'e.id as "id"',
        'e.description as "description"',
        'e.purchaseDate as "purchaseDate"',
        'e.currentInstallment as "currentInstallment"',
        'e.totalInstallments as "totalInstallments"',
        'e.amountArs as "monthlyAmountArs"',
        'e.amountUsd as "monthlyAmountUsd"',
        'e.cardId as "cardId"',
        'c.customName as "customName"',
        'c.lastFourDigits as "lastFourDigits"',
        's.statementDate as "statementDate"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('s.status = :statementStatus', { statementStatus: 'completed' })
      .andWhere('e.totalInstallments > 1');

    if (status === 'active') {
      // Active: still has remaining payments
      query = query.andWhere('e.currentInstallment < e.totalInstallments');
    } else if (status === 'completing') {
      // Completing: final payment is this month
      query = query
        .andWhere('e.currentInstallment = e.totalInstallments')
        .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', {
          year: currentYear,
        })
        .andWhere('EXTRACT(MONTH FROM s.statementDate) = :month', {
          month: currentMonth,
        });
    } else {
      // All: show active + completing (exclude old completed ones)
      query = query.andWhere(
        '(e.currentInstallment < e.totalInstallments OR ' +
          '(e.currentInstallment = e.totalInstallments AND ' +
          'EXTRACT(YEAR FROM s.statementDate) = :year AND ' +
          'EXTRACT(MONTH FROM s.statementDate) = :month))',
        { year: currentYear, month: currentMonth },
      );
    }

    query = query.orderBy('e.createdAt', 'DESC');

    const result = await query.getRawMany();

    return result.map((r) => {
      const currentInstallment = parseInt(r.currentInstallment, 10);
      const totalInstallments = parseInt(r.totalInstallments, 10);
      const remainingMonths = totalInstallments - currentInstallment;
      const monthlyAmountArs = r.monthlyAmountArs
        ? parseFloat(r.monthlyAmountArs)
        : null;
      const monthlyAmountUsd = r.monthlyAmountUsd
        ? parseFloat(r.monthlyAmountUsd)
        : null;

      const statementDate = new Date(r.statementDate);
      const statementYear = statementDate.getFullYear();
      const statementMonth = statementDate.getMonth() + 1;

      let installmentStatus: 'active' | 'completing';
      if (currentInstallment < totalInstallments) {
        installmentStatus = 'active';
      } else {
        installmentStatus = 'completing';
      }

      return {
        id: r.id,
        description: r.description,
        purchaseDate: r.purchaseDate ? new Date(r.purchaseDate) : null,
        currentInstallment,
        totalInstallments,
        monthlyAmountArs,
        monthlyAmountUsd,
        remainingAmountArs: monthlyAmountArs
          ? monthlyAmountArs * remainingMonths
          : null,
        remainingAmountUsd: monthlyAmountUsd
          ? monthlyAmountUsd * remainingMonths
          : null,
        remainingMonths,
        cardId: r.cardId || null,
        customName: r.customName || null,
        lastFourDigits: r.lastFourDigits || null,
        statementMonth: `${statementYear}-${String(statementMonth).padStart(2, '0')}`,
        status: installmentStatus,
      };
    });
  }

  async getInstallmentsSummary(userId: string): Promise<InstallmentsSummary> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const activeResult = await this.repository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .select([
        'COUNT(e.id) as "count"',
        'COALESCE(SUM(e.amountArs * (e.totalInstallments - e.currentInstallment)), 0) as "totalRemainingArs"',
        'COALESCE(SUM(e.amountUsd * (e.totalInstallments - e.currentInstallment)), 0) as "totalRemainingUsd"',
      ])
      .where('s.userId = :userId', { userId })
      .andWhere('s.status = :status', { status: 'completed' })
      .andWhere('e.totalInstallments > 1')
      .andWhere('e.currentInstallment < e.totalInstallments')
      .getRawOne();

    const completingResult = await this.repository
      .createQueryBuilder('e')
      .leftJoin('e.statement', 's')
      .select('COUNT(e.id) as "count"')
      .where('s.userId = :userId', { userId })
      .andWhere('s.status = :status', { status: 'completed' })
      .andWhere('e.totalInstallments > 1')
      .andWhere('e.currentInstallment = e.totalInstallments')
      .andWhere('EXTRACT(YEAR FROM s.statementDate) = :year', {
        year: currentYear,
      })
      .andWhere('EXTRACT(MONTH FROM s.statementDate) = :month', {
        month: currentMonth,
      })
      .getRawOne();

    return {
      activeCount: parseInt(activeResult?.count || '0', 10),
      completingThisMonthCount: parseInt(completingResult?.count || '0', 10),
      totalRemainingArs: parseFloat(activeResult?.totalRemainingArs || '0'),
      totalRemainingUsd: parseFloat(activeResult?.totalRemainingUsd || '0'),
    };
  }
}
