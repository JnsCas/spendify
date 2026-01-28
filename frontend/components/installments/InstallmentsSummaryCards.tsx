import type { ReactNode } from 'react'
import type { InstallmentsSummary } from '@/lib/types/installments'
import { formatCurrency } from '@/lib/utils/currency'

interface InstallmentsSummaryCardsProps {
  summary: InstallmentsSummary
  loading?: boolean
}

interface SummaryCardProps {
  label: string
  value: string | number
  icon: ReactNode
  variant?: 'default' | 'purple' | 'emerald' | 'blue'
}

const variantStyles = {
  default: {
    card: 'rounded-lg border border-gray-200 bg-white p-4',
    label: 'text-sm text-gray-500',
    value: 'mt-1 text-2xl font-semibold text-gray-900',
    iconBg: 'rounded-lg bg-gray-100 p-2',
    iconColor: 'text-gray-600',
  },
  purple: {
    card: 'rounded-lg border border-gray-200 bg-white p-4',
    label: 'text-sm text-gray-500',
    value: 'mt-1 text-2xl font-semibold text-purple-600',
    iconBg: 'rounded-lg bg-purple-50 p-2',
    iconColor: 'text-purple-600',
  },
  emerald: {
    card: 'rounded-lg border border-gray-200 bg-white p-4',
    label: 'text-sm text-gray-500',
    value: 'mt-1 text-2xl font-semibold text-emerald-600',
    iconBg: 'rounded-lg bg-emerald-50 p-2',
    iconColor: 'text-emerald-600',
  },
  blue: {
    card: 'rounded-lg border border-blue-200 bg-blue-50 p-4',
    label: 'text-sm text-blue-700',
    value: 'mt-1 text-2xl font-semibold text-blue-600',
    iconBg: 'rounded-lg bg-blue-100 p-2',
    iconColor: 'text-blue-600',
  },
}

function SummaryCard({ label, value, icon, variant = 'default' }: SummaryCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={styles.card}>
      <div className="flex items-start justify-between">
        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
        </div>
        <div className={styles.iconBg}>
          <div className={styles.iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  )
}

const ClipboardIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const DollarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const WalletIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
)

function TotalInstallmentsCard({ count }: { count: number }) {
  return (
    <SummaryCard
      label="Total Installments"
      value={count}
      icon={<ClipboardIcon />}
      variant="default"
    />
  )
}

function CompletingThisMonthCard({ amount }: { amount: number }) {
  return (
    <SummaryCard
      label="Completing This Month"
      value={formatCurrency(amount, 'ARS')}
      icon={<CheckCircleIcon />}
      variant="purple"
    />
  )
}

function TotalRemainingUsdCard({ amount }: { amount: number }) {
  return (
    <SummaryCard
      label="Total Remaining (USD)"
      value={formatCurrency(amount, 'USD')}
      icon={<DollarIcon />}
      variant="emerald"
    />
  )
}

function TotalMonthlyPaymentCard({ amount }: { amount: number }) {
  return (
    <SummaryCard
      label="Total Monthly Payment"
      value={formatCurrency(amount, 'ARS')}
      icon={<WalletIcon />}
      variant="blue"
    />
  )
}

export function InstallmentsSummaryCards({ summary, loading }: InstallmentsSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <TotalInstallmentsCard count={summary.activeCount} />
      <CompletingThisMonthCard amount={summary.completingThisMonthArs} />
      <TotalRemainingUsdCard amount={summary.totalRemainingUsd} />
      <TotalMonthlyPaymentCard amount={summary.totalMonthlyPaymentArs} />
    </div>
  )
}
