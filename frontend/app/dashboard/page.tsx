'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { statementsApi } from '@/lib/api'
import { DashboardCharts, YearPaginator, MonthlyGrid, CircularProgress } from '@/components/dashboard'
import { Statement, StatementSummaryResponse } from '@/lib/types/dashboard'

const POLL_INTERVAL = 5000 // 5 seconds

export default function DashboardPage() {
  const router = useRouter()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<StatementSummaryResponse | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [processingStatements, setProcessingStatements] = useState<Statement[]>([])
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

  const fetchProcessingStatements = useCallback(async () => {
    try {
      const data = await statementsApi.getProcessing()
      setProcessingStatements(data)
    } catch (error) {
      console.error('Failed to fetch processing statements:', error)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchSummary(currentYear)
    fetchStatements(currentYear)
    fetchProcessingStatements()
  }, [currentYear, fetchSummary, fetchStatements, fetchProcessingStatements])

  const handleYearChange = (year: number) => {
    setCurrentYear(year)
  }

  const handleStatementClick = (id: string) => {
    router.push(`/dashboard/statements/${id}`)
  }

  // Polling effect - polls when there are processing statements
  useEffect(() => {
    const processingIds = processingStatements.map(s => s.id)
    if (processingIds.length === 0) return

    const poll = async () => {
      try {
        const response = await statementsApi.getStatuses(processingIds)
        const stillProcessing = response.statuses.filter(
          s => s.status === 'pending' || s.status === 'processing'
        )

        // If any completed, refresh all data
        if (stillProcessing.length !== processingIds.length) {
          fetchSummary(currentYear)
          fetchStatements(currentYear)
          fetchProcessingStatements()
        }
      } catch (error) {
        console.error('Error polling statuses:', error)
      }
    }

    // Poll immediately, then every 5 seconds
    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [processingStatements, currentYear, fetchSummary, fetchStatements, fetchProcessingStatements])

  // Calculate values for display
  const yearTotalArs = summary?.yearSummary.totalArs || 0
  const yearTotalUsd = summary?.yearSummary.totalUsd || 0
  const processingCount = processingStatements.length

  return (
    <div className="space-y-6">
      {/* Processing Banner - shows when statements are being processed */}
      {processingCount > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <CircularProgress
              current={processingCount}
              total={processingCount}
              size={24}
              strokeWidth={3}
            />
            <span className="text-sm font-medium text-blue-700">
              Processing {processingCount} file
              {processingCount > 1 ? 's' : ''}...
            </span>
          </div>
        </div>
      )}

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
          loading={loading}
        />
      </div>
    </div>
  )
}
