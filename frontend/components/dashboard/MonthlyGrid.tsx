'use client'

import { MonthCard } from './MonthCard'
import {
  Statement,
  EndMonth,
  generate12MonthSequence,
  MonthlyData,
} from '@/lib/types/dashboard'

interface MonthlyGridProps {
  endMonth: EndMonth
  monthlyData: MonthlyData[]
  statements: Statement[]
  onStatementClick: (id: string) => void
  loading: boolean
}

export function MonthlyGrid({
  endMonth,
  monthlyData,
  statements,
  onStatementClick,
  loading,
}: MonthlyGridProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Generate the 12-month sequence
  const monthSequence = generate12MonthSequence(endMonth)

  // Filter out future months
  const monthsToShow = monthSequence.filter(({ year, month }) => {
    if (year < currentYear) return true
    if (year === currentYear) return month <= currentMonth
    return false
  })

  // Group statements by year-month
  const statementsByYearMonth: Record<string, Statement[]> = {}
  statements.forEach((statement) => {
    if (statement.statementDate) {
      const date = new Date(statement.statementDate)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      if (!statementsByYearMonth[key]) {
        statementsByYearMonth[key] = []
      }
      statementsByYearMonth[key].push(statement)
    }
  })

  // Filter months that have spending data
  const monthsWithSpending = monthlyData.filter((m) => m.totalArs > 0)

  // Find highest spending month
  const highestSpendingMonth =
    monthsWithSpending.length > 0
      ? monthsWithSpending.reduce((highest, current) =>
          current.totalArs > highest.totalArs ? current : highest
        )
      : null

  // Find lowest spending month (only if there are at least 2 months with data)
  const lowestSpendingMonth =
    monthsWithSpending.length > 1
      ? monthsWithSpending.reduce((lowest, current) =>
          current.totalArs < lowest.totalArs ? current : lowest
        )
      : null

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: monthsToShow.length }, (_, i) => (
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
      {monthsToShow.map(({ year, month }) => {
        const key = `${year}-${month}`
        const monthData = monthlyData.find(
          (m) => m.year === year && m.month === month
        )
        const monthStatements = statementsByYearMonth[key] || []

        const isHighest =
          highestSpendingMonth &&
          highestSpendingMonth.year === year &&
          highestSpendingMonth.month === month
        const isLowest =
          lowestSpendingMonth &&
          lowestSpendingMonth.year === year &&
          lowestSpendingMonth.month === month

        return (
          <MonthCard
            key={key}
            month={month}
            year={year}
            totalArs={monthData?.totalArs || 0}
            totalUsd={monthData?.totalUsd || 0}
            statementCount={monthData?.statementCount || 0}
            statements={monthStatements}
            onStatementClick={onStatementClick}
            isHighestSpending={isHighest || false}
            isLowestSpending={isLowest || false}
          />
        )
      })}
    </div>
  )
}
