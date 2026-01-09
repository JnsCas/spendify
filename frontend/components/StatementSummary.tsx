'use client'

import { useMemo } from 'react'

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm text-gray-500 uppercase">Total ARS</h3>
        <p className="text-2xl font-bold mt-2">
          {totalArs ? `$${Number(totalArs).toLocaleString()}` : '-'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm text-gray-500 uppercase">Total USD</h3>
        <p className="text-2xl font-bold mt-2">
          {totalUsd ? `US$${Number(totalUsd).toLocaleString()}` : '-'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm text-gray-500 uppercase">Installments Subtotal</h3>
        <p className="text-lg font-semibold mt-2">
          {installmentSubtotals.ars > 0 && (
            <span className="block">
              ARS: ${installmentSubtotals.ars.toLocaleString()}
            </span>
          )}
          {installmentSubtotals.usd > 0 && (
            <span className="block">
              USD: US${installmentSubtotals.usd.toLocaleString()}
            </span>
          )}
          {installmentSubtotals.count === 0 && '-'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {installmentSubtotals.count} installment purchases
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm text-gray-500 uppercase">Due Date</h3>
        <p className="text-2xl font-bold mt-2">
          {dueDate ? new Date(dueDate).toLocaleDateString() : '-'}
        </p>
        {statementDate && (
          <p className="text-xs text-gray-500 mt-1">
            Statement: {new Date(statementDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}
