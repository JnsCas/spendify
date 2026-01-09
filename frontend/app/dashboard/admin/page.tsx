'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { inviteCodesApi } from '@/lib/api'

interface InviteCode {
  id: string
  code: string
  status: 'available' | 'used'
  usedBy: { id: string; email: string; name: string } | null
  usedAt: string | null
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isAdmin, router])

  const fetchCodes = async () => {
    try {
      const data = await inviteCodesApi.getAll()
      setCodes(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invite codes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchCodes()
    }
  }, [isAdmin])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const newCode = await inviteCodesApi.generate()
      setCodes([newCode, ...codes])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate invite code')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) {
      return
    }
    try {
      await inviteCodesApi.delete(id)
      setCodes(codes.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete invite code')
    }
  }

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Invite Codes</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {generating ? 'Generating...' : 'Generate New Code'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No invite codes yet. Generate one to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {code.code}
                      </code>
                      <button
                        onClick={() => handleCopy(code.code, code.id)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy to clipboard"
                      >
                        {copiedId === code.id ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {code.status === 'available' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Used
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {code.usedBy ? (
                      <div>
                        <div className="font-medium text-gray-900">{code.usedBy.name}</div>
                        <div className="text-gray-500">{code.usedBy.email}</div>
                        {code.usedAt && (
                          <div className="text-xs text-gray-400">{formatDate(code.usedAt)}</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(code.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {code.status === 'available' && (
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
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
