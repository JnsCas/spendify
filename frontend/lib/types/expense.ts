export interface MonthExpenseCard {
  id: string | null
  customName: string | null
  lastFourDigits: string | null
}

export interface MonthExpenseStatement {
  id: string
  originalFilename: string
}

export interface MonthExpense {
  id: string
  description: string
  amountArs: number | null
  amountUsd: number | null
  currentInstallment: number | null
  totalInstallments: number | null
  card: MonthExpenseCard | null
  statement: MonthExpenseStatement
}

export interface MonthExpensesResponse {
  year: number
  month: number
  totalArs: number
  totalUsd: number
  statementCount: number
  expenses: MonthExpense[]
}
