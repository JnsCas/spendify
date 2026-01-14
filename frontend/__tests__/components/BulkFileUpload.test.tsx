/**
 * BulkFileUpload Component Tests
 *
 * Tests the bulk file upload functionality including multiple file selection,
 * validation, progress tracking, and completion handling.
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BulkFileUpload from '@/components/BulkFileUpload'
import { statementsApi } from '@/lib/api'
import { useImportStore } from '@/lib/importStore'

jest.mock('@/lib/api', () => ({
  statementsApi: {
    uploadBulk: jest.fn(),
    getStatuses: jest.fn(),
  },
}))

describe('BulkFileUpload Component', () => {
  const mockOnComplete = jest.fn()
  const mockUploadBulk = statementsApi.uploadBulk as jest.MockedFunction<
    typeof statementsApi.uploadBulk
  >
  const mockGetStatuses = statementsApi.getStatuses as jest.MockedFunction<
    typeof statementsApi.getStatuses
  >

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the Zustand store between tests
    useImportStore.getState().clearAll()
  })

  describe('Initial State', () => {
    it('should render upload interface', () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText('Browse Files')).toBeInTheDocument()
      expect(screen.getByText(/PDF files only/i)).toBeInTheDocument()
    })

    it('should not show file list when no files selected', () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      expect(screen.queryByText('Files')).not.toBeInTheDocument()
      expect(screen.queryByText('Start Import')).not.toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('should accept multiple PDF files', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const files = [
        new File(['content1'], 'statement1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'statement2.pdf', { type: 'application/pdf' }),
      ]
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, files)

      await waitFor(() => {
        expect(screen.getByText('Files (2)')).toBeInTheDocument()
        expect(screen.getByText('statement1.pdf')).toBeInTheDocument()
        expect(screen.getByText('statement2.pdf')).toBeInTheDocument()
      })
    })

    it('should reject non-PDF files with error message', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const file = new File(['content'], 'document.txt', { type: 'text/plain' })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      // Use fireEvent for non-PDF to bypass accept filter
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText(/Only PDF files are allowed/i)).toBeInTheDocument()
      })
    })

    it('should show Start Import button when files are selected', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const file = new File(['content'], 'statement.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('Start Import')).toBeInTheDocument()
      })
    })
  })

  describe('File List Management', () => {
    it('should allow removing files from list', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const file = new File(['content'], 'statement.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('statement.pdf')).toBeInTheDocument()
      })

      const removeButton = screen.getByTitle('Remove file')
      await userEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('statement.pdf')).not.toBeInTheDocument()
      })
    })

    it('should clear all files when Clear all is clicked', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const files = [
        new File(['content1'], 'statement1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'statement2.pdf', { type: 'application/pdf' }),
      ]
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, files)

      await waitFor(() => {
        expect(screen.getByText('Files (2)')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Clear all'))

      await waitFor(() => {
        expect(screen.queryByText('Files')).not.toBeInTheDocument()
      })
    })
  })

  describe('Upload Process', () => {
    it('should call uploadBulk when Start Import is clicked', async () => {
      mockUploadBulk.mockResolvedValue({
        statements: [
          { id: 'stmt-1', originalFilename: 'statement.pdf', status: 'completed' },
        ],
        duplicates: [],
        totalQueued: 1,
      })

      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const file = new File(['content'], 'statement.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('Start Import')).toBeInTheDocument()
      })

      await userEvent.click(screen.getByText('Start Import'))

      await waitFor(() => {
        expect(mockUploadBulk).toHaveBeenCalledWith([file])
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockUploadBulk.mockRejectedValue({
        response: { data: { message: 'Upload failed. Please try again.' } },
      })

      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const file = new File(['content'], 'statement.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement

      await userEvent.upload(input, file)
      await userEvent.click(screen.getByText('Start Import'))

      await waitFor(() => {
        expect(
          screen.getByText(/Upload failed/)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('should handle multiple file drop', async () => {
      render(<BulkFileUpload onComplete={mockOnComplete} />)

      const files = [
        new File(['content1'], 'statement1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'statement2.pdf', { type: 'application/pdf' }),
      ]

      // Find the drop zone by looking for the container with border-dashed
      const dropZone = document.querySelector('.border-dashed')!

      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files },
      })
      Object.defineProperty(dropEvent, 'preventDefault', {
        value: jest.fn(),
      })

      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(screen.getByText('Files (2)')).toBeInTheDocument()
      })
    })
  })
})
