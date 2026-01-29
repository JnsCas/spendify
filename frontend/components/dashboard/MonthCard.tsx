'use client'

import { CalendarIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { Statement } from '@/lib/types/dashboard'
import { useTranslations, useLocale, useMonthNames } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'

interface MonthCardProps {
  month: number
  year: number
  totalArs: number
  totalUsd: number
  statementCount: number
  statements: Statement[]
  onStatementClick: (id: string) => void
  onMonthClick: (year: number, month: number) => void
  isHighestSpending?: boolean
  isLowestSpending?: boolean
}

export function MonthCard({
  month,
  year,
  totalArs,
  totalUsd,
  statementCount,
  statements,
  onStatementClick,
  onMonthClick,
  isHighestSpending = false,
  isLowestSpending = false,
}: MonthCardProps) {
  const t = useTranslations()
  const locale = useLocale()
  const monthNames = useMonthNames()
  const monthName = monthNames[month - 1]
  const hasStatements = statementCount > 0

  // Determine card styling based on spending status
  const getCardClasses = () => {
    if (isHighestSpending) {
      return 'border-red-200 bg-red-50/50 ring-1 ring-red-100'
    }
    if (isLowestSpending) {
      return 'border-emerald-200 bg-emerald-50/50 ring-1 ring-emerald-100'
    }
    if (hasStatements) {
      return 'border-gray-100 bg-gray-50/50'
    }
    return 'border-gray-100 bg-gray-50/30'
  }

  const getHeaderClasses = () => {
    if (isHighestSpending) {
      return 'border-red-100 bg-red-100/50'
    }
    if (isLowestSpending) {
      return 'border-emerald-100 bg-emerald-100/50'
    }
    if (hasStatements) {
      return 'border-gray-100 bg-white/50'
    }
    return 'border-gray-100 bg-white/30'
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all hover:shadow-sm ${getCardClasses()}`}
    >
      {/* Header */}
      <div className={`border-b px-3 py-2.5 ${getHeaderClasses()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            {hasStatements ? (
              <button
                onClick={() => onMonthClick(year, month)}
                className="rounded-md px-1.5 py-0.5 -ml-1.5 hover:bg-black/5 transition-colors"
                title="View all expenses for this month"
              >
                <h3 className="text-sm font-semibold text-gray-900">
                  {monthName}
                  <span className="ml-1 font-normal text-gray-500">
                    {year}
                  </span>
                </h3>
              </button>
            ) : (
              <h3 className="text-sm font-semibold text-gray-900">
                {monthName}
                <span className="ml-1 font-normal text-gray-500">
                  {year}
                </span>
              </h3>
            )}
            {isHighestSpending && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                {t('common.high')}
              </span>
            )}
            {isLowestSpending && (
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                {t('common.low')}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {statementCount}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {hasStatements ? (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-xs text-gray-400">ARS</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(totalArs, 'ARS', locale)}
                </span>
              </div>
              {totalUsd > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-xs text-gray-400">USD</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(totalUsd, 'USD', locale)}
                  </span>
                </div>
              )}
            </div>

            {/* Statement list */}
            {statements.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                {statements.map((statement) => (
                  <button
                    key={statement.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatementClick(statement.id)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
                  >
                    <DocumentIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{statement.originalFilename}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="py-2 text-center text-xs text-gray-400">
            {t('dashboard.noStatements')}
          </p>
        )}
      </div>
    </div>
  )
}
