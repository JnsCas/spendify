'use client'

import { MonthCard } from './MonthCard'
import { MonthlyData, Statement } from '@/lib/types/dashboard'

interface MonthlyGridProps {
  year: number
  monthlyData: MonthlyData[]
  statements: Statement[]
  onStatementClick: (id: string) => void
  loading: boolean
}

export function MonthlyGrid({
  year,
  monthlyData,
  statements,
  onStatementClick,
  loading,
}: MonthlyGridProps) {
  // Get current date info
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  // Determine how many months to show
  const isCurrentYear = year === currentYear
  const monthsToShow = isCurrentYear ? currentMonth : 12

  // Group statements by month
  const statementsByMonth: Record<number, Statement[]> = {}
  statements.forEach((statement) => {
    if (statement.statementDate) {
      const date = new Date(statement.statementDate)
      const month = date.getMonth() + 1
      if (!statementsByMonth[month]) {
        statementsByMonth[month] = []
      }
      statementsByMonth[month].push(statement)
    }
  })

  // Filter months that have spending data
  const monthsWithSpending = monthlyData.filter((m) => m.totalArs > 0)

  // Find the month with highest spending (using ARS as primary)
  const highestSpendingMonth =
    monthsWithSpending.length > 0
      ? monthsWithSpending.reduce((highest, current) =>
          current.totalArs > highest.totalArs ? current : highest
        ).month
      : null

  // Find the month with lowest spending (only if there are at least 2 months with data)
  const lowestSpendingMonth =
    monthsWithSpending.length > 1
      ? monthsWithSpending.reduce((lowest, current) =>
          current.totalArs < lowest.totalArs ? current : lowest
        ).month
      : null

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: monthsToShow }, (_, i) => (
          <div
            key={i}
            className="h-[200px] animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: monthsToShow }, (_, i) => i + 1).map((month) => {
        const monthData = monthlyData.find((m) => m.month === month)
        const monthStatements = statementsByMonth[month] || []

        return (
          <MonthCard
            key={month}
            month={month}
            year={year}
            totalArs={monthData?.totalArs || 0}
            totalUsd={monthData?.totalUsd || 0}
            statementCount={monthData?.statementCount || 0}
            statements={monthStatements}
            onStatementClick={onStatementClick}
            isHighestSpending={month === highestSpendingMonth}
            isLowestSpending={month === lowestSpendingMonth}
          />
        )
      })}
    </div>
  )
}
