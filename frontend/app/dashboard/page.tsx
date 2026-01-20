'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { statementsApi } from '@/lib/api'
import {
  DashboardCharts,
  MonthPaginator,
  MonthlyGrid,
  CircularProgress,
  CompletingInstallmentsCard,
} from '@/components/dashboard'
import {
  Statement,
  StatementSummaryResponse,
  EndMonth,
  CompletingInstallmentsResponse,
} from '@/lib/types/dashboard'

const POLL_INTERVAL = 10000 // 10 seconds

export default function DashboardPage() {
  const router = useRouter()

  // Initialize with current month as end month
  const now = new Date()
  const [endMonth, setEndMonth] = useState<EndMonth>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  const [summary, setSummary] = useState<StatementSummaryResponse | null>(null)
  const [statements, setStatements] = useState<Statement[]>([])
  const [processingStatements, setProcessingStatements] = useState<Statement[]>(
    []
  )
  const [completingInstallments, setCompletingInstallments] =
    useState<CompletingInstallmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [completingInstallmentsLoading, setCompletingInstallmentsLoading] =
    useState(true)

  const fetchSummary = useCallback(async (endMonth: EndMonth) => {
    try {
      setSummaryLoading(true)
      const data = await statementsApi.getSummary(endMonth.year, endMonth.month)
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchStatements = useCallback(async (endMonth: EndMonth) => {
    try {
      setLoading(true)
      const data = await statementsApi.getAll(endMonth.year, endMonth.month)
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

  const fetchCompletingInstallments = useCallback(async (endMonth: EndMonth) => {
    try {
      setCompletingInstallmentsLoading(true)
      const data = await statementsApi.getCompletingInstallments(
        endMonth.year,
        endMonth.month
      )
      setCompletingInstallments(data)
    } catch (error) {
      console.error('Failed to fetch completing installments:', error)
    } finally {
      setCompletingInstallmentsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchSummary(endMonth)
    fetchStatements(endMonth)
    fetchProcessingStatements()
    fetchCompletingInstallments(endMonth)
  }, [endMonth, fetchSummary, fetchStatements, fetchProcessingStatements, fetchCompletingInstallments])

  const handleEndMonthChange = (newEndMonth: EndMonth) => {
    setEndMonth(newEndMonth)
  }

  const handleStatementClick = (id: string) => {
    router.push(`/dashboard/statements/${id}`)
  }

  // Polling effect - polls when there are processing statements
  useEffect(() => {
    const processingIds = processingStatements.map((s) => s.id)
    if (processingIds.length === 0) return

    const poll = async () => {
      try {
        const response = await statementsApi.getStatuses(processingIds)
        const stillProcessing = response.statuses.filter(
          (s) => s.status === 'pending' || s.status === 'processing'
        )

        // If any completed, refresh all data
        if (stillProcessing.length !== processingIds.length) {
          fetchSummary(endMonth)
          fetchStatements(endMonth)
          fetchProcessingStatements()
          fetchCompletingInstallments(endMonth)
        }
      } catch (error) {
        console.error('Error polling statuses:', error)
      }
    }

    // Poll immediately, then every 10 seconds
    poll()
    const interval = setInterval(poll, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [
    processingStatements,
    endMonth,
    fetchSummary,
    fetchStatements,
    fetchProcessingStatements,
    fetchCompletingInstallments,
  ])

  // Calculate values for display
  const totalArs = summary?.rangeSummary.totalArs || 0
  const totalUsd = summary?.rangeSummary.totalUsd || 0
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

      {/* Month Navigation with Total */}
      <MonthPaginator
        endMonth={endMonth}
        onEndMonthChange={handleEndMonthChange}
        totalArs={totalArs}
        totalUsd={totalUsd}
        monthlyData={summary?.rangeSummary.monthlyData || []}
      />

      {/* Charts Section */}
      <DashboardCharts
        summary={summary}
        endMonth={endMonth}
        loading={summaryLoading}
      />

      {/* Completing Installments Widget */}
      <CompletingInstallmentsCard
        data={completingInstallments}
        loading={completingInstallmentsLoading}
      />

      {/* Monthly Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Monthly Statements
        </h2>
        <MonthlyGrid
          endMonth={endMonth}
          monthlyData={summary?.rangeSummary.monthlyData || []}
          statements={statements}
          onStatementClick={handleStatementClick}
          loading={loading}
        />
      </div>
    </div>
  )
}
