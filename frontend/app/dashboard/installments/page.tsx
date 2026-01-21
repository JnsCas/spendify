'use client'

import { useState, useEffect, useMemo } from 'react'
import { installmentsApi } from '@/lib/api'
import type { InstallmentsResponse, InstallmentDetail } from '@/lib/types/installments'
import { InstallmentsSummaryCards } from '@/components/installments/InstallmentsSummaryCards'
import { InstallmentsTable } from '@/components/installments/InstallmentsTable'
import { InstallmentCard } from '@/components/installments/InstallmentCard'
import { InstallmentFilters } from '@/components/installments/InstallmentFilters'

export default function InstallmentsPage() {
  const [data, setData] = useState<InstallmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completing'>('all')

  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Get unique months from installments for the month filter
  const availableMonths = useMemo(() => {
    if (!data?.installments) return []
    const months = new Set(data.installments.map((i) => i.statementMonth))
    return Array.from(months).sort().reverse()
  }, [data?.installments])

  // Auto-select the most recent month when data loads
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  // Fetch data once
  useEffect(() => {
    const fetchInstallments = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await installmentsApi.getAll()
        setData(response)
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load installments')
      } finally {
        setLoading(false)
      }
    }

    fetchInstallments()
  }, [])

  // Filter installments by month (for the list view)
  const monthFilteredInstallments = useMemo(() => {
    if (!data?.installments || !selectedMonth) return []

    return data.installments.filter((installment) => {
      return installment.statementMonth === selectedMonth
    })
  }, [data?.installments, selectedMonth])

  // Further filter by status for the list view
  const filteredInstallments = useMemo(() => {
    if (selectedStatus === 'all') return monthFilteredInstallments

    return monthFilteredInstallments.filter((installment) => {
      return installment.status === selectedStatus
    })
  }, [monthFilteredInstallments, selectedStatus])

  // Calculate summary from month-filtered installments (not affected by status filter)
  const calculatedSummary = useMemo(() => {
    if (monthFilteredInstallments.length === 0) {
      return {
        activeCount: 0,
        completingThisMonthArs: 0,
        totalRemainingArs: 0,
        totalRemainingUsd: 0,
      }
    }

    const activeInstallments = monthFilteredInstallments.filter((i) => i.status === 'active')
    const completingInstallments = monthFilteredInstallments.filter((i) => i.status === 'completing')

    return {
      activeCount: activeInstallments.length,
      completingThisMonthArs: completingInstallments.reduce((sum, i) => sum + (i.monthlyAmountArs || 0), 0),
      totalRemainingArs: activeInstallments.reduce((sum, i) => sum + (i.remainingAmountArs || 0), 0),
      totalRemainingUsd: activeInstallments.reduce((sum, i) => sum + (i.remainingAmountUsd || 0), 0),
    }
  }, [monthFilteredInstallments])

  const handleStatusChange = (status: 'all' | 'active' | 'completing') => {
    setSelectedStatus(status)
  }

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
  }

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Installments</h1>
            <p className="text-sm text-gray-500">
              Track your ongoing payment commitments
            </p>
          </div>

          {/* Month Filter */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="month-filter" className="text-sm text-gray-500">
                Month:
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonth(month)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4">
          <InstallmentsSummaryCards
            summary={calculatedSummary}
            loading={loading}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">All Installments</h2>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <InstallmentFilters
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
                />
              ))}
            </div>
          ) : filteredInstallments.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
              <div className="mb-2 rounded-full bg-gray-100 p-3">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                {data?.installments.length === 0
                  ? 'No installment purchases yet'
                  : selectedStatus === 'all'
                  ? 'No installments for this month'
                  : selectedStatus === 'active'
                  ? 'No active installments for this month'
                  : 'No installments completing this month'}
              </p>
              <p className="text-xs text-gray-400">
                {data?.installments.length === 0
                  ? 'Import statements with installment purchases to get started'
                  : 'Try selecting a different month'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <InstallmentsTable installments={filteredInstallments} />
              </div>
              <div className="space-y-3 md:hidden">
                {filteredInstallments.map((installment) => (
                  <InstallmentCard key={installment.id} installment={installment} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
