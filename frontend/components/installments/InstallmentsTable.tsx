'use client'

import { useState } from 'react'
import type { InstallmentDetail, InstallmentCard as CardType } from '@/lib/types/installments'
import { formatCurrency } from '@/lib/utils/currency'
import { useTranslations } from '@/lib/i18n'

interface InstallmentsTableProps {
  installments: InstallmentDetail[]
}

type SortField = 'description' | 'monthlyAmount' | 'remainingAmount' | 'remainingMonths' | 'status'
type SortDirection = 'asc' | 'desc'

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {t('installments.status.active')}
        </span>
      )
    case 'completing':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          {t('installments.status.completing')}
        </span>
      )
    default:
      return null
  }
}

function SortIcon({
  field,
  currentSortField,
  sortDirection,
}: {
  field: SortField
  currentSortField: SortField
  sortDirection: SortDirection
}) {
  if (currentSortField !== field) {
    return (
      <svg className="ml-1 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  return sortDirection === 'asc' ? (
    <svg className="ml-1 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="ml-1 h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
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
      <p className="text-sm text-gray-500">{t('installments.noInstallmentsFound')}</p>
      <p className="text-xs text-gray-400">{t('installments.tryAdjustingFilters')}</p>
    </div>
  )
}

function SortableHeader({
  label,
  field,
  onSort,
  currentSortField,
  sortDirection,
}: {
  label: string
  field: SortField
  onSort: (field: SortField) => void
  currentSortField: SortField
  sortDirection: SortDirection
}) {
  return (
    <th
      onClick={() => onSort(field)}
      className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
    >
      <div className="flex items-center">
        {label}
        <SortIcon field={field} currentSortField={currentSortField} sortDirection={sortDirection} />
      </div>
    </th>
  )
}

function ProgressCell({ current, total }: { current: number; total: number }) {
  const progress = (current / total) * 100

  return (
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-gray-500">
          {current}/{total}
        </span>
      </div>
    </td>
  )
}

function AmountCell({
  arsAmount,
  usdAmount,
  variant = 'default',
}: {
  arsAmount: number | null
  usdAmount: number | null
  variant?: 'default' | 'monthly'
}) {
  const arsColorClass = variant === 'monthly' ? 'text-blue-600 font-medium' : 'text-gray-600'
  const usdColorClass = variant === 'monthly' ? 'text-emerald-600 font-medium' : 'text-gray-600'

  return (
    <td className="px-6 py-4">
      <div className="space-y-1">
        {arsAmount !== null && arsAmount > 0 && (
          <div className={`text-sm ${arsColorClass}`}>{formatCurrency(arsAmount, 'ARS')}</div>
        )}
        {usdAmount !== null && usdAmount > 0 && (
          <div className={`text-sm ${usdColorClass}`}>{formatCurrency(usdAmount, 'USD')}</div>
        )}
      </div>
    </td>
  )
}

function DescriptionCell({ description, purchaseDate, locale }: { description: string; purchaseDate: string | null; locale: string }) {
  return (
    <td className="px-6 py-4">
      <div className="text-sm font-medium text-gray-900">{description}</div>
      {purchaseDate && (
        <div className="text-xs text-gray-500">{new Date(purchaseDate).toLocaleDateString(locale)}</div>
      )}
    </td>
  )
}

function CardCell({ card }: { card: CardType | null }) {
  return (
    <td className="px-6 py-4">
      {card ? (
        <div className="text-sm text-gray-900">{card.customName || `****${card.lastFourDigits || '0000'}`}</div>
      ) : (
        <span className="text-sm text-gray-400">-</span>
      )}
    </td>
  )
}

function InstallmentRow({ installment, t, locale }: { installment: InstallmentDetail; t: (key: string) => string; locale: string }) {
  return (
    <tr className="hover:bg-gray-50">
      <DescriptionCell description={installment.description} purchaseDate={installment.purchaseDate} locale={locale} />
      <ProgressCell current={installment.currentInstallment} total={installment.totalInstallments} />
      <AmountCell arsAmount={installment.remainingAmountArs} usdAmount={installment.remainingAmountUsd} />
      <td className="px-6 py-4 text-sm text-gray-900">{installment.remainingMonths}</td>
      <AmountCell
        arsAmount={installment.monthlyAmountArs}
        usdAmount={installment.monthlyAmountUsd}
        variant="monthly"
      />
      <CardCell card={installment.card} />
      <td className="px-6 py-4">
        <StatusBadge status={installment.status} t={t} />
      </td>
    </tr>
  )
}

export function InstallmentsTable({ installments }: InstallmentsTableProps) {
  const t = useTranslations()
  const locale = t('_locale') as string
  const [sortField, setSortField] = useState<SortField>('remainingMonths')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedInstallments = [...installments].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'description':
        aValue = a.description.toLowerCase()
        bValue = b.description.toLowerCase()
        break
      case 'monthlyAmount':
        aValue = (a.monthlyAmountArs || 0) + (a.monthlyAmountUsd || 0)
        bValue = (b.monthlyAmountArs || 0) + (b.monthlyAmountUsd || 0)
        break
      case 'remainingAmount':
        aValue = (a.remainingAmountArs || 0) + (a.remainingAmountUsd || 0)
        bValue = (b.remainingAmountArs || 0) + (b.remainingAmountUsd || 0)
        break
      case 'remainingMonths':
        aValue = a.remainingMonths
        bValue = b.remainingMonths
        break
      case 'status':
        aValue = a.status
        bValue = b.status
        break
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (installments.length === 0) {
    return <EmptyState t={t} />
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortableHeader
              label={t('installments.table.description')}
              field="description"
              onSort={handleSort}
              currentSortField={sortField}
              sortDirection={sortDirection}
            />
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t('installments.table.progress')}
            </th>
            <SortableHeader
              label={t('installments.table.remaining')}
              field="remainingAmount"
              onSort={handleSort}
              currentSortField={sortField}
              sortDirection={sortDirection}
            />
            <SortableHeader
              label={t('installments.table.monthsLeft')}
              field="remainingMonths"
              onSort={handleSort}
              currentSortField={sortField}
              sortDirection={sortDirection}
            />
            <SortableHeader
              label={t('installments.table.monthlyPayment')}
              field="monthlyAmount"
              onSort={handleSort}
              currentSortField={sortField}
              sortDirection={sortDirection}
            />
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              {t('installments.table.card')}
            </th>
            <SortableHeader
              label={t('installments.table.status')}
              field="status"
              onSort={handleSort}
              currentSortField={sortField}
              sortDirection={sortDirection}
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedInstallments.map((installment) => (
            <InstallmentRow key={installment.id} installment={installment} t={t} locale={locale} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
