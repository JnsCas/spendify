import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ParserService } from './parser.service';
import { PdfService } from './pdf.service';
import { AnthropicService } from './anthropic.service';
import { StatementProcessor } from './statement.processor';
import { ExpensesModule } from '../expenses/expenses.module';
import { CardsModule } from '../cards/cards.module';
import { Statement } from '../statements/statement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Statement]),
    BullModule.registerQueue({
      name: 'statement-processing',
    }),
    ExpensesModule,
    CardsModule,
  ],
  providers: [ParserService, PdfService, AnthropicService, StatementProcessor],
  exports: [ParserService],
})
export class ParserModule {}
