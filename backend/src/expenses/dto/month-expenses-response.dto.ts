export class MonthExpenseCardDto {
  id: string | null;
  customName: string | null;
  lastFourDigits: string | null;
}

export class MonthExpenseStatementDto {
  id: string;
  originalFilename: string;
}

export class MonthExpenseDto {
  id: string;
  description: string;
  amountArs: number | null;
  amountUsd: number | null;
  currentInstallment: number | null;
  totalInstallments: number | null;
  card: MonthExpenseCardDto | null;
  statement: MonthExpenseStatementDto;
}

export class MonthExpensesResponseDto {
  year: number;
  month: number;
  totalArs: number;
  totalUsd: number;
  statementCount: number;
  expenses: MonthExpenseDto[];
}
