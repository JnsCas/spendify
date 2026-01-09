import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { ExportService } from './export.service';
import { StatementsService } from '../statements/statements.service';

@Controller('statements')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    private exportService: ExportService,
    private statementsService: StatementsService,
  ) {}

  @Get(':id/export/csv')
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
}
