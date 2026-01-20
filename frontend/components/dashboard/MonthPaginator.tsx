'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import {
  EndMonth,
  MonthlyData,
  MONTH_SHORT_NAMES,
  formatDateRangeLabel,
} from '@/lib/types/dashboard'

interface MonthPaginatorProps {
  endMonth: EndMonth
  onEndMonthChange: (endMonth: EndMonth) => void
  totalArs?: number
  totalUsd?: number
  monthlyData?: MonthlyData[]
}

export function MonthPaginator({
  endMonth,
  onEndMonthChange,
  totalArs = 0,
  totalUsd = 0,
  monthlyData = [],
}: MonthPaginatorProps) {
  const now = new Date()
  const currentEndMonth: EndMonth = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }

  const minYear = 1990
  const canGoPrev = endMonth.year > minYear || endMonth.month > 1
  const canGoNext =
    endMonth.year < currentEndMonth.year ||
    (endMonth.year === currentEndMonth.year &&
      endMonth.month < currentEndMonth.month)

  const handlePrevMonth = () => {
    if (!canGoPrev) return
    let newMonth = endMonth.month - 1
    let newYear = endMonth.year
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    onEndMonthChange({ year: newYear, month: newMonth })
  }

  const handleNextMonth = () => {
    if (!canGoNext) return
    let newMonth = endMonth.month + 1
    let newYear = endMonth.year
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    onEndMonthChange({ year: newYear, month: newMonth })
  }

  const formattedArs = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(totalArs)

  const formattedUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(totalUsd)

  // Calculate monthly average based on months with data
  const monthsWithData = monthlyData.filter(
    (m) => m.statementCount > 0
  ).length
  const avgArs = monthsWithData > 0 ? totalArs / monthsWithData : 0
  const avgUsd = monthsWithData > 0 ? totalUsd / monthsWithData : 0

  const formattedAvgArs = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(avgArs)

  const formattedAvgUsd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(avgUsd)

  // Generate options for dropdown (last 5 years worth of months)
  const generateMonthOptions = (): EndMonth[] => {
    const options: EndMonth[] = []
    for (let y = currentEndMonth.year; y >= currentEndMonth.year - 5; y--) {
      const maxMonth = y === currentEndMonth.year ? currentEndMonth.month : 12
      const minMonth = y === minYear ? 1 : 1
      for (let m = maxMonth; m >= minMonth; m--) {
        options.push({ year: y, month: m })
      }
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left: Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
              canGoPrev
                ? 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center px-2">
            <select
              value={`${endMonth.year}-${endMonth.month}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number)
                onEndMonthChange({ year, month })
              }}
              className="cursor-pointer appearance-none bg-transparent text-xl font-bold text-white focus:outline-none"
            >
              {monthOptions.map((opt) => (
                <option
                  key={`${opt.year}-${opt.month}`}
                  value={`${opt.year}-${opt.month}`}
                  className="text-gray-900"
                >
                  {MONTH_SHORT_NAMES[opt.month - 1]} {opt.year}
                </option>
              ))}
            </select>
            <span className="text-xs text-white/70">
              {formatDateRangeLabel(endMonth)}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            disabled={!canGoNext}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
              canGoNext
                ? 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                : 'cursor-not-allowed bg-white/10 text-white/40'
            }`}
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Right: 12-Month total and average */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              Monthly Average
            </p>
            <p className="text-xl font-semibold text-white">
              {formattedAvgArs}
              {avgUsd > 0 && (
                <span className="ml-2 text-base text-emerald-200">
                  + {formattedAvgUsd}
                </span>
              )}
            </p>
            {monthsWithData > 0 && (
              <p className="text-xs text-white/50">
                Based on {monthsWithData} month{monthsWithData !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              12-Month Total
            </p>
            <p className="text-xl font-semibold text-white">
              {formattedArs}
              {totalUsd > 0 && (
                <span className="ml-2 text-base text-emerald-200">
                  + {formattedUsd}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
