'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from '@/lib/i18n'
import { formatCurrency, formatDate } from '@/lib/format'

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
  const t = useTranslations()
  const locale = useLocale()

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
          {t('dashboard.totalArs')}
        </h3>
        <p className="mt-1 text-xl font-semibold text-blue-600">
          {totalArs ? formatCurrency(Number(totalArs), 'ARS', locale) : '-'}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('dashboard.totalUsd')}
        </h3>
        <p className="mt-1 text-xl font-semibold text-emerald-600">
          {totalUsd ? formatCurrency(Number(totalUsd), 'USD', locale) : '-'}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('dashboard.installments')}
        </h3>
        <div className="mt-1">
          {installmentSubtotals.ars > 0 && (
            <p className="text-sm font-medium text-blue-600">
              {formatCurrency(installmentSubtotals.ars, 'ARS', locale)}
            </p>
          )}
          {installmentSubtotals.usd > 0 && (
            <p className="text-sm font-medium text-emerald-600">
              {formatCurrency(installmentSubtotals.usd, 'USD', locale)}
            </p>
          )}
          {installmentSubtotals.count === 0 && (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {installmentSubtotals.count} {t('expenses.purchases')}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('expenses.dueDate')}
        </h3>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {dueDate ? formatDate(dueDate, locale) : '-'}
        </p>
        {statementDate && (
          <p className="mt-1 text-xs text-gray-400">
            {t('expenses.statement')}: {formatDate(statementDate, locale)}
          </p>
        )}
      </div>
    </div>
  )
}
