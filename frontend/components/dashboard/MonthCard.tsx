'use client'

import { useState } from 'react'
import { PlusIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { MONTH_NAMES, Statement } from '@/lib/types/dashboard'
import FileUpload from '@/components/FileUpload'

interface MonthCardProps {
  month: number
  year: number
  totalArs: number
  totalUsd: number
  statementCount: number
  statements: Statement[]
  onStatementClick: (id: string) => void
  onUploadSuccess: () => void
}

const formatCurrency = (value: number, currency: 'ARS' | 'USD') => {
  if (currency === 'ARS') {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function MonthCard({
  month,
  year,
  totalArs,
  totalUsd,
  statementCount,
  statements,
  onStatementClick,
  onUploadSuccess,
}: MonthCardProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const monthName = MONTH_NAMES[month - 1]
  const hasStatements = statementCount > 0

  const handleUploadSuccess = () => {
    setShowUpload(false)
    onUploadSuccess()
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* Header */}
      <div
        className={`cursor-pointer border-b border-gray-100 px-4 py-3 ${
          hasStatements ? 'bg-blue-50' : 'bg-gray-50'
        }`}
        onClick={() => hasStatements && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{monthName}</h3>
          <span className="text-xs text-gray-500">
            {statementCount} {statementCount === 1 ? 'statement' : 'statements'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {hasStatements ? (
          <>
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ARS</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totalArs, 'ARS')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">USD</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(totalUsd, 'USD')}
                </span>
              </div>
            </div>

            {/* Expanded statement list */}
            {expanded && statements.length > 0 && (
              <div className="mb-3 space-y-2 border-t border-gray-100 pt-3">
                {statements.map((statement) => (
                  <button
                    key={statement.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatementClick(statement.id)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{statement.originalFilename}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mb-3 text-center text-sm text-gray-400">
            No statements yet
          </p>
        )}

        {/* Upload section */}
        {showUpload ? (
          <div className="border-t border-gray-100 pt-3">
            <FileUpload onSuccess={handleUploadSuccess} />
            <button
              onClick={() => setShowUpload(false)}
              className="mt-2 w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUpload(true)}
            className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Upload</span>
          </button>
        )}
      </div>
    </div>
  )
}
