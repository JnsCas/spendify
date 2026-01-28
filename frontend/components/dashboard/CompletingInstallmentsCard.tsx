'use client'

import { useState } from 'react'
import { CompletingInstallmentsResponse } from '@/lib/types/dashboard'
import { useTranslations, useLocale, useMonthNames } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'

interface CompletingInstallmentsCardProps {
  data: CompletingInstallmentsResponse | null
  loading: boolean
}

const formatStatementMonth = (monthString: string, monthNames: string[]): string => {
  const [year, month] = monthString.split('-').map(Number)
  return `${monthNames[month - 1]} ${year}`
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
        expanded ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  )
}

export function CompletingInstallmentsCard({
  data,
  loading,
}: CompletingInstallmentsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations()
  const locale = useLocale()
  const monthNames = useMonthNames()

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 h-6 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mb-4 h-4 w-36 animate-pulse rounded bg-gray-200" />
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Completing Installments
        </h3>
      </div>
    )
  }

  const installmentCount = data.installments.length
  const hasInstallments = installmentCount > 0
  const hasTotals = data.totalArs > 0 || data.totalUsd > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header - Always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Completing Installments
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                hasInstallments
                  ? 'animate-pulse bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {installmentCount}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {formatStatementMonth(data.statementMonth, monthNames)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-right">
            {hasTotals ? (
              <>
                {data.totalArs > 0 && (
                  <span className="text-sm font-semibold text-blue-600">
                    {formatCurrency(data.totalArs, 'ARS', locale)}
                  </span>
                )}
                {data.totalUsd > 0 && (
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(data.totalUsd, 'USD', locale)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-400">
                {formatCurrency(0, 'ARS', locale)}
              </span>
            )}
          </div>
          <ChevronIcon expanded={isExpanded} />
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 pt-3">
          {hasInstallments ? (
            <div className="space-y-2">
              {data.installments.map((installment) => {
                const hasArs =
                  installment.amountArs !== null && installment.amountArs > 0
                const hasUsd =
                  installment.amountUsd !== null && installment.amountUsd > 0
                const cardDisplay = installment.customName
                  ? installment.customName
                  : installment.lastFourDigits
                    ? `****${installment.lastFourDigits}`
                    : null

                return (
                  <div
                    key={installment.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {installment.description}
                        </p>
                        {cardDisplay && (
                          <p className="text-xs text-gray-500">{cardDisplay}</p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <div className="text-right">
                          {hasArs && (
                            <p className="text-sm font-medium text-blue-600">
                              {formatCurrency(installment.amountArs!, 'ARS', locale)}
                            </p>
                          )}
                          {hasUsd && (
                            <p className="text-sm font-medium text-emerald-600">
                              {formatCurrency(installment.amountUsd!, 'USD', locale)}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {installment.currentInstallment}/
                          {installment.totalInstallments}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-gray-500">No installments completing this month</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
