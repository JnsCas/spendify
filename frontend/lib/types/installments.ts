export interface InstallmentsSummary {
  activeCount: number
  completingThisMonthArs: number
  totalRemainingUsd: number
  totalMonthlyPaymentArs: number
}

export interface InstallmentCard {
  id: string | null
  customName: string | null
  lastFourDigits: string | null
}

export interface InstallmentDetail {
  id: string
  description: string
  purchaseDate: string | null
  currentInstallment: number
  totalInstallments: number
  monthlyAmountArs: number | null
  monthlyAmountUsd: number | null
  remainingAmountArs: number | null
  remainingAmountUsd: number | null
  remainingMonths: number
  card: InstallmentCard | null
  statementMonth: string
  status: 'active' | 'completing'
}

export interface InstallmentsResponse {
  summary: InstallmentsSummary
  installments: InstallmentDetail[]
}
