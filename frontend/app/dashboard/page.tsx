'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { statementsApi } from '@/lib/api'
import { DashboardCharts, YearPaginator, MonthlyGrid } from '@/components/dashboard'
import { Statement, StatementSummaryResponse } from '@/lib/types/dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<StatementSummaryResponse | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)

  const fetchSummary = useCallback(async (year: number) => {
    try {
      setSummaryLoading(true)
      const data = await statementsApi.getSummary(year)
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchStatements = useCallback(async (year: number) => {
    try {
      setLoading(true)
      const data = await statementsApi.getAll(year)
      setStatements(data)
    } catch (error) {
      console.error('Failed to fetch statements:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary(currentYear)
    fetchStatements(currentYear)
  }, [currentYear, fetchSummary, fetchStatements])

  const handleYearChange = (year: number) => {
    setCurrentYear(year)
  }

  const handleStatementClick = (id: string) => {
    router.push(`/dashboard/statements/${id}`)
  }

  const handleUploadSuccess = () => {
    // Refresh both summary and statements
    fetchSummary(currentYear)
    fetchStatements(currentYear)
  }

  // Calculate year totals for display
  const yearTotalArs = summary?.yearSummary.totalArs || 0
  const yearTotalUsd = summary?.yearSummary.totalUsd || 0

  return (
    <div className="space-y-6">
      {/* Year Navigation with Total */}
      <YearPaginator
        currentYear={currentYear}
        minYear={1990}
        onYearChange={handleYearChange}
        totalArs={yearTotalArs}
        totalUsd={yearTotalUsd}
      />

      {/* Charts Section */}
      <DashboardCharts
        summary={summary}
        currentYear={currentYear}
        loading={summaryLoading}
      />

      {/* Monthly Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Monthly Statements
        </h2>
        <MonthlyGrid
          year={currentYear}
          monthlyData={summary?.yearSummary.monthlyData || []}
          statements={statements}
          onStatementClick={handleStatementClick}
          onUploadSuccess={handleUploadSuccess}
          loading={loading}
        />
      </div>
    </div>
  )
}
