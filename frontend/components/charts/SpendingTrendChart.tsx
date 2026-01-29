'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  MonthlyData,
  EndMonth,
  generate12MonthSequence,
} from '@/lib/types/dashboard'
import { useTranslations, useLocale, useMonthNamesShort } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'

type Currency = 'ARS' | 'USD'

interface SpendingTrendChartProps {
  monthlyData: MonthlyData[]
  endMonth: EndMonth
  currency: Currency
}

interface ChartDataPoint {
  month: string
  monthNum: number
  year: number
  value: number
}

const CURRENCY_CONFIG: Record<Currency, { color: string }> = {
  ARS: { color: '#3b82f6' },
  USD: { color: '#10b981' },
}

export function SpendingTrendChart({
  monthlyData,
  endMonth,
  currency,
}: SpendingTrendChartProps) {
  const t = useTranslations()
  const locale = useLocale()
  const monthNamesShort = useMonthNamesShort()
  const config = CURRENCY_CONFIG[currency]

  // Generate the 12-month sequence
  const monthSequence = generate12MonthSequence(endMonth)

  // Filter out future months
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const filteredSequence = monthSequence.filter(({ year, month }) => {
    if (year < currentYear) return true
    if (year === currentYear) return month <= currentMonth
    return false
  })

  // Transform data for the chart
  const chartData: ChartDataPoint[] = filteredSequence.map(({ year, month }) => {
    const data = monthlyData.find((m) => m.year === year && m.month === month)
    const value = currency === 'ARS' ? data?.totalArs : data?.totalUsd

    return {
      month: `${monthNamesShort[month - 1]} '${String(year).slice(-2)}`,
      monthNum: month,
      year,
      value: value || 0,
    }
  })

  const hasData = chartData.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
        <p className="text-sm text-gray-500">
          {t('charts.noDataForCurrency', { currency })}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">
        {t('charts.spendingTrend')}
      </h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={230}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient
              id={`gradient-${currency}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatCurrency(value, currency, locale)}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => [
              formatCurrency(value as number, currency, locale),
              currency,
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            fill={`url(#gradient-${currency})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
