'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface YearPaginatorProps {
  currentYear: number
  availableYears: number[]
  onYearChange: (year: number) => void
}

export function YearPaginator({
  currentYear,
  availableYears,
  onYearChange,
}: YearPaginatorProps) {
  const currentCalendarYear = new Date().getFullYear()

  // Determine the range of years we can navigate to
  const minYear = availableYears.length > 0 ? Math.min(...availableYears) : currentYear
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

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={handlePrevYear}
        disabled={!canGoPrev}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          canGoPrev
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'cursor-not-allowed bg-gray-50 text-gray-300'
        }`}
        aria-label="Previous year"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2">
        <span className="text-3xl font-bold text-gray-900">{currentYear}</span>
        {availableYears.length > 1 && (
          <select
            value={currentYear}
            onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
            className="ml-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {/* Show all years from min to current calendar year */}
            {Array.from(
              { length: maxYear - minYear + 1 },
              (_, i) => maxYear - i
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={handleNextYear}
        disabled={!canGoNext}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          canGoNext
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'cursor-not-allowed bg-gray-50 text-gray-300'
        }`}
        aria-label="Next year"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
