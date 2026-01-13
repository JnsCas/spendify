import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Statement } from './statement.entity';
import { StatementRepository } from './statement.repository';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { ParserModule } from '../parser/parser.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statement]),
    BullModule.registerQueue({
      name: 'statement-processing',
    }),
    ParserModule,
    ExpensesModule,
  ],
  controllers: [StatementsController],
  providers: [StatementRepository, StatementsService],
  exports: [StatementsService],
})
export class StatementsModule {}
