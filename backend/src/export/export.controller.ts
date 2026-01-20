import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ExportService } from './export.service';
import { StatementsService } from '../statements/statements.service';
import { ExpensesService } from '../expenses/expenses.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    private exportService: ExportService,
    private statementsService: StatementsService,
    private expensesService: ExpensesService,
  ) {}

  @Get('statements/:id/export/csv')
  async exportCsv(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const statement = await this.statementsService.findOne(id, user.id);
    const csv = this.exportService.generateCsv(statement);

    const filename = `statement_${statement.statementDate?.toISOString().split('T')[0] || statement.id}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('expenses/export/by-month')
  async exportByMonth(
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    const expenses = await this.expensesService.findByUserAndMonth(
      user.id,
      year,
      month,
    );

    const totalArs = expenses.reduce((sum, e) => sum + (e.amountArs || 0), 0);
    const totalUsd = expenses.reduce((sum, e) => sum + (e.amountUsd || 0), 0);

    const csv = this.exportService.generateMonthCsv({
      year,
      month,
      totalArs,
      totalUsd,
      expenses,
    });

    const monthStr = month.toString().padStart(2, '0');
    const filename = `expenses_${year}_${monthStr}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
