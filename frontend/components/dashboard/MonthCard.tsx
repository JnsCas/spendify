'use client'

import { useState } from 'react'
import { DocumentIcon } from '@heroicons/react/24/outline'
import { MONTH_NAMES, Statement } from '@/lib/types/dashboard'

interface MonthCardProps {
  month: number
  year: number
  totalArs: number
  totalUsd: number
  statementCount: number
  statements: Statement[]
  onStatementClick: (id: string) => void
  isHighestSpending?: boolean
  isLowestSpending?: boolean
}

const formatCurrency = (value: number, currency: 'ARS' | 'USD') => {
  if (currency === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MonthCard({
  month,
  year,
  totalArs,
  totalUsd,
  statementCount,
  statements,
  onStatementClick,
  isHighestSpending = false,
  isLowestSpending = false,
}: MonthCardProps) {
  const [expanded, setExpanded] = useState(true)

  const monthName = MONTH_NAMES[month - 1]
  const hasStatements = statementCount > 0

  // Determine card styling based on spending status
  const getCardClasses = () => {
    if (isHighestSpending) {
      return 'border-red-300 bg-red-50 ring-2 ring-red-200'
    }
    if (isLowestSpending) {
      return 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-200'
    }
    return 'border-gray-200 bg-white'
  }

  const getHeaderClasses = () => {
    if (isHighestSpending) {
      return 'border-red-200 bg-red-100'
    }
    if (isLowestSpending) {
      return 'border-emerald-200 bg-emerald-100'
    }
    if (hasStatements) {
      return 'border-gray-100 bg-blue-50'
    }
    return 'border-gray-100 bg-gray-50'
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-shadow hover:shadow-md ${getCardClasses()}`}
    >
      {/* Header */}
      <div
        className={`cursor-pointer border-b px-4 py-3 ${getHeaderClasses()}`}
        onClick={() => hasStatements && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{monthName}</h3>
            {isHighestSpending && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                Highest
              </span>
            )}
            {isLowestSpending && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                Lowest
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {statementCount} {statementCount === 1 ? 'statement' : 'statements'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {hasStatements ? (
          <>
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ARS</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totalArs, 'ARS')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">USD</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totalUsd, 'USD')}
                </span>
              </div>
            </div>

            {/* Expanded statement list */}
            {expanded && statements.length > 0 && (
              <div className="mb-3 space-y-2 border-t border-gray-100 pt-3">
                {statements.map((statement) => (
                  <button
                    key={statement.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatementClick(statement.id)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{statement.originalFilename}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-sm text-gray-400">
            No statements yet
          </p>
        )}
      </div>
    </div>
  )
}
