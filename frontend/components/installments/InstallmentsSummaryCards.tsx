import type { InstallmentsSummary } from '@/lib/types/installments'

interface InstallmentsSummaryCardsProps {
  summary: InstallmentsSummary
  loading?: boolean
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

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* 1. Active Installments Count */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Installments</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {summary.activeCount}
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-2">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Completing This Month Amount */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Completing This Month</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatCurrency(summary.completingThisMonthArs, 'ARS')}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Total Remaining USD */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Remaining (USD)</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatCurrency(summary.totalRemainingUsd, 'USD')}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Total Monthly Payment ARS (Most Important) */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-blue-700">Total Monthly Payment</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">
              {formatCurrency(summary.totalMonthlyPaymentArs, 'ARS')}
            </p>
          </div>
          <div className="rounded-lg bg-blue-100 p-2">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
