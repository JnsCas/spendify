'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'
import { CardBreakdown } from '@/lib/types/dashboard'

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

const CURRENCY_CONFIG: Record<Currency, { locale: string }> = {
  ARS: { locale: 'es-AR' },
  USD: { locale: 'en-US' },
}

const formatCurrency = (value: number, currency: Currency) => {
  const config = CURRENCY_CONFIG[currency]
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

interface ChartDataPoint {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

export function CardBreakdownChart({ cardBreakdown, currency }: CardBreakdownChartProps) {
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
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">No {currency} card data</p>
      </div>
    )
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Spending by Card
      </h3>
      <ResponsiveContainer width="100%" height={250}>
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
              formatCurrency(value as number, currency),
              'Amount',
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <p className="text-sm text-gray-500">Total</p>
        <p className="text-xl font-bold text-gray-900">
          {formatCurrency(total, currency)}
        </p>
      </div>
    </div>
  )
}
