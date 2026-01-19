'use client'

import { useState, useEffect } from 'react'
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart'
import { CardBreakdownChart } from '@/components/charts/CardBreakdownChart'
import {
  StatementSummaryResponse,
  EndMonth,
  formatDateRangeLabel,
} from '@/lib/types/dashboard'

type Currency = 'ARS' | 'USD'

interface DashboardChartsProps {
  summary: StatementSummaryResponse | null
  endMonth: EndMonth
  loading: boolean
}

export function DashboardCharts({
  summary,
  endMonth,
  loading,
}: DashboardChartsProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)

  // Determine available currencies and the most used one
  const availableCurrencies: Currency[] = []
  let mostUsedCurrency: Currency | null = null

  if (summary) {
    const totalArs = summary.rangeSummary.totalArs || 0
    const totalUsd = summary.rangeSummary.totalUsd || 0

    if (totalArs > 0) availableCurrencies.push('ARS')
    if (totalUsd > 0) availableCurrencies.push('USD')

    // Most used = highest total amount (comparing in a normalized way isn't perfect, but ARS is typically the primary)
    if (totalArs > 0 || totalUsd > 0) {
      mostUsedCurrency = totalArs >= totalUsd ? 'ARS' : 'USD'
      // If only one currency has data, use that one
      if (totalArs > 0 && totalUsd === 0) mostUsedCurrency = 'ARS'
      if (totalUsd > 0 && totalArs === 0) mostUsedCurrency = 'USD'
    }
  }

  // Set default currency when summary loads
  useEffect(() => {
    if (mostUsedCurrency && !selectedCurrency) {
      setSelectedCurrency(mostUsedCurrency)
    }
  }, [mostUsedCurrency, selectedCurrency])

  // Reset selected currency when date range changes and it's no longer available
  useEffect(() => {
    if (selectedCurrency && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(mostUsedCurrency)
    }
  }, [availableCurrencies, selectedCurrency, mostUsedCurrency])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px] animate-pulse rounded-lg bg-gray-200" />
          <div className="h-[300px] animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    )
  }

  if (!summary || availableCurrencies.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">
          No spending data for {formatDateRangeLabel(endMonth)}
        </p>
      </div>
    )
  }

  const activeCurrency = selectedCurrency || mostUsedCurrency || 'ARS'

  return (
    <div className="space-y-4">
      {/* Currency Selector Pills */}
      {availableCurrencies.length > 1 && (
        <div className="flex items-center gap-2">
          {availableCurrencies.map((currency) => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCurrency === currency
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingTrendChart
          monthlyData={summary.rangeSummary.monthlyData}
          endMonth={endMonth}
          currency={activeCurrency}
        />
        <CardBreakdownChart
          cardBreakdown={summary.cardBreakdown}
          currency={activeCurrency}
        />
      </div>
    </div>
  )
}
