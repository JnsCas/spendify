/**
 * FileUpload Component Tests
 *
 * Tests the core file upload functionality including validation,
 * success/error handling, and user interactions.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from '@/components/FileUpload'
import { statementsApi } from '@/lib/api'

jest.mock('@/lib/api', () => ({
  statementsApi: {
    upload: jest.fn(),
  },
}))

describe('FileUpload Component', () => {
  const mockOnSuccess = jest.fn()
  const mockUpload = statementsApi.upload as jest.MockedFunction<typeof statementsApi.upload>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should render upload interface', () => {
      render(<FileUpload onSuccess={mockOnSuccess} />)

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      expect(screen.getByText('Browse Files')).toBeInTheDocument()
    })
  })

  describe('File Validation', () => {
    it('should reject non-PDF files', async () => {
      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'document.txt', { type: 'text/plain' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Please upload a PDF file')).toBeInTheDocument()
        expect(mockUpload).not.toHaveBeenCalled()
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })

    it('should accept PDF files', async () => {
      mockUpload.mockResolvedValue({ data: { id: '123' } })
      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file)
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Upload States', () => {
    it('should show uploading state during upload', async () => {
      mockUpload.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
      expect(screen.queryByText('Browse Files')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display server error message', async () => {
      const errorMsg = 'File too large'
      mockUpload.mockRejectedValue({
        response: { data: { message: errorMsg } },
      })

      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(errorMsg)).toBeInTheDocument()
        expect(mockOnSuccess).not.toHaveBeenCalled()
      })
    })

    it('should display generic error for network failures', async () => {
      mockUpload.mockRejectedValue(new Error('Network error'))

      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument()
      })
    })

    it('should clear error when uploading new file', async () => {
      render(<FileUpload onSuccess={mockOnSuccess} />)
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // First: trigger validation error
      const txtFile = new File(['content'], 'doc.txt', { type: 'text/plain' })
      Object.defineProperty(input, 'files', {
        value: [txtFile],
        writable: true,
        configurable: true,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.getByText('Please upload a PDF file')).toBeInTheDocument()
      })

      // Second: upload valid file
      mockUpload.mockResolvedValue({ data: { id: '123' } })
      const pdfFile = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      Object.defineProperty(input, 'files', {
        value: [pdfFile],
        writable: true,
        configurable: true,
      })
      fireEvent.change(input)

      await waitFor(() => {
        expect(screen.queryByText('Please upload a PDF file')).not.toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('should highlight drop zone on drag over', () => {
      render(<FileUpload onSuccess={mockOnSuccess} />)

      const dropZone = screen.getByText(/drag and drop/i).parentElement!

      fireEvent.dragOver(dropZone)
      expect(dropZone).toHaveClass('border-blue-500')

      fireEvent.dragLeave(dropZone)
      expect(dropZone).not.toHaveClass('border-blue-500')
    })

    it('should handle file drop', async () => {
      mockUpload.mockResolvedValue({ data: { id: '123' } })
      render(<FileUpload onSuccess={mockOnSuccess} />)

      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' })
      const dropZone = screen.getByText(/drag and drop/i).parentElement!

      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
      })

      fireEvent(dropZone, dropEvent)

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(file)
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })
})
