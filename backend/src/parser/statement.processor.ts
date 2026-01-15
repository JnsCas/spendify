import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
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
    private dataSource: DataSource,
  ) {}

  @Process('process')
  async handleProcess(job: Job<ProcessJobData>) {
    const { statementId } = job.data;
    this.logger.log(`Processing statement: ${statementId}`);

    let statement: Statement | null = null;

    try {
      // Update status to processing
      await this.statementsRepository.update(statementId, {
        status: StatementStatus.PROCESSING,
      });

      // Get statement
      statement = await this.statementsRepository.findOne({
        where: { id: statementId },
      });

      if (!statement) {
        throw new Error('Statement not found');
      }

      // Parse the PDF
      const parsed = await this.parserService.parseStatement(
        statement.filePath,
      );

      // Use transaction to ensure all expenses are committed before status update
      await this.dataSource.transaction(async (manager) => {
        // Create expenses
        for (const expense of parsed.expenses) {
          let cardId: string | undefined;

          // Find or create card if identifier provided
          if (expense.card_identifier) {
            const card = await this.cardsService.findOrCreateByIdentifier(
              statement!.userId,
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

        // Update statement with summary - only after all expenses are created
        await manager.update(Statement, statementId, {
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
      });

      // Delete PDF file after successful processing
      this.deleteFile(statement.filePath);

      this.logger.log(`Successfully processed statement: ${statementId}`);
    } catch (error) {
      this.logger.error(`Failed to process statement: ${error.message}`);

      // Delete PDF file on failure to avoid orphaned files
      if (statement?.filePath) {
        this.deleteFile(statement.filePath);
      }

      await this.statementsRepository.update(statementId, {
        status: StatementStatus.FAILED,
        errorMessage: error.message,
      });
    }
  }

  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted PDF file: ${filePath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete PDF file ${filePath}: ${error.message}`);
    }
  }
}
