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
import { MONTH_SHORT_NAMES, MonthlyData } from '@/lib/types/dashboard'

type Currency = 'ARS' | 'USD'

interface SpendingTrendChartProps {
  monthlyData: MonthlyData[]
  currentYear: number
  currency: Currency
}

interface ChartDataPoint {
  month: string
  monthNum: number
  value: number
}

const CURRENCY_CONFIG: Record<Currency, { color: string; label: string; locale: string }> = {
  ARS: { color: '#3b82f6', label: 'Argentine Peso', locale: 'es-AR' },
  USD: { color: '#10b981', label: 'US Dollar', locale: 'en-US' },
}

const formatCurrency = (value: number, currency: Currency) => {
  const config = CURRENCY_CONFIG[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function SpendingTrendChart({
  monthlyData,
  currentYear,
  currency,
}: SpendingTrendChartProps) {
  const config = CURRENCY_CONFIG[currency]

  // Get current month for limiting display in current year
  const now = new Date()
  const isCurrentYear = currentYear === now.getFullYear()
  const maxMonth = isCurrentYear ? now.getMonth() + 1 : 12

  // Transform data for the chart - fill in missing months with 0
  const chartData: ChartDataPoint[] = []
  for (let month = 1; month <= maxMonth; month++) {
    const monthData = monthlyData.find((m) => m.month === month)
    const value = currency === 'ARS' ? monthData?.totalArs : monthData?.totalUsd
    chartData.push({
      month: MONTH_SHORT_NAMES[month - 1],
      monthNum: month,
      value: value || 0,
    })
  }

  const hasData = chartData.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">No {currency} spending data</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Spending Trend
      </h3>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id={`gradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={(value) => formatCurrency(value, currency)}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => [formatCurrency(value as number, currency), currency]}
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
