'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DocumentIcon } from '@heroicons/react/24/outline'
import { expensesApi, statementsByMonthApi } from '@/lib/api'
import { MONTH_NAMES } from '@/lib/types/dashboard'
import type { MonthExpensesResponse } from '@/lib/types/expense'
import StatementSummary from '@/components/StatementSummary'
import MonthExpenseTable from '@/components/MonthExpenseTable'
import ConfirmationDialog from '@/components/ConfirmationDialog'

export default function MonthDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<MonthExpensesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const year = parseInt(params.year as string, 10)
  const month = parseInt(params.month as string, 10)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await expensesApi.getByMonth(year, month)
        setData(response)
      } catch (err) {
        console.error('Failed to fetch month expenses:', err)
        setError('Failed to load expenses for this month')
      } finally {
        setLoading(false)
      }
    }

    if (year && month) {
      fetchData()
    }
  }, [year, month])

  const handleStatementClick = (id: string) => {
    router.push(`/dashboard/statements/${id}`)
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    const url = `${expensesApi.exportCsvByMonth(year, month)}&token=${token}`
    window.open(url, '_blank')
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await statementsByMonthApi.deleteByMonth(year, month)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete statements:', error)
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  // Get unique statements from expenses with totals
  const statementsMap = new Map<string, {
    id: string
    originalFilename: string
    totalArs: number
    totalUsd: number
    installmentCount: number
    installmentArs: number
    installmentUsd: number
    expenseCount: number
  }>()
  if (data) {
    data.expenses.forEach((expense) => {
      const hasInstallment = expense.currentInstallment && expense.totalInstallments
      const amountArs = Number(expense.amountArs) || 0
      const amountUsd = Number(expense.amountUsd) || 0
      const existing = statementsMap.get(expense.statement.id)
      if (existing) {
        existing.totalArs += amountArs
        existing.totalUsd += amountUsd
        existing.expenseCount += 1
        if (hasInstallment) {
          existing.installmentCount += 1
          existing.installmentArs += amountArs
          existing.installmentUsd += amountUsd
        }
      } else {
        statementsMap.set(expense.statement.id, {
          id: expense.statement.id,
          originalFilename: expense.statement.originalFilename,
          totalArs: amountArs,
          totalUsd: amountUsd,
          expenseCount: 1,
          installmentCount: hasInstallment ? 1 : 0,
          installmentArs: hasInstallment ? amountArs : 0,
          installmentUsd: hasInstallment ? amountUsd : 0,
        })
      }
    })
  }
  const statements = Array.from(statementsMap.values())

  const monthName = MONTH_NAMES[month - 1]

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">Loading expenses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500 mb-4">No data found for this month</p>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {monthName} {year}
            </h1>
            <p className="text-sm text-gray-500">
              {data.expenses.length} expenses
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Export CSV
            </button>
            <button
              onClick={handleDeleteClick}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Summary - using StatementSummary style */}
        <div className="p-4">
          <StatementSummary
            totalArs={data.totalArs}
            totalUsd={data.totalUsd}
            dueDate={null}
            statementDate={null}
            expenses={data.expenses}
          />
        </div>
      </div>

      {/* Statements list */}
      {statements.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Statements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">File</th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">Expenses</th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">Installments</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Inst. ARS</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Inst. USD</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">ARS</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statements.map((statement) => (
                  <tr
                    key={statement.id}
                    onClick={() => handleStatementClick(statement.id)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <DocumentIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="text-sm text-gray-700">{statement.originalFilename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm text-gray-600">
                      {statement.expenseCount}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {statement.installmentCount > 0 ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {statement.installmentCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-blue-400">
                      {statement.installmentArs > 0 ? `$${statement.installmentArs.toLocaleString()}` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-emerald-400">
                      {statement.installmentUsd > 0 ? `US$${statement.installmentUsd.toLocaleString()}` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-blue-600">
                      {statement.totalArs > 0 ? `$${statement.totalArs.toLocaleString()}` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm text-emerald-600">
                      {statement.totalUsd > 0 ? `US$${statement.totalUsd.toLocaleString()}` : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses table */}
      {data.expenses.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          </div>
          <div className="p-4">
            <MonthExpenseTable expenses={data.expenses} />
          </div>
        </div>
      )}

      {data.expenses.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No expenses found for {monthName} {year}</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete All Statements"
        message={`Are you sure you want to delete all ${statements.length} statement${statements.length !== 1 ? 's' : ''} from ${monthName} ${year}? This will permanently remove all expenses associated with these statements. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
