export interface MonthlyData {
  month: number
  year: number
  totalArs: number
  totalUsd: number
  statementCount: number
}

export interface EndMonth {
  year: number
  month: number
}

export interface CardBreakdown {
  cardId: string | null
  customName: string | null
  lastFourDigits: string | null
  totalArs: number
  totalUsd: number
}

export interface RangeSummary {
  startDate: string
  endDate: string
  totalArs: number
  totalUsd: number
  monthlyData: MonthlyData[]
}

export interface StatementSummaryResponse {
  availableMonths: EndMonth[]
  rangeSummary: RangeSummary
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

export interface CompletingInstallment {
  id: string
  description: string
  amountArs: number | null
  amountUsd: number | null
  currentInstallment: number
  totalInstallments: number
  cardId: string | null
  customName: string | null
  lastFourDigits: string | null
}

export interface CompletingInstallmentsResponse {
  statementMonth: string
  installments: CompletingInstallment[]
  totalArs: number
  totalUsd: number
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

// Helper to format end month display (e.g., "Jan 2026")
export const formatEndMonth = (endMonth: EndMonth): string => {
  return `${MONTH_SHORT_NAMES[endMonth.month - 1]} ${endMonth.year}`
}

// Helper to generate 12-month label (e.g., "Feb 2025 - Jan 2026")
export const formatDateRangeLabel = (endMonth: EndMonth): string => {
  let startMonth = endMonth.month - 11
  let startYear = endMonth.year
  if (startMonth <= 0) {
    startMonth += 12
    startYear -= 1
  }
  return `${MONTH_SHORT_NAMES[startMonth - 1]} ${startYear} - ${MONTH_SHORT_NAMES[endMonth.month - 1]} ${endMonth.year}`
}

// Helper to generate the 12-month sequence ending at endMonth
export const generate12MonthSequence = (
  endMonth: EndMonth
): { year: number; month: number }[] => {
  const months: { year: number; month: number }[] = []

  for (let i = 11; i >= 0; i--) {
    let m = endMonth.month - i
    let y = endMonth.year
    if (m <= 0) {
      m += 12
      y -= 1
    }
    months.push({ year: y, month: m })
  }

  return months
}
