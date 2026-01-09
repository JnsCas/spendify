import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './expense.entity';

export interface CreateExpenseDto {
  statementId: string;
  cardId?: string;
  description: string;
  amountArs?: number;
  amountUsd?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  purchaseDate?: Date;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  async create(data: CreateExpenseDto): Promise<Expense> {
    const expense = this.expensesRepository.create(data);
    return this.expensesRepository.save(expense);
  }

  async createMany(expenses: CreateExpenseDto[]): Promise<Expense[]> {
    const entities = expenses.map((e) => this.expensesRepository.create(e));
    return this.expensesRepository.save(entities);
  }

  async findByStatement(statementId: string): Promise<Expense[]> {
    return this.expensesRepository.find({
      where: { statementId },
      relations: ['card'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findOne({
      where: { id },
      relations: ['card'],
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async update(id: string, data: Partial<CreateExpenseDto>): Promise<Expense> {
    await this.expensesRepository.update(id, data);
    return this.findOne(id);
  }

  async deleteByStatement(statementId: string): Promise<void> {
    await this.expensesRepository.delete({ statementId });
  }
}
