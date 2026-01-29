'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { CardBreakdown } from '@/lib/types/dashboard'
import { useTranslations, useLocale } from '@/lib/i18n'
import { formatCurrency } from '@/lib/format'

type Currency = 'ARS' | 'USD'

interface CardBreakdownChartProps {
  cardBreakdown: CardBreakdown[]
  currency: Currency
}

// Color palette for cards
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

interface ChartDataPoint {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export function CardBreakdownChart({ cardBreakdown, currency }: CardBreakdownChartProps) {
  const t = useTranslations()
  const locale = useLocale()
  // Transform data for the chart - filter out cards with no spending
  const chartData: ChartDataPoint[] = cardBreakdown
    .map((card, index) => {
      const getDisplayName = () => {
        if (card.customName) {
          return card.customName
        }
        return card.lastFourDigits || 'Fee/Taxes'
      }

      return {
        name: getDisplayName(),
        value: currency === 'ARS' ? card.totalArs : card.totalUsd,
        color: COLORS[index % COLORS.length]
      }
    })
    .filter((d) => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
        <p className="text-sm text-gray-500">
          {t('charts.noCardDataForCurrency', { currency })}
        </p>
      </div>
    )
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">
        {t('charts.spendingByCard')}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value) => [
              formatCurrency(value as number, currency, locale),
              t('dashboard.amount'),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-500">{t('charts.total')}</p>
        <p className="text-xl font-bold text-gray-900">
          {formatCurrency(total, currency, locale)}
        </p>
      </div>
    </div>
  )
}
