'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { statementsApi } from '@/lib/api'
import ExpenseTable from '@/components/ExpenseTable'
import StatementSummary from '@/components/StatementSummary'

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
  const [reprocessing, setReprocessing] = useState(false)

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

  const handleReprocess = async () => {
    setReprocessing(true)
    try {
      await statementsApi.reprocess(params.id as string)
      fetchStatement()
    } catch (error) {
      console.error('Failed to reprocess:', error)
    } finally {
      setReprocessing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this statement?')) return

    try {
      await statementsApi.delete(params.id as string)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    const url = `${statementsApi.exportCsv(params.id as string)}?token=${token}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!statement) {
    return <div className="text-center py-8">Statement not found</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">{statement.originalFilename}</h1>
        </div>
        <div className="flex gap-2">
          {statement.status === 'completed' && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Export CSV
            </button>
          )}
          <button
            onClick={handleReprocess}
            disabled={reprocessing || statement.status === 'processing'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {reprocessing ? 'Reprocessing...' : 'Reprocess'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>

      {statement.status === 'processing' && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
          Processing your statement... This may take a few minutes.
        </div>
      )}

      {statement.status === 'pending' && (
        <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          Statement is queued for processing...
        </div>
      )}

      {statement.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
          Processing failed: {statement.errorMessage || 'Unknown error'}
        </div>
      )}

      {statement.status === 'completed' && (
        <>
          <StatementSummary
            totalArs={statement.totalArs}
            totalUsd={statement.totalUsd}
            dueDate={statement.dueDate}
            statementDate={statement.statementDate}
            expenses={statement.expenses}
          />

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Expenses</h2>
            <ExpenseTable expenses={statement.expenses} />
          </div>
        </>
      )}
    </div>
  )
}
