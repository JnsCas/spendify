'use client'

import { useState, useEffect } from 'react'
import { cardsApi } from '@/lib/api'
import type { Card } from '@/lib/types/card'
import { useTranslations } from '@/lib/i18n'

export default function CardsPage() {
  const t = useTranslations()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCards = async () => {
    try {
      const data = await cardsApi.getAll()
      setCards(data)
    } catch (err: any) {
      setError(err.response?.data?.message || t('cards.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleEdit = (card: Card) => {
    setEditingId(card.id)
    setEditValue(card.customName || '')
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (cardId: string) => {
    setSaving(true)
    setError('')
    try {
      const updated = await cardsApi.update(cardId, { customName: editValue || undefined })
      setCards(cards.map((c) => (c.id === cardId ? updated : c)))
      setEditingId(null)
      setEditValue('')
    } catch (err: any) {
      setError(err.response?.data?.message || t('cards.failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, cardId: string) => {
    if (e.key === 'Enter') {
      handleSave(cardId)
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const getDisplayName = (card: Card): string => {
    if (card.customName) return card.customName
    return card.lastFourDigits || '-'
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
        <div className="border-b border-gray-100 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{t('cards.title')}</h1>
          <p className="text-sm text-gray-500">
            {t('cards.subtitle')}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
                />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
              <div className="mb-2 rounded-full bg-gray-100 p-3">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">{t('cards.noCardsYet')}</p>
              <p className="text-xs text-gray-400">{t('cards.cardsAppearAfterImport')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Card Icon */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>

                      {/* Card Info */}
                      <div>
                        {editingId === card.id ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, card.id)}
                            className="w-48 rounded-md border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={t('cards.enterCustomName')}
                            autoFocus
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {card.customName || (
                              <span className="text-gray-400">{t('cards.noCustomName')}</span>
                            )}
                          </p>
                        )}
                        {card.lastFourDigits && (
                          <p className="text-xs text-gray-500">
                            <span className="font-mono">****{card.lastFourDigits}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {editingId === card.id ? (
                        <>
                          <button
                            onClick={() => handleSave(card.id)}
                            disabled={saving}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {saving ? t('cards.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                          >
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEdit(card)}
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          {t('cards.edit')}
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
