'use client'

import { useState, useEffect } from 'react'
import { installmentsApi } from '@/lib/api'
import type { InstallmentsResponse, InstallmentDetail } from '@/lib/types/installments'
import { InstallmentsSummaryCards } from '@/components/installments/InstallmentsSummaryCards'
import { InstallmentsTable } from '@/components/installments/InstallmentsTable'
import { InstallmentCard } from '@/components/installments/InstallmentCard'
import { InstallmentFilters } from '@/components/installments/InstallmentFilters'

export default function InstallmentsPage() {
  const [data, setData] = useState<InstallmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completing'>('all')

  const fetchInstallments = async (status?: 'active' | 'completing') => {
    setLoading(true)
    setError('')
    try {
      const response = await installmentsApi.getAll(status)
      setData(response)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load installments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstallments(selectedStatus === 'all' ? undefined : selectedStatus)
  }, [selectedStatus])

  const handleStatusChange = (status: 'all' | 'active' | 'completing') => {
    setSelectedStatus(status)
  }

  const filteredInstallments: InstallmentDetail[] = data?.installments || []

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Installments</h1>
          <p className="text-sm text-gray-500">
            Track your ongoing payment commitments
          </p>
        </div>

        <div className="p-4">
          <InstallmentsSummaryCards
            summary={data?.summary || {
              activeCount: 0,
              completingThisMonthCount: 0,
              totalRemainingArs: 0,
              totalRemainingUsd: 0,
            }}
            loading={loading}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900">All Installments</h2>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <InstallmentFilters
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
                />
              ))}
            </div>
          ) : filteredInstallments.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
              <div className="mb-2 rounded-full bg-gray-100 p-3">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                {selectedStatus === 'all'
                  ? 'No installment purchases yet'
                  : selectedStatus === 'active'
                  ? 'No active installments'
                  : 'No installments completing this month'}
              </p>
              <p className="text-xs text-gray-400">
                {selectedStatus === 'all'
                  ? 'Import statements with installment purchases to get started'
                  : 'All caught up!'}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <InstallmentsTable installments={filteredInstallments} />
              </div>
              <div className="space-y-3 md:hidden">
                {filteredInstallments.map((installment) => (
                  <InstallmentCard key={installment.id} installment={installment} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
