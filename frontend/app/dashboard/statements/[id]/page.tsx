'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { statementsApi } from '@/lib/api'
import ExpenseTable from '@/components/ExpenseTable'
import StatementSummary from '@/components/StatementSummary'
import ConfirmationDialog from '@/components/ConfirmationDialog'

interface Statement {
  id: string
  originalFilename: string
  uploadDate: string
  statementDate: string | null
  dueDate: string | null
  status: string
  totalArs: number | null
  totalUsd: number | null
  errorMessage: string | null
  expenses: any[]
}

export default function StatementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [statement, setStatement] = useState<Statement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchStatement = async () => {
    try {
      const data = await statementsApi.getOne(params.id as string)
      setStatement(data)
    } catch (error) {
      console.error('Failed to fetch statement:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatement()
  }, [params.id])

  useEffect(() => {
    // Poll for updates while processing
    if (statement?.status === 'processing' || statement?.status === 'pending') {
      const interval = setInterval(fetchStatement, 3000)
      return () => clearInterval(interval)
    }
  }, [statement?.status])

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await statementsApi.delete(params.id as string)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete:', error)
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    const url = `${statementsApi.exportCsv(params.id as string)}?token=${token}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">Loading statement...</p>
      </div>
    )
  }

  if (!statement) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">Statement not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {statement.originalFilename}
            </h1>
            <p className="text-sm text-gray-500">
              {statement.status === 'completed' && (
                <span>{statement.expenses?.length || 0} expenses</span>
              )}
              {statement.status === 'processing' && (
                <span className="text-blue-600">Processing...</span>
              )}
              {statement.status === 'pending' && (
                <span className="text-amber-600">Queued</span>
              )}
              {statement.status === 'failed' && (
                <span className="text-red-600">Failed</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {statement.status === 'completed' && (
              <button
                onClick={handleExport}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={handleDeleteClick}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Status messages */}
        {statement.status === 'processing' && (
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-sm text-blue-700">
              Processing your statement... This may take a few moments.
            </p>
          </div>
        )}

        {statement.status === 'pending' && (
          <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-700">
              Statement is queued for processing...
            </p>
          </div>
        )}

        {statement.status === 'failed' && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              Processing failed: {statement.errorMessage || 'Unknown error'}
            </p>
          </div>
        )}

        {/* Summary */}
        {statement.status === 'completed' && (
          <div className="p-4">
            <StatementSummary
              totalArs={statement.totalArs}
              totalUsd={statement.totalUsd}
              dueDate={statement.dueDate}
              statementDate={statement.statementDate}
              expenses={statement.expenses}
            />
          </div>
        )}
      </div>

      {/* Expenses table */}
      {statement.status === 'completed' && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          </div>
          <div className="p-4">
            <ExpenseTable expenses={statement.expenses} />
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Statement"
        message={`Are you sure you want to delete "${statement.originalFilename}"? This will permanently remove all ${statement.expenses?.length || 0} expenses associated with this statement. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
