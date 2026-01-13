'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface YearPaginatorProps {
  currentYear: number
  minYear: number
  onYearChange: (year: number) => void
  totalArs?: number
  totalUsd?: number
}

export function YearPaginator({
  currentYear,
  minYear,
  onYearChange,
  totalArs = 0,
  totalUsd = 0,
}: YearPaginatorProps) {
  const currentCalendarYear = new Date().getFullYear()

  const maxYear = currentCalendarYear
  const canGoPrev = currentYear > minYear
  const canGoNext = currentYear < maxYear

  const handlePrevYear = () => {
    if (canGoPrev) {
      onYearChange(currentYear - 1)
    }
  }

  const handleNextYear = () => {
    if (canGoNext) {
      onYearChange(currentYear + 1)
    }
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

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center justify-between">
        {/* Left: Year navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevYear}
            disabled={!canGoPrev}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
              canGoPrev
                ? 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-600 active:scale-95'
                : 'cursor-not-allowed bg-gray-50 text-gray-300'
            }`}
            aria-label="Previous year"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center px-2">
            {maxYear - minYear + 1 > 1 ? (
              <select
                value={currentYear}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="cursor-pointer appearance-none bg-transparent text-2xl font-bold text-gray-900 focus:outline-none"
              >
                {Array.from(
                  { length: maxYear - minYear + 1 },
                  (_, i) => maxYear - i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-2xl font-bold text-gray-900">{currentYear}</span>
            )}
          </div>

          <button
            onClick={handleNextYear}
            disabled={!canGoNext}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
              canGoNext
                ? 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-600 active:scale-95'
                : 'cursor-not-allowed bg-gray-50 text-gray-300'
            }`}
            aria-label="Next year"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Year total */}
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Year Total</p>
          <p className="text-xl font-semibold text-gray-900">
            {formattedArs}
            {totalUsd > 0 && (
              <span className="ml-2 text-base text-gray-500">+ {formattedUsd}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
