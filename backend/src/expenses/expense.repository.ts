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
  completingThisMonthArs: number;
  totalRemainingUsd: number;
  totalMonthlyPaymentArs: number;
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

  async findAllInstallmentsByUser(userId: string): Promise<InstallmentDetail[]> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Use raw query with DISTINCT ON to get only the latest installment per series
    // A series is identified by: description + total_installments + card_id
    const result = await this.repository.query(
      `
      SELECT DISTINCT ON (e.description, e.total_installments, e.card_id)
        e.id as "id",
        e.description as "description",
        e.purchase_date as "purchaseDate",
        e.current_installment as "currentInstallment",
        e.total_installments as "totalInstallments",
        e.amount_ars as "monthlyAmountArs",
        e.amount_usd as "monthlyAmountUsd",
        e.card_id as "cardId",
        c.custom_name as "customName",
        c.last_four_digits as "lastFourDigits",
        s.statement_date as "statementDate"
      FROM expenses e
      LEFT JOIN statements s ON e.statement_id = s.id
      LEFT JOIN cards c ON e.card_id = c.id
      WHERE s.user_id = $1
        AND s.status = 'completed'
        AND e.total_installments > 1
      ORDER BY e.description, e.total_installments, e.card_id, e.current_installment DESC, s.statement_date DESC
      `,
      [userId],
    );

    return result.map((r: any) => {
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

      // Determine status based on current state
      // Active: has remaining payments, Completing: on final payment
      const installmentStatus: 'active' | 'completing' =
        currentInstallment < totalInstallments ? 'active' : 'completing';

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

    // Use a subquery to get deduplicated installments, then aggregate
    const result = await this.repository.query(
      `
      WITH deduplicated AS (
        SELECT DISTINCT ON (e.description, e.total_installments, e.card_id)
          e.current_installment,
          e.total_installments,
          e.amount_ars,
          e.amount_usd,
          s.statement_date
        FROM expenses e
        LEFT JOIN statements s ON e.statement_id = s.id
        WHERE s.user_id = $1
          AND s.status = 'completed'
          AND e.total_installments > 1
        ORDER BY e.description, e.total_installments, e.card_id, e.current_installment DESC, s.statement_date DESC
      )
      SELECT
        COUNT(*) FILTER (WHERE current_installment < total_installments) as "activeCount",
        COALESCE(SUM(
          CASE WHEN current_installment = total_installments
          AND EXTRACT(YEAR FROM statement_date) = $2
          AND EXTRACT(MONTH FROM statement_date) = $3
          THEN amount_ars
          ELSE 0 END
        ), 0) as "completingArs",
        COALESCE(SUM(
          CASE WHEN current_installment < total_installments
          THEN amount_usd * (total_installments - current_installment)
          ELSE 0 END
        ), 0) as "totalRemainingUsd",
        COALESCE(SUM(
          CASE WHEN current_installment < total_installments
          THEN amount_ars
          ELSE 0 END
        ), 0) as "totalMonthlyPaymentArs"
      FROM deduplicated
      `,
      [userId, currentYear, currentMonth],
    );

    const row = result[0] || {};

    return {
      activeCount: parseInt(row.activeCount || '0', 10),
      completingThisMonthArs: parseFloat(row.completingArs || '0'),
      totalRemainingUsd: parseFloat(row.totalRemainingUsd || '0'),
      totalMonthlyPaymentArs: parseFloat(row.totalMonthlyPaymentArs || '0'),
    };
  }
}
