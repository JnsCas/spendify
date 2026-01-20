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
    return <span className="ml-1">{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
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
        <select
          value={filterStatement}
          onChange={(e) => setFilterStatement(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statements</option>
          {statements.map(([id, filename]) => (
            <option key={id} value={id}>
              {filename}
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('source')}
              >
                Source <SortIcon field="source" />
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
                  {expense.card?.customName ||
                    expense.card?.lastFourDigits ||
                    '-'}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/dashboard/statements/${expense.statement.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <DocumentIcon className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">
                      {expense.statement.originalFilename}
                    </span>
                  </Link>
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
