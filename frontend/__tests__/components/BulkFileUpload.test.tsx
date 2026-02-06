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

// Mock PdfRedactor component to avoid PDF library issues in tests
// This mock automatically skips redaction to allow tests to proceed
jest.mock('@/components/PdfRedactor', () => ({
  __esModule: true,
  default: jest.fn(({ onSkip }: any) => (
    <div data-testid="pdf-redactor">
      <button onClick={onSkip}>Skip Redaction</button>
    </div>
  )),
}))

// Mock i18n hook
jest.mock('@/lib/i18n', () => ({
  useTranslations: () => (key: string, params?: Record<string, any>) => {
    // Return a simple English text based on the key
    const translations: Record<string, string> = {
      'import.bulk.dragDropText': 'Drag and drop your credit card statement PDFs here, or',
      'import.bulk.browseFiles': 'Browse Files',
      'import.bulk.fileRestrictions': 'PDF files only, max 500KB each, up to 12 files',
      'import.bulk.filesCount': `Files (${params?.count || 0})`,
      'import.bulk.clearAll': 'Clear all',
      'import.bulk.startImport': 'Start Import',
      'import.bulk.uploading': 'Uploading...',
      'import.bulk.viewDashboard': 'View Dashboard',
      'import.bulk.importComplete': 'Import Complete',
      'import.bulk.successMessage': `${params?.successCount || 0} of ${params?.total || 0} files processed successfully`,
      'import.bulk.failedMessage': `${params?.failedCount || 0} failed - click retry to try again.`,
      'import.bulk.duplicatesSkipped': 'Duplicate Files Skipped',
      'import.bulk.duplicateMessage': `${params?.original || ''} is a duplicate of ${params?.existing || ''}`,
    }

    // Handle parameter substitution for keys not in the map
    if (params && !translations[key]) {
      let result = key
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v))
      })
      return result
    }

    return translations[key] || key
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
    // Fully reset the Zustand store between tests
    // clearAll() only removes completed/failed items, so we need to reset the entire state
    useImportStore.setState({
      items: [],
      duplicates: [],
      isUploading: false,
      uploadError: null,
    })
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

      // Wait for redaction UI to appear
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })

      // Skip redaction for first file
      await userEvent.click(screen.getByText('Skip Redaction'))

      // Wait for second file's redaction UI
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })

      // Skip redaction for second file
      await userEvent.click(screen.getByText('Skip Redaction'))

      // Now files should be in the upload queue
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

      // Use fireEvent to bypass accept filter and test validation
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

      // Wait for redaction UI and skip it
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

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

      // Wait for redaction UI and skip it
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

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

      // Skip redaction for both files
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

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

      // Wait for redaction UI and skip it
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

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

      // Wait for redaction UI and skip it
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

      await waitFor(() => {
        expect(screen.getByText('Start Import')).toBeInTheDocument()
      })

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

      // Skip redaction for both files
      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

      await waitFor(() => {
        expect(screen.getByTestId('pdf-redactor')).toBeInTheDocument()
      })
      await userEvent.click(screen.getByText('Skip Redaction'))

      await waitFor(() => {
        expect(screen.getByText('Files (2)')).toBeInTheDocument()
      })
    })
  })
})
