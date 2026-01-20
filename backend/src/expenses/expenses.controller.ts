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

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

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
}
