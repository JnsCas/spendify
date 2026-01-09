import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statement, StatementStatus } from '../statements/statement.entity';
import { ParserService } from './parser.service';
import { ExpensesService } from '../expenses/expenses.service';
import { CardsService } from '../cards/cards.service';

interface ProcessJobData {
  statementId: string;
}

@Processor('statement-processing')
export class StatementProcessor {
  private readonly logger = new Logger(StatementProcessor.name);

  constructor(
    @InjectRepository(Statement)
    private statementsRepository: Repository<Statement>,
    private parserService: ParserService,
    private expensesService: ExpensesService,
    private cardsService: CardsService,
  ) {}

  @Process('process')
  async handleProcess(job: Job<ProcessJobData>) {
    const { statementId } = job.data;
    this.logger.log(`Processing statement: ${statementId}`);

    try {
      // Update status to processing
      await this.statementsRepository.update(statementId, {
        status: StatementStatus.PROCESSING,
      });

      // Get statement
      const statement = await this.statementsRepository.findOne({
        where: { id: statementId },
      });

      if (!statement) {
        throw new Error('Statement not found');
      }

      // Parse the PDF
      const parsed = await this.parserService.parseStatement(
        statement.filePath,
      );

      // Delete existing expenses (for reprocessing)
      await this.expensesService.deleteByStatement(statementId);

      // Create expenses
      for (const expense of parsed.expenses) {
        let cardId: string | undefined;

        // Find or create card if identifier provided
        if (expense.card_identifier) {
          const card = await this.cardsService.findOrCreateByIdentifier(
            statement.userId,
            expense.card_identifier,
          );
          cardId = card.id;
        }

        await this.expensesService.create({
          statementId,
          cardId,
          description: expense.description,
          amountArs: expense.amount_ars ?? undefined,
          amountUsd: expense.amount_usd ?? undefined,
          currentInstallment: expense.current_installment ?? undefined,
          totalInstallments: expense.total_installments ?? undefined,
          purchaseDate: expense.purchase_date
            ? new Date(expense.purchase_date)
            : undefined,
        });
      }

      // Update statement with summary
      await this.statementsRepository.update(statementId, {
        status: StatementStatus.COMPLETED,
        totalArs: parsed.summary.total_ars ?? undefined,
        totalUsd: parsed.summary.total_usd ?? undefined,
        dueDate: parsed.summary.due_date
          ? new Date(parsed.summary.due_date)
          : undefined,
        statementDate: parsed.summary.statement_date
          ? new Date(parsed.summary.statement_date)
          : undefined,
      });

      this.logger.log(`Successfully processed statement: ${statementId}`);
    } catch (error) {
      this.logger.error(`Failed to process statement: ${error.message}`);

      await this.statementsRepository.update(statementId, {
        status: StatementStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }
}
