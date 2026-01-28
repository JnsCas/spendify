import { Injectable, NotFoundException } from '@nestjs/common';
import { Expense } from './expense.entity';
import {
  ExpenseRepository,
  MonthExpense,
  InstallmentDetail,
  InstallmentsSummary,
} from './expense.repository';

export interface CreateExpenseDto {
  statementId: string;
  cardId?: string;
  description: string;
  amountArs?: number;
  amountUsd?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  purchaseDate?: Date;
}

export interface InstallmentsWithSummary {
  summary: InstallmentsSummary;
  installments: InstallmentDetail[];
}

@Injectable()
export class ExpensesService {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async create(data: CreateExpenseDto): Promise<Expense> {
    return this.expenseRepository.create(data);
  }

  async createMany(expenses: CreateExpenseDto[]): Promise<Expense[]> {
    return this.expenseRepository.createMany(expenses);
  }

  async findByStatement(statementId: string): Promise<Expense[]> {
    return this.expenseRepository.findByStatement(statementId);
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne(id);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, data: Partial<CreateExpenseDto>): Promise<Expense> {
    await this.expenseRepository.update(id, data);
    return this.findOne(id);
  }

  async deleteByStatement(statementId: string): Promise<void> {
    return this.expenseRepository.deleteByStatement(statementId);
  }

  async findByUserAndMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthExpense[]> {
    return this.expenseRepository.findByUserAndMonth(userId, year, month);
  }

  async findInstallmentsWithSummary(userId: string): Promise<InstallmentsWithSummary> {
    const [installments, summary] = await Promise.all([
      this.expenseRepository.findAllInstallmentEntriesByUser(userId),
      this.expenseRepository.getInstallmentsSummary(userId),
    ]);

    return {
      summary,
      installments,
    };
  }
}
