'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { statementsApi } from '@/lib/api'
import FileUpload from '@/components/FileUpload'

interface Statement {
  id: string
  originalFilename: string
  uploadDate: string
  status: string
  totalArs: number | null
  totalUsd: number | null
  dueDate: string | null
}

export default function DashboardPage() {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStatements = async () => {
    try {
      const data = await statementsApi.getAll()
      setStatements(data)
    } catch (error) {
      console.error('Failed to fetch statements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatements()
  }, [])

  const handleUploadSuccess = () => {
    fetchStatements()
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Statements</h1>
      </div>

      <div className="mb-8">
        <FileUpload onSuccess={handleUploadSuccess} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : statements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No statements yet. Upload your first credit card statement above.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total ARS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total USD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {statements.map((statement) => (
                <tr key={statement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statement.originalFilename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(statement.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(statement.status)}`}
                    >
                      {statement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statement.totalArs
                      ? `$${Number(statement.totalArs).toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statement.totalUsd
                      ? `US$${Number(statement.totalUsd).toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/statements/${statement.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
