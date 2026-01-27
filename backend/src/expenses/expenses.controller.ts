import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ExpensesService } from './expenses.service';
import { Expense } from './expense.entity';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  MonthExpensesResponseDto,
  MonthExpenseDto,
} from './dto/month-expenses-response.dto';
import {
  InstallmentsResponseDto,
  InstallmentsSummaryDto,
  InstallmentDetailDto,
  InstallmentCardDto,
} from './dto/installments-response.dto';
import {
  InstallmentDetail,
  InstallmentsSummary,
} from './expense.repository';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get('installments')
  async getInstallments(
    @CurrentUser() user: User,
  ): Promise<InstallmentsResponseDto> {
    const { summary, installments } = await this.expensesService.findInstallmentsWithSummary(user.id);

    return {
      summary: {
        activeCount: summary.activeCount,
        completingThisMonthArs: summary.completingThisMonthArs,
        totalRemainingUsd: summary.totalRemainingUsd,
        totalMonthlyPaymentArs: summary.totalMonthlyPaymentArs,
      },
      installments: installments.map((i) => this.mapToInstallmentDto(i)),
    };
  }

  @Get('by-month')
  async getByMonth(
    @CurrentUser() user: User,
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
  ): Promise<MonthExpensesResponseDto> {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);
    const expenses = await this.expensesService.findByUserAndMonth(
      user.id,
      year,
      month,
    );

    const expenseDtos: MonthExpenseDto[] = expenses.map((e) => ({
      id: e.id,
      description: e.description,
      amountArs: e.amountArs,
      amountUsd: e.amountUsd,
      currentInstallment: e.currentInstallment,
      totalInstallments: e.totalInstallments,
      card: e.cardId
        ? {
            id: e.cardId,
            customName: e.cardCustomName,
            lastFourDigits: e.cardLastFourDigits,
          }
        : null,
      statement: {
        id: e.statementId,
        originalFilename: e.statementFilename,
      },
    }));

    const statementIds = new Set(expenses.map((e) => e.statementId));

    return {
      year,
      month,
      totalArs: expenses.reduce((sum, e) => sum + (e.amountArs || 0), 0),
      totalUsd: expenses.reduce((sum, e) => sum + (e.amountUsd || 0), 0),
      statementCount: statementIds.size,
      expenses: expenseDtos,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Expense> {
    return this.expensesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExpenseDto,
  ): Promise<Expense> {
    const data = {
      ...updateDto,
      purchaseDate: updateDto.purchaseDate
        ? new Date(updateDto.purchaseDate)
        : undefined,
    };
    return this.expensesService.update(id, data);
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
