'use client'

import { useState, useEffect, useMemo } from 'react'
import { installmentsApi } from '@/lib/api'
import type { InstallmentsResponse, InstallmentDetail } from '@/lib/types/installments'
import { InstallmentsSummaryCards } from '@/components/installments/InstallmentsSummaryCards'
import { InstallmentsTable } from '@/components/installments/InstallmentsTable'
import { InstallmentCard } from '@/components/installments/InstallmentCard'
import { InstallmentFilters } from '@/components/installments/InstallmentFilters'
import { useTranslations } from '@/lib/i18n'
import { formatDate } from '@/lib/format'

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

function formatMonth(monthStr: string, locale: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

function MonthFilter({
  availableMonths,
  selectedMonth,
  onMonthChange,
  t,
  locale,
}: {
  availableMonths: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
  t: (key: string) => string
  locale: string
}) {
  if (availableMonths.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-filter" className="text-sm text-gray-500">
        {t('installments.month')}:
      </label>
      <select
        id="month-filter"
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {availableMonths.map((month) => (
          <option key={month} value={month}>
            {formatMonth(month, locale)}
          </option>
        ))}
      </select>
    </div>
  )
}

function PageHeader({
  availableMonths,
  selectedMonth,
  onMonthChange,
  t,
  locale,
}: {
  availableMonths: string[]
  selectedMonth: string
  onMonthChange: (month: string) => void
  t: (key: string) => string
  locale: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{t('installments.title')}</h1>
        <p className="text-sm text-gray-500">{t('installments.subtitle')}</p>
      </div>
      <MonthFilter
        availableMonths={availableMonths}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        t={t}
        locale={locale}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-gray-100 bg-gray-50" />
      ))}
    </div>
  )
}

function EmptyState({
  hasAnyInstallments,
  selectedStatus,
  t,
}: {
  hasAnyInstallments: boolean
  selectedStatus: 'all' | 'active' | 'completing'
  t: (key: string) => string
}) {
  const getMessage = () => {
    if (!hasAnyInstallments) return t('installments.noInstallmentsYet')
    if (selectedStatus === 'all') return t('installments.noInstallmentsThisMonth')
    if (selectedStatus === 'active') return t('installments.noActiveInstallmentsThisMonth')
    return t('installments.noCompletingInstallmentsThisMonth')
  }

  const getSubMessage = () => {
    if (!hasAnyInstallments) return t('installments.importToGetStarted')
    return t('installments.tryDifferentMonth')
  }

  return (
    <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
      <div className="mb-2 rounded-full bg-gray-100 p-3">
        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500">{getMessage()}</p>
      <p className="text-xs text-gray-400">{getSubMessage()}</p>
    </div>
  )
}

function InstallmentsList({ installments }: { installments: InstallmentDetail[] }) {
  return (
    <>
      <div className="hidden md:block">
        <InstallmentsTable installments={installments} />
      </div>
      <div className="space-y-3 md:hidden">
        {installments.map((installment) => (
          <InstallmentCard key={installment.id} installment={installment} />
        ))}
      </div>
    </>
  )
}

export default function InstallmentsPage() {
  const t = useTranslations()
  const locale = t('_locale') as string
  const [data, setData] = useState<InstallmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completing'>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  const availableMonths = useMemo(() => {
    if (!data?.installments) return []
    const months = new Set(data.installments.map((i) => i.statementMonth))
    return Array.from(months).sort().reverse()
  }, [data?.installments])

  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0])
    }
  }, [availableMonths, selectedMonth])

  useEffect(() => {
    const fetchInstallments = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await installmentsApi.getAll()
        setData(response)
      } catch (err: any) {
        setError(err.response?.data?.message || t('installments.failedToLoad'))
      } finally {
        setLoading(false)
      }
    }

    fetchInstallments()
  }, [])

  const monthFilteredInstallments = useMemo(() => {
    if (!data?.installments || !selectedMonth) return []
    return data.installments.filter((installment) => installment.statementMonth === selectedMonth)
  }, [data?.installments, selectedMonth])

  const filteredInstallments = useMemo(() => {
    if (selectedStatus === 'all') return monthFilteredInstallments
    return monthFilteredInstallments.filter((installment) => installment.status === selectedStatus)
  }, [monthFilteredInstallments, selectedStatus])

  const calculatedSummary = useMemo(() => {
    if (monthFilteredInstallments.length === 0) {
      return {
        activeCount: 0,
        completingThisMonthArs: 0,
        totalRemainingUsd: 0,
        totalMonthlyPaymentArs: 0,
      }
    }

    const activeInstallments = monthFilteredInstallments.filter((i) => i.status === 'active')
    const completingInstallments = monthFilteredInstallments.filter((i) => i.status === 'completing')

    return {
      activeCount: monthFilteredInstallments.length, // Total includes both active and completing
      completingThisMonthArs: completingInstallments.reduce((sum, i) => sum + (i.monthlyAmountArs || 0), 0),
      totalRemainingUsd: activeInstallments.reduce((sum, i) => sum + (i.remainingAmountUsd || 0), 0),
      totalMonthlyPaymentArs: activeInstallments.reduce((sum, i) => sum + (i.monthlyAmountArs || 0), 0),
    }
  }, [monthFilteredInstallments])

  return (
    <div className="space-y-4">
      {error && <ErrorMessage message={error} />}

      <div className="rounded-lg border border-gray-200 bg-white">
        <PageHeader
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          t={t}
          locale={locale}
        />

        <div className="p-4">
          <InstallmentsSummaryCards summary={calculatedSummary} loading={loading} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('installments.allInstallments')}</h2>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <InstallmentFilters selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : filteredInstallments.length === 0 ? (
            <EmptyState
              hasAnyInstallments={(data?.installments.length ?? 0) > 0}
              selectedStatus={selectedStatus}
              t={t}
            />
          ) : (
            <InstallmentsList installments={filteredInstallments} />
          )}
        </div>
      </div>
    </div>
  )
}
