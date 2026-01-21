import { Injectable, NotFoundException } from '@nestjs/common';
import { Expense } from './expense.entity';
import {
  ExpenseRepository,
  CreateExpenseData,
  MonthExpense,
  InstallmentDetail,
  InstallmentsSummary,
} from './expense.repository';
import {
  InstallmentsResponseDto,
  InstallmentsSummaryDto,
  InstallmentDetailDto,
  InstallmentCardDto,
} from './dto/installments-response.dto';

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

  async getInstallmentsByUser(userId: string): Promise<InstallmentsResponseDto> {
    const [installments, summary] = await Promise.all([
      this.expenseRepository.findAllInstallmentsByUser(userId),
      this.expenseRepository.getInstallmentsSummary(userId),
    ]);

    return {
      summary: this.mapToSummaryDto(summary),
      installments: installments.map((i) => this.mapToInstallmentDto(i)),
    };
  }

  private mapToSummaryDto(summary: InstallmentsSummary): InstallmentsSummaryDto {
    return {
      activeCount: summary.activeCount,
      completingThisMonthCount: summary.completingThisMonthCount,
      totalRemainingArs: summary.totalRemainingArs,
      totalRemainingUsd: summary.totalRemainingUsd,
    };
  }

  private mapToInstallmentDto(
    installment: InstallmentDetail,
  ): InstallmentDetailDto {
    const card: InstallmentCardDto | null = installment.cardId
      ? {
          id: installment.cardId,
          customName: installment.customName,
          lastFourDigits: installment.lastFourDigits,
        }
      : null;

    return {
      id: installment.id,
      description: installment.description,
      purchaseDate: installment.purchaseDate,
      currentInstallment: installment.currentInstallment,
      totalInstallments: installment.totalInstallments,
      monthlyAmountArs: installment.monthlyAmountArs,
      monthlyAmountUsd: installment.monthlyAmountUsd,
      remainingAmountArs: installment.remainingAmountArs,
      remainingAmountUsd: installment.remainingAmountUsd,
      remainingMonths: installment.remainingMonths,
      card,
      statementMonth: installment.statementMonth,
      status: installment.status,
    };
  }
}
