'use client'

import { useState } from 'react'
import type { InstallmentDetail } from '@/lib/types/installments'

interface InstallmentsTableProps {
  installments: InstallmentDetail[]
}

type SortField = 'description' | 'monthlyAmount' | 'remainingAmount' | 'remainingMonths' | 'status'
type SortDirection = 'asc' | 'desc'

export function InstallmentsTable({ installments }: InstallmentsTableProps) {
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

  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Active
          </span>
        )
      case 'completing':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Completing
          </span>
        )
      default:
        return null
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
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

  if (installments.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
        <div className="mb-2 rounded-full bg-gray-100 p-3">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No installments found</p>
        <p className="text-xs text-gray-400">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              onClick={() => handleSort('description')}
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            >
              <div className="flex items-center">
                Description
                <SortIcon field="description" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Progress
            </th>
            <th
              onClick={() => handleSort('remainingAmount')}
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            >
              <div className="flex items-center">
                Remaining
                <SortIcon field="remainingAmount" />
              </div>
            </th>
            <th
              onClick={() => handleSort('remainingMonths')}
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            >
              <div className="flex items-center">
                Months Left
                <SortIcon field="remainingMonths" />
              </div>
            </th>
            <th
              onClick={() => handleSort('monthlyAmount')}
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            >
              <div className="flex items-center">
                Monthly Payment
                <SortIcon field="monthlyAmount" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Card
            </th>
            <th
              onClick={() => handleSort('status')}
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
            >
              <div className="flex items-center">
                Status
                <SortIcon field="status" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedInstallments.map((installment) => {
            const progress = (installment.currentInstallment / installment.totalInstallments) * 100

            return (
              <tr key={installment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {installment.description}
                  </div>
                  {installment.purchaseDate && (
                    <div className="text-xs text-gray-500">
                      {new Date(installment.purchaseDate).toLocaleDateString('es-AR')}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {installment.currentInstallment}/{installment.totalInstallments}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {installment.remainingAmountArs !== null && installment.remainingAmountArs > 0 && (
                      <div className="text-sm text-gray-600">
                        {formatCurrency(installment.remainingAmountArs, 'ARS')}
                      </div>
                    )}
                    {installment.remainingAmountUsd !== null && installment.remainingAmountUsd > 0 && (
                      <div className="text-sm text-gray-600">
                        {formatCurrency(installment.remainingAmountUsd, 'USD')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {installment.remainingMonths}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {installment.monthlyAmountArs !== null && installment.monthlyAmountArs > 0 && (
                      <div className="text-sm font-medium text-blue-600">
                        {formatCurrency(installment.monthlyAmountArs, 'ARS')}
                      </div>
                    )}
                    {installment.monthlyAmountUsd !== null && installment.monthlyAmountUsd > 0 && (
                      <div className="text-sm font-medium text-emerald-600">
                        {formatCurrency(installment.monthlyAmountUsd, 'USD')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {installment.card ? (
                    <div className="text-sm text-gray-900">
                      {installment.card.customName || `****${installment.card.lastFourDigits}`}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(installment.status)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
