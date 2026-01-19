export interface MonthlyData {
  month: number
  totalArs: number
  totalUsd: number
  statementCount: number
}

export interface CardBreakdown {
  cardId: string | null
  customName: string | null
  lastFourDigits: string | null
  totalArs: number
  totalUsd: number
}

export interface YearSummary {
  year: number
  totalArs: number
  totalUsd: number
  monthlyData: MonthlyData[]
}

export interface StatementSummaryResponse {
  availableYears: number[]
  yearSummary: YearSummary
  cardBreakdown: CardBreakdown[]
}

export interface Statement {
  id: string
  userId: string
  uploadDate: string
  statementDate: string | null
  dueDate: string | null
  totalArs: number | null
  totalUsd: number | null
  originalFilename: string
  filePath: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage: string | null
  createdAt: string
}

// Chart data types
export interface SpendingTrendDataPoint {
  month: string
  monthNum: number
  ars: number
  usd: number
}

export interface CardSpendingDataPoint {
  name: string
  ars: number
  usd: number
  color: string
}

// Month names for display
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
