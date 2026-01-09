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
    holderName: string | null
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
        const label = e.card.holderName || e.card.lastFourDigits || e.card.id
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
          aVal = a.card?.holderName || a.card?.lastFourDigits || ''
          bVal = b.card?.holderName || b.card?.lastFourDigits || ''
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
    <div>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterCard}
          onChange={(e) => setFilterCard(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cards</option>
          {cards.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('description')}
              >
                Description <SortIcon field="description" />
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amountArs')}
              >
                Amount (ARS) <SortIcon field="amountArs" />
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('amountUsd')}
              >
                Amount (USD) <SortIcon field="amountUsd" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Installments
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('card')}
              >
                Card <SortIcon field="card" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{expense.description}</td>
                <td className="px-6 py-4 text-right font-mono">
                  {expense.amountArs
                    ? `$${Number(expense.amountArs).toLocaleString()}`
                    : '-'}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  {expense.amountUsd
                    ? `US$${Number(expense.amountUsd).toLocaleString()}`
                    : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  {expense.currentInstallment && expense.totalInstallments
                    ? `${expense.currentInstallment}/${expense.totalInstallments}`
                    : '-'}
                </td>
                <td className="px-6 py-4">
                  {expense.card?.holderName ||
                    expense.card?.lastFourDigits ||
                    '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {sortedExpenses.length} of {expenses.length} expenses
      </div>
    </div>
  )
}
