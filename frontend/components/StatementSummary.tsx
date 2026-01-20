'use client'

import { useMemo } from 'react'

// Format date string (YYYY-MM-DD) without timezone conversion issues
function formatDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

interface Expense {
  amountArs: number | null
  amountUsd: number | null
  totalInstallments: number | null
}

interface StatementSummaryProps {
  totalArs: number | null
  totalUsd: number | null
  dueDate: string | null
  statementDate: string | null
  expenses: Expense[]
}

export default function StatementSummary({
  totalArs,
  totalUsd,
  dueDate,
  statementDate,
  expenses,
}: StatementSummaryProps) {
  const installmentSubtotals = useMemo(() => {
    const installmentExpenses = expenses.filter(
      (e) => e.totalInstallments && e.totalInstallments > 1
    )

    return {
      ars: installmentExpenses.reduce(
        (sum, e) => sum + (Number(e.amountArs) || 0),
        0
      ),
      usd: installmentExpenses.reduce(
        (sum, e) => sum + (Number(e.amountUsd) || 0),
        0
      ),
      count: installmentExpenses.length,
    }
  }, [expenses])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Total ARS
        </h3>
        <p className="mt-1 text-xl font-semibold text-blue-600">
          {totalArs ? `$${Number(totalArs).toLocaleString()}` : '-'}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Total USD
        </h3>
        <p className="mt-1 text-xl font-semibold text-emerald-600">
          {totalUsd ? `US$${Number(totalUsd).toLocaleString()}` : '-'}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Installments
        </h3>
        <div className="mt-1">
          {installmentSubtotals.ars > 0 && (
            <p className="text-sm font-medium text-blue-600">
              ${installmentSubtotals.ars.toLocaleString()}
            </p>
          )}
          {installmentSubtotals.usd > 0 && (
            <p className="text-sm font-medium text-emerald-600">
              US${installmentSubtotals.usd.toLocaleString()}
            </p>
          )}
          {installmentSubtotals.count === 0 && (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {installmentSubtotals.count} purchases
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Due Date
        </h3>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {dueDate ? formatDateString(dueDate) : '-'}
        </p>
        {statementDate && (
          <p className="mt-1 text-xs text-gray-400">
            Statement: {formatDateString(statementDate)}
          </p>
        )}
      </div>
    </div>
  )
}
