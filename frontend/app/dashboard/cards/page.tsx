'use client'

import { useState, useEffect } from 'react'
import { cardsApi } from '@/lib/api'
import type { Card } from '@/lib/types/card'

export default function CardsPage() {
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
      setError(err.response?.data?.message || 'Failed to load cards')
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
      setError(err.response?.data?.message || 'Failed to update card')
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Cards</h1>
        <p className="text-gray-600 mt-1">
          Manage your card display names. These names appear in your dashboard charts.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No cards yet. Cards are automatically created when you import statements.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last 4 Digits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Custom Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {card.lastFourDigits ? (
                      <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {card.lastFourDigits}
                      </code>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === card.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, card.id)}
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter custom name"
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium text-gray-900">
                        {getDisplayName(card)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === card.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(card.id)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(card)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
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
