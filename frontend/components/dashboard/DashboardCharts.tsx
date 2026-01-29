'use client'

import { useState, useEffect } from 'react'
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart'
import { CardBreakdownChart } from '@/components/charts/CardBreakdownChart'
import {
  StatementSummaryResponse,
  EndMonth,
  formatDateRangeLabel,
} from '@/lib/types/dashboard'
import { useTranslations, useMonthNamesShort } from '@/lib/i18n'

type Currency = 'ARS' | 'USD'

interface DashboardChartsProps {
  summary: StatementSummaryResponse | null
  endMonth: EndMonth
  loading: boolean
}

const CURRENCY_COLORS: Record<Currency, { active: string; inactive: string }> = {
  ARS: {
    active: 'bg-blue-600 text-white ring-blue-600/20',
    inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100 ring-blue-100',
  },
  USD: {
    active: 'bg-emerald-600 text-white ring-emerald-600/20',
    inactive: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-emerald-100',
  },
}

export function DashboardCharts({
  summary,
  endMonth,
  loading,
}: DashboardChartsProps) {
  const t = useTranslations()
  const monthNamesShort = useMonthNamesShort()
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)

  // Determine available currencies and the most used one
  const availableCurrencies: Currency[] = []
  let mostUsedCurrency: Currency | null = null

  if (summary) {
    const totalArs = summary.rangeSummary.totalArs || 0
    const totalUsd = summary.rangeSummary.totalUsd || 0

    if (totalArs > 0) availableCurrencies.push('ARS')
    if (totalUsd > 0) availableCurrencies.push('USD')

    // Most used = highest total amount
    if (totalArs > 0 || totalUsd > 0) {
      mostUsedCurrency = totalArs >= totalUsd ? 'ARS' : 'USD'
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
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-[280px] animate-pulse rounded-lg bg-gray-100" />
            <div className="h-[280px] animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>
      </div>
    )
  }

  if (!summary || availableCurrencies.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.spending')}</h2>
        </div>
        <div className="flex h-[200px] items-center justify-center p-4">
          <p className="text-gray-500">
            {t('dashboard.noSpendingData', { period: formatDateRangeLabel(endMonth, monthNamesShort) })}
          </p>
        </div>
      </div>
    )
  }

  const activeCurrency = selectedCurrency || mostUsedCurrency || 'ARS'

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Section Header with Currency Pills */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.spending')}</h2>

        {/* Currency Pills - clearly part of this section */}
        {availableCurrencies.length > 0 && (
          <div className="flex items-center gap-1.5">
            {availableCurrencies.map((currency) => {
              const colors = CURRENCY_COLORS[currency]
              const isActive = activeCurrency === currency
              const label = currency === 'ARS'
                ? t('charts.argentinePeso')
                : t('charts.usDollar')
              return (
                <button
                  key={currency}
                  onClick={() => setSelectedCurrency(currency)}
                  className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                    isActive ? colors.active : colors.inactive
                  }`}
                  title={label}
                >
                  {currency}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 p-4 lg:grid-cols-2">
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
