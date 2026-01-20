/**
 * ExpenseTable Component Tests
 *
 * Tests the expense table's core functionality: sorting, filtering, and display.
 * These are critical features for users to analyze their expenses.
 */

import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExpenseTable from '@/components/ExpenseTable'

const mockExpenses = [
  {
    id: '1',
    description: 'Amazon Purchase',
    amountArs: 10000,
    amountUsd: 100,
    currentInstallment: 1,
    totalInstallments: 3,
    purchaseDate: '2024-01-15',
    card: {
      id: 'card-1',
      customName: 'John Doe',
      lastFourDigits: '1234',
    },
  },
  {
    id: '2',
    description: 'Netflix Subscription',
    amountArs: 5000,
    amountUsd: null,
    currentInstallment: null,
    totalInstallments: null,
    purchaseDate: '2024-01-20',
    card: {
      id: 'card-2',
      customName: 'Jane Smith',
      lastFourDigits: '5678',
    },
  },
  {
    id: '3',
    description: 'Service Tax',
    amountArs: 2000,
    amountUsd: null,
    currentInstallment: null,
    totalInstallments: null,
    purchaseDate: '2024-01-25',
    card: null,
  },
  {
    id: '4',
    description: 'Grocery Store',
    amountArs: 15000,
    amountUsd: 150,
    currentInstallment: null,
    totalInstallments: null,
    purchaseDate: '2024-01-10',
    card: {
      id: 'card-1',
      customName: 'John Doe',
      lastFourDigits: '1234',
    },
  },
]

describe('ExpenseTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render all expenses', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      expect(screen.getByText('Amazon Purchase')).toBeInTheDocument()
      expect(screen.getByText('Netflix Subscription')).toBeInTheDocument()
      expect(screen.getByText('Service Tax')).toBeInTheDocument()
      expect(screen.getByText('Grocery Store')).toBeInTheDocument()
      expect(screen.getByText('Showing 4 of 4 expenses')).toBeInTheDocument()
    })

    it('should handle empty expenses gracefully', () => {
      render(<ExpenseTable expenses={[]} />)

      expect(screen.getByText('Showing 0 of 0 expenses')).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by description ascending by default', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      const rows = screen.getAllByRole('row')
      // First data row (skip header)
      expect(within(rows[1]).getByText('Amazon Purchase')).toBeInTheDocument()
    })

    it('should toggle sort direction when clicking same column', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const headers = screen.getAllByRole('columnheader')
      const descHeader = headers.find((h) => h.textContent?.includes('Description'))!

      // Initially ascending
      expect(within(descHeader).getByText('↑')).toBeInTheDocument()

      // Click to descending
      await user.click(descHeader)
      await waitFor(() => {
        expect(within(descHeader).getByText('↓')).toBeInTheDocument()
      })

      // Click back to ascending
      await user.click(descHeader)
      await waitFor(() => {
        expect(within(descHeader).getByText('↑')).toBeInTheDocument()
      })
    })

    it('should sort by amount correctly', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const headers = screen.getAllByRole('columnheader')
      const amountHeader = headers.find((h) => h.textContent?.includes('ARS'))!

      await user.click(amountHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        const firstRow = within(rows[1]).getAllByRole('cell')
        // Lowest amount first: Service Tax ($2,000)
        expect(firstRow[0]).toHaveTextContent('Service Tax')
      })
    })

    it('should sort by card name', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const headers = screen.getAllByRole('columnheader')
      const cardHeader = headers.find((h) => h.textContent?.includes('Card'))!

      await user.click(cardHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // No card should come first (Service Tax)
        expect(within(rows[1]).getByText('Service Tax')).toBeInTheDocument()
      })
    })
  })

  describe('Search Filtering', () => {
    it('should filter expenses by search term', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const searchInput = screen.getByPlaceholderText('Search expenses...')
      await user.type(searchInput, 'amazon')

      await waitFor(() => {
        expect(screen.getByText('Amazon Purchase')).toBeInTheDocument()
        expect(screen.queryByText('Netflix Subscription')).not.toBeInTheDocument()
        expect(screen.getByText('Showing 1 of 4 expenses')).toBeInTheDocument()
      })
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const searchInput = screen.getByPlaceholderText('Search expenses...')
      await user.type(searchInput, 'NETFLIX')

      await waitFor(() => {
        expect(screen.getByText('Netflix Subscription')).toBeInTheDocument()
        expect(screen.queryByText('Amazon Purchase')).not.toBeInTheDocument()
      })
    })
  })

  describe('Card Filtering', () => {
    it('should filter expenses by card', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const cardButton = screen.getByRole('button', { name: 'John Doe' })
      await user.click(cardButton)

      await waitFor(() => {
        expect(screen.getByText('Amazon Purchase')).toBeInTheDocument()
        expect(screen.getByText('Grocery Store')).toBeInTheDocument()
        expect(screen.queryByText('Netflix Subscription')).not.toBeInTheDocument()
        expect(screen.getByText('Showing 2 of 4 expenses')).toBeInTheDocument()
      })
    })

    it('should filter expenses with no card', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const noCardButton = screen.getByRole('button', { name: 'No Card (Taxes/Fees)' })
      await user.click(noCardButton)

      await waitFor(() => {
        expect(screen.getByText('Service Tax')).toBeInTheDocument()
        expect(screen.queryByText('Amazon Purchase')).not.toBeInTheDocument()
        expect(screen.getByText('Showing 1 of 4 expenses')).toBeInTheDocument()
      })
    })

    it('should show unique cards as filter buttons', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      // All + 2 unique cards + No Card
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'John Doe' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Jane Smith' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'No Card (Taxes/Fees)' })).toBeInTheDocument()
    })
  })

  describe('Combined Filters', () => {
    it('should combine search and card filters', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const searchInput = screen.getByPlaceholderText('Search expenses...')
      const cardButton = screen.getByRole('button', { name: 'John Doe' })

      await user.type(searchInput, 'a')
      await user.click(cardButton)

      await waitFor(() => {
        // Only "Amazon Purchase" matches: contains 'a' AND uses card-1
        expect(screen.getByText('Amazon Purchase')).toBeInTheDocument()
        expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument()
      })
    })

    it('should clear filters and show all expenses', async () => {
      const user = userEvent.setup()
      render(<ExpenseTable expenses={mockExpenses} />)

      const searchInput = screen.getByPlaceholderText('Search expenses...')

      // Apply filters
      await user.type(searchInput, 'amazon')
      await user.click(screen.getByRole('button', { name: 'John Doe' }))

      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 4 expenses')).toBeInTheDocument()
      })

      // Clear filters
      await user.clear(searchInput)
      await user.click(screen.getByRole('button', { name: 'All' }))

      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 4 expenses')).toBeInTheDocument()
      })
    })
  })

  describe('Data Display', () => {
    it('should format amounts correctly', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      // ARS amounts with thousands separator
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      expect(screen.getByText('$15,000')).toBeInTheDocument()

      // USD amounts
      expect(screen.getByText('US$100')).toBeInTheDocument()
      expect(screen.getByText('US$150')).toBeInTheDocument()
    })

    it('should display installments when present', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      expect(screen.getByText('1/3')).toBeInTheDocument()
    })

    it('should display dash for missing values', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      const rows = screen.getAllByRole('row')
      const netflixRow = rows.find((row) =>
        within(row).queryByText('Netflix Subscription')
      )

      expect(netflixRow).toBeInTheDocument()
      const cells = within(netflixRow!).getAllByRole('cell')

      // USD column should have dash
      expect(cells[2]).toHaveTextContent('-')
      // Installments column should have dash
      expect(cells[3]).toHaveTextContent('-')
    })

    it('should display card custom names', () => {
      render(<ExpenseTable expenses={mockExpenses} />)

      const rows = screen.getAllByRole('row')
      const amazonRow = rows.find((row) => within(row).queryByText('Amazon Purchase'))
      const netflixRow = rows.find((row) => within(row).queryByText('Netflix Subscription'))

      expect(within(amazonRow!).getByText('John Doe')).toBeInTheDocument()
      expect(within(netflixRow!).getByText('Jane Smith')).toBeInTheDocument()
    })
  })
})
