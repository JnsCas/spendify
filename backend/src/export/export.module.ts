import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { StatementsModule } from '../statements/statements.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [StatementsModule, ExpensesModule],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
