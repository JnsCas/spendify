'use client'

import { useState, useMemo } from 'react'

interface Expense {
  id: string
  description: string
  amountArs: number | null
  amountUsd: number | null
  currentInstallment: number | null
  totalInstallments: number | null
  purchaseDate: string | null
  card: {
    id: string
    customName: string | null
    lastFourDigits: string | null
  } | null
}

interface ExpenseTableProps {
  expenses: Expense[]
}

type SortField = 'description' | 'amountArs' | 'amountUsd' | 'card'
type SortDirection = 'asc' | 'desc'

export default function ExpenseTable({ expenses }: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>('description')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterCard, setFilterCard] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const cards = useMemo(() => {
    const uniqueCards = new Map<string, string>()
    let hasNoCard = false
    expenses.forEach((e) => {
      if (e.card) {
        const label = e.card.customName || e.card.lastFourDigits || e.card.id
        uniqueCards.set(e.card.id, label)
      } else {
        hasNoCard = true
      }
    })
    const cardEntries = Array.from(uniqueCards.entries())
    if (hasNoCard) {
      cardEntries.push(['no-card', 'No Card (Taxes/Fees)'])
    }
    return cardEntries
  }, [expenses])

  const sortedExpenses = useMemo(() => {
    let filtered = [...expenses]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((e) =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by card
    if (filterCard) {
      if (filterCard === 'no-card') {
        filtered = filtered.filter((e) => !e.card)
      } else {
        filtered = filtered.filter((e) => e.card?.id === filterCard)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'description':
          aVal = a.description
          bVal = b.description
          break
        case 'amountArs':
          aVal = Number(a.amountArs) || 0
          bVal = Number(b.amountArs) || 0
          break
        case 'amountUsd':
          aVal = Number(a.amountUsd) || 0
          bVal = Number(b.amountUsd) || 0
          break
        case 'card':
          aVal = a.card?.customName || a.card?.lastFourDigits || ''
          bVal = b.card?.customName || b.card?.lastFourDigits || ''
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [expenses, sortField, sortDirection, filterCard, searchTerm])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        {/* Card filter pills */}
        {cards.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterCard('')}
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                filterCard === ''
                  ? 'bg-gray-700 text-white ring-gray-700/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {cards.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilterCard(id)}
                className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                  filterCard === id
                    ? 'bg-blue-600 text-white ring-blue-600/20'
                    : 'bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Description <SortIcon field="description" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('amountArs')}
              >
                ARS <SortIcon field="amountArs" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('amountUsd')}
              >
                USD <SortIcon field="amountUsd" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                Installments
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('card')}
              >
                Card <SortIcon field="card" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {expense.description}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-blue-600">
                  {expense.amountArs
                    ? `$${Number(expense.amountArs).toLocaleString()}`
                    : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-emerald-600">
                  {expense.amountUsd
                    ? `US$${Number(expense.amountUsd).toLocaleString()}`
                    : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {expense.currentInstallment && expense.totalInstallments ? (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {expense.currentInstallment}/{expense.totalInstallments}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {expense.card?.customName ||
                    expense.card?.lastFourDigits ||
                    <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400">
        Showing {sortedExpenses.length} of {expenses.length} expenses
      </p>
    </div>
  )
}
