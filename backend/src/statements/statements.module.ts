import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Statement } from './statement.entity';
import { Expense } from '../expenses/expense.entity';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { ParserModule } from '../parser/parser.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statement, Expense]),
    BullModule.registerQueue({
      name: 'statement-processing',
    }),
    ParserModule,
  ],
  controllers: [StatementsController],
  providers: [StatementsService],
  exports: [StatementsService],
})
export class StatementsModule {}
