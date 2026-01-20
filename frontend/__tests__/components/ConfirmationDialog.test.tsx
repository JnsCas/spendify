/**
 * ConfirmationDialog Component Tests
 *
 * Tests the confirmation dialog's core functionality: rendering, interaction,
 * keyboard handling, and variant styling.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmationDialog from '@/components/ConfirmationDialog'

describe('ConfirmationDialog Component', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<ConfirmationDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument()
    })

    it('should render default button labels', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should render custom button labels', () => {
      render(
        <ConfirmationDialog
          {...defaultProps}
          confirmLabel="Delete"
          cancelLabel="Keep"
        />
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationDialog {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when backdrop is clicked', async () => {
      const user = userEvent.setup()
      render(<ConfirmationDialog {...defaultProps} />)

      // The backdrop is the element with bg-black/50 class
      const backdrop = document.querySelector('.bg-black\\/50')
      expect(backdrop).toBeInTheDocument()

      await user.click(backdrop!)

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onCancel when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<ConfirmationDialog {...defaultProps} />)

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Variants', () => {
    it('should apply danger variant styling by default', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-red-600')
    })

    it('should apply warning variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="warning" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-amber-600')
    })

    it('should apply info variant styling', () => {
      render(<ConfirmationDialog {...defaultProps} variant="info" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-blue-600')
    })
  })

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when dialog opens', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should unlock body scroll when dialog closes', () => {
      const { rerender } = render(<ConfirmationDialog {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<ConfirmationDialog {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('unset')
    })

    it('should unlock body scroll on unmount', () => {
      const { unmount } = render(<ConfirmationDialog {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('unset')
    })
  })

  describe('Accessibility', () => {
    it('should render the warning icon', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      // The icon container should be present
      const iconContainer = document.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have focusable buttons', () => {
      render(<ConfirmationDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })

      expect(confirmButton).not.toBeDisabled()
      expect(cancelButton).not.toBeDisabled()
    })
  })
})
