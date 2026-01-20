'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { expensesApi } from '@/lib/api'
import { MONTH_NAMES } from '@/lib/types/dashboard'
import type { MonthExpensesResponse } from '@/lib/types/expense'
import MonthSummary from '@/components/MonthSummary'
import MonthExpenseTable from '@/components/MonthExpenseTable'

export default function MonthDetailPage() {
  const params = useParams()
  const [data, setData] = useState<MonthExpensesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No data found for this month</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    )
  }

  const monthName = MONTH_NAMES[month - 1]

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">{monthName} {year} Expenses</h1>
      </div>

      {data.expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No expenses found for {monthName} {year}</p>
        </div>
      ) : (
        <>
          <MonthSummary
            year={data.year}
            month={data.month}
            totalArs={data.totalArs}
            totalUsd={data.totalUsd}
            statementCount={data.statementCount}
            expenses={data.expenses}
          />

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">All Expenses</h2>
            <MonthExpenseTable expenses={data.expenses} />
          </div>
        </>
      )}
    </div>
  )
}
