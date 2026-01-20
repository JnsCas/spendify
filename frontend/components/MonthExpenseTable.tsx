'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { DocumentIcon } from '@heroicons/react/24/outline'
import type { MonthExpense } from '@/lib/types/expense'

interface MonthExpenseTableProps {
  expenses: MonthExpense[]
}

type SortField = 'description' | 'amountArs' | 'amountUsd' | 'card' | 'source'
type SortDirection = 'asc' | 'desc'

export default function MonthExpenseTable({ expenses }: MonthExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>('description')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterCard, setFilterCard] = useState<string>('')
  const [filterStatement, setFilterStatement] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const cards = useMemo(() => {
    const uniqueCards = new Map<string, string>()
    let hasNoCard = false
    expenses.forEach((e) => {
      if (e.card) {
        const label = e.card.customName || e.card.lastFourDigits || e.card.id || 'Unknown'
        uniqueCards.set(e.card.id || 'unknown', label)
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

  const statements = useMemo(() => {
    const uniqueStatements = new Map<string, string>()
    expenses.forEach((e) => {
      uniqueStatements.set(e.statement.id, e.statement.originalFilename)
    })
    return Array.from(uniqueStatements.entries())
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

    // Filter by statement
    if (filterStatement) {
      filtered = filtered.filter((e) => e.statement.id === filterStatement)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

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
        case 'source':
          aVal = a.statement.originalFilename
          bVal = b.statement.originalFilename
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [expenses, sortField, sortDirection, filterCard, filterStatement, searchTerm])

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
      <div className="space-y-3">
        {/* Card filter pills - own row */}
        {cards.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterCard('')}
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                filterCard === ''
                  ? 'bg-gray-700 text-white ring-gray-700/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
              }`}
            >
              All Cards
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

        {/* Statement filter pills - own row, only show if multiple statements */}
        {statements.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatement('')}
              className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                filterStatement === ''
                  ? 'bg-gray-700 text-white ring-gray-700/20'
                  : 'bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100'
              }`}
            >
              All Statements
            </button>
            {statements.map(([id, filename]) => (
              <button
                key={id}
                onClick={() => setFilterStatement(id)}
                className={`rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all ${
                  filterStatement === id
                    ? 'bg-emerald-600 text-white ring-emerald-600/20'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100'
                }`}
                title={filename}
              >
                {filename}
              </button>
            ))}
          </div>
        )}

        {/* Search input - own row */}
        <div>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
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
              <th
                className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:bg-gray-100"
                onClick={() => handleSort('source')}
              >
                Source <SortIcon field="source" />
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
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/statements/${expense.statement.id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                  >
                    <DocumentIcon className="h-4 w-4" />
                    <span className="truncate max-w-[150px]">
                      {expense.statement.originalFilename}
                    </span>
                  </Link>
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
