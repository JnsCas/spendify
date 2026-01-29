'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { inviteCodesApi } from '@/lib/api'
import { useTranslations, useLocale } from '@/lib/i18n'
import { formatDate } from '@/lib/format'

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
  const t = useTranslations()
  const locale = useLocale()
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
      setError(err.response?.data?.message || t('admin.failedToLoad'))
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
      setError(err.response?.data?.message || t('admin.failedToGenerate'))
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.deleteConfirm'))) {
      return
    }
    try {
      await inviteCodesApi.delete(id)
      setCodes(codes.filter((c) => c.id !== id))
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin.failedToDelete'))
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

  if (!isAdmin) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">{t('admin.checkingPermissions')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{t('admin.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin.subtitle')}</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? t('admin.generating') : t('admin.generateCode')}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
                />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">{t('admin.noCodesYet')}</p>
              <p className="text-xs text-gray-400">{t('admin.generateToStart')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    code.status === 'available'
                      ? 'border-emerald-100 bg-emerald-50/30'
                      : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Code */}
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-white px-2 py-1 font-mono text-sm text-gray-900 ring-1 ring-gray-200">
                          {code.code}
                        </code>
                        <button
                          onClick={() => handleCopy(code.code, code.id)}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-600"
                          title={t('admin.copyToClipboard')}
                        >
                          {copiedId === code.id ? (
                            <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Status */}
                      {code.status === 'available' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {t('admin.available')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {t('admin.used')}
                        </span>
                      )}
                    </div>

                    {/* Right side info */}
                    <div className="flex items-center gap-4">
                      {code.usedBy ? (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{code.usedBy.name}</p>
                          <p className="text-xs text-gray-500">{code.usedBy.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {t('admin.created', { date: formatDate(code.createdAt, locale) })}
                        </span>
                      )}

                      {code.status === 'available' && (
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          {t('admin.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
