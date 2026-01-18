import { User } from '../../src/users/user.entity';
import { Statement, StatementStatus } from '../../src/statements/statement.entity';
import { Expense } from '../../src/expenses/expense.entity';
import { Card } from '../../src/cards/card.entity';
import { InviteCode, InviteCodeStatus } from '../../src/invite-codes/invite-code.entity';

/**
 * Factory functions to create test data
 */

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = overrides.id || '123e4567-e89b-12d3-a456-426614174000';
  user.email = overrides.email || 'test@example.com';
  user.name = overrides.name || 'Test User';
  user.passwordHash = overrides.passwordHash || '$2a$10$hashedpassword';
  user.createdAt = overrides.createdAt || new Date('2024-01-01');
  user.updatedAt = overrides.updatedAt || new Date('2024-01-01');
  return user;
};

export const createMockStatement = (overrides: Partial<Statement> = {}): Statement => {
  const statement = new Statement();
  statement.id = overrides.id || '123e4567-e89b-12d3-a456-426614174001';
  statement.userId = overrides.userId || '123e4567-e89b-12d3-a456-426614174000';
  statement.originalFilename = overrides.originalFilename || 'test-statement.pdf';
  statement.filePath = overrides.filePath || '/uploads/test/test-statement.pdf';
  statement.status = overrides.status || StatementStatus.COMPLETED;
  statement.uploadDate = overrides.uploadDate || new Date('2024-01-01');
  statement.statementDate = overrides.statementDate || new Date('2024-01-15');
  statement.dueDate = overrides.dueDate || new Date('2024-02-01');
  statement.totalArs = overrides.totalArs || 10000.00;
  statement.totalUsd = overrides.totalUsd || 50.00;
  statement.errorMessage = overrides.errorMessage ?? null;
  statement.createdAt = overrides.createdAt || new Date('2024-01-01');
  statement.expenses = overrides.expenses || [];
  return statement;
};

export const createMockCard = (overrides: Partial<Card> = {}): Card => {
  const card = new Card();
  card.id = overrides.id || '123e4567-e89b-12d3-a456-426614174002';
  card.userId = overrides.userId || '123e4567-e89b-12d3-a456-426614174000';
  card.customName = overrides.customName || 'Visa';
  card.lastFourDigits = overrides.lastFourDigits || '1234';
  card.createdAt = overrides.createdAt || new Date('2024-01-01');
  return card;
};

export const createMockExpense = (overrides: Partial<Expense> = {}): Expense => {
  const expense = new Expense();
  expense.id = overrides.id || '123e4567-e89b-12d3-a456-426614174003';
  expense.statementId = overrides.statementId || '123e4567-e89b-12d3-a456-426614174001';
  expense.cardId = overrides.cardId || '123e4567-e89b-12d3-a456-426614174002';
  expense.purchaseDate = overrides.purchaseDate || new Date('2024-01-10');
  expense.description = overrides.description || 'Test Purchase';
  expense.amountArs = overrides.amountArs || 1000.00;
  expense.amountUsd = overrides.amountUsd || 5.00;
  if (overrides.currentInstallment !== undefined) {
    expense.currentInstallment = overrides.currentInstallment;
  }
  if (overrides.totalInstallments !== undefined) {
    expense.totalInstallments = overrides.totalInstallments;
  }
  expense.createdAt = overrides.createdAt || new Date('2024-01-01');
  return expense;
};

export const createMockInviteCode = (overrides: Partial<InviteCode> = {}): InviteCode => {
  const inviteCode = new InviteCode();
  inviteCode.id = overrides.id || '123e4567-e89b-12d3-a456-426614174004';
  inviteCode.code = overrides.code || 'TEST1234';
  inviteCode.status = overrides.status || InviteCodeStatus.AVAILABLE;
  inviteCode.usedById = overrides.usedById || null;
  inviteCode.usedBy = overrides.usedBy || null;
  inviteCode.usedAt = overrides.usedAt || null;
  inviteCode.createdAt = overrides.createdAt || new Date('2024-01-01');
  return inviteCode;
};
