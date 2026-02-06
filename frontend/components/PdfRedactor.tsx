'use client'

import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb } from 'pdf-lib'
import { useTranslations } from '@/lib/i18n'

// Configure PDF.js worker - use unpkg for better reliability
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

interface Redaction {
  id: string
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
}

interface PdfRedactorProps {
  file: File
  onRedacted: (redactedFile: File) => void
  onSkip: () => void
  onCancel: () => void
}

// Sub-components for better organization
function RedactionToolbar({
  onUndo,
  onClear,
  onApply,
  onSkip,
  canUndo,
  isApplying,
  t
}: {
  onUndo: () => void
  onClear: () => void
  onApply: () => void
  onSkip: () => void
  canUndo: boolean
  isApplying: boolean
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            canUndo
              ? 'bg-white text-gray-700 hover:bg-gray-100'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {t('import.redaction.undo')}
        </button>
        <button
          onClick={onClear}
          disabled={!canUndo}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            canUndo
              ? 'bg-white text-red-600 hover:bg-red-50'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {t('import.redaction.clearAll')}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSkip}
          disabled={isApplying}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          {t('import.redaction.skipRedaction')}
        </button>
        <button
          onClick={onApply}
          disabled={isApplying}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
            isApplying
              ? 'cursor-not-allowed bg-blue-400'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isApplying ? t('import.redaction.applying') : t('import.redaction.applyRedactions')}
        </button>
      </div>
    </div>
  )
}

function InstructionsBanner({ t }: { t: (key: string) => string }) {
  return (
    <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-900">
            {t('import.redaction.instructions')}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            {t('import.redaction.instructionsDetail')}
          </p>
        </div>
      </div>
    </div>
  )
}

function PageNavigator({ currentPage, totalPages, onPageChange, t }: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  t: (key: string, params?: Record<string, any>) => string
}) {
  return (
    <div className="flex items-center justify-center gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          currentPage > 1
            ? 'bg-white text-gray-700 hover:bg-gray-100'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
        }`}
      >
        {t('import.redaction.previousPage')}
      </button>
      <span className="text-sm text-gray-600">
        {t('import.redaction.pageOf', { current: currentPage, total: totalPages })}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          currentPage < totalPages
            ? 'bg-white text-gray-700 hover:bg-gray-100'
            : 'cursor-not-allowed bg-gray-100 text-gray-400'
        }`}
      >
        {t('import.redaction.nextPage')}
      </button>
    </div>
  )
}

export default function PdfRedactor({ file, onRedacted, onSkip, onCancel }: PdfRedactorProps) {
  const t = useTranslations()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [redactions, setRedactions] = useState<Redaction[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentRedaction, setCurrentRedaction] = useState<Redaction | null>(null)
  const [scale, setScale] = useState(1)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
      } catch (err) {
        console.error('Error loading PDF:', err)
        setError(t('import.redaction.errorLoadingMessage'))
      }
    }

    loadPdf()
  }, [file])

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!

        // Calculate scale to fit container
        const containerWidth = containerRef.current?.clientWidth || 800
        const viewport = page.getViewport({ scale: 1 })
        const calculatedScale = Math.min(containerWidth / viewport.width, 1.5)
        setScale(calculatedScale)

        const scaledViewport = page.getViewport({ scale: calculatedScale })

        canvas.height = scaledViewport.height
        canvas.width = scaledViewport.width

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        }

        await page.render(renderContext as any).promise

        // Draw existing redactions for this page
        drawRedactions(context, currentPage)
      } catch (err) {
        console.error('Error rendering page:', err)
        setError(t('import.redaction.errorLoadingMessage'))
      }
    }

    renderPage()
  }, [pdfDoc, currentPage, redactions])

  const drawRedactions = (context: CanvasRenderingContext2D, pageIndex: number) => {
    const pageRedactions = redactions.filter((r) => r.pageIndex === pageIndex)
    pageRedactions.forEach((redaction) => {
      context.fillStyle = 'rgba(0, 0, 0, 0.9)'
      context.fillRect(redaction.x, redaction.y, redaction.width, redaction.height)
    })
  }

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getCanvasCoordinates(e)
    setIsDrawing(true)
    setStartPos(pos)
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return
    e.preventDefault()

    const pos = getCanvasCoordinates(e)
    const width = pos.x - startPos.x
    const height = pos.y - startPos.y

    const redaction: Redaction = {
      id: `temp-${Date.now()}`,
      pageIndex: currentPage,
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(width),
      height: Math.abs(height),
    }

    setCurrentRedaction(redaction)

    // Redraw page with temporary redaction
    const context = canvasRef.current.getContext('2d')!
    const page = pdfDoc?.getPage(currentPage)
    if (!page) return

    page.then((p) => {
      const viewport = p.getViewport({ scale })
      const renderContext = {
        canvasContext: context,
        viewport,
      }

      p.render(renderContext as any).promise.then(() => {
        drawRedactions(context, currentPage)
        // Draw current redaction
        context.fillStyle = 'rgba(0, 0, 0, 0.7)'
        context.fillRect(redaction.x, redaction.y, redaction.width, redaction.height)
      })
    })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentRedaction) return

    // Only add if redaction has meaningful size
    if (currentRedaction.width > 5 && currentRedaction.height > 5) {
      setRedactions((prev) => [...prev, { ...currentRedaction, id: `redaction-${Date.now()}` }])
    }

    setIsDrawing(false)
    setStartPos(null)
    setCurrentRedaction(null)
  }

  const handleUndo = () => {
    setRedactions((prev) => prev.slice(0, -1))
  }

  const handleClearAll = () => {
    setRedactions([])
  }

  const applyRedactions = async () => {
    if (redactions.length === 0) {
      onSkip()
      return
    }

    setIsApplying(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()

      // Group redactions by page
      const redactionsByPage = new Map<number, Redaction[]>()
      redactions.forEach((redaction) => {
        const pageRedactions = redactionsByPage.get(redaction.pageIndex) || []
        pageRedactions.push(redaction)
        redactionsByPage.set(redaction.pageIndex, pageRedactions)
      })

      // Apply redactions to each page
      for (const [pageIndex, pageRedactions] of redactionsByPage.entries()) {
        const page = pages[pageIndex - 1] // PDF pages are 1-indexed in viewer, 0-indexed in pdf-lib
        const { height } = page.getSize()

        pageRedactions.forEach((redaction) => {
          // Convert canvas coordinates to PDF coordinates
          // PDF coordinates start from bottom-left, canvas from top-left
          const pdfX = redaction.x / scale
          const pdfY = height - (redaction.y / scale) - (redaction.height / scale)
          const pdfWidth = redaction.width / scale
          const pdfHeight = redaction.height / scale

          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(0, 0, 0),
          })
        })
      }

      const pdfBytes = await pdfDoc.save()
      const redactedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
      const redactedFile = new File([redactedBlob], file.name, { type: 'application/pdf' })

      onRedacted(redactedFile)
    } catch (err) {
      console.error('Error applying redactions:', err)
      setError(t('import.redaction.errorApplying'))
    } finally {
      setIsApplying(false)
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <svg className="h-6 w-6 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-900">{t('import.redaction.errorLoading')}</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={onCancel}
              className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              {t('import.redaction.goBack')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!pdfDoc) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">{t('import.redaction.loadingPdf')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <InstructionsBanner t={t} />
        <RedactionToolbar
          onUndo={handleUndo}
          onClear={handleClearAll}
          onApply={applyRedactions}
          onSkip={onSkip}
          canUndo={redactions.length > 0}
          isApplying={isApplying}
          t={t}
        />

        {/* PDF Canvas */}
        <div ref={containerRef} className="overflow-auto bg-gray-100 p-4">
          <div className="mx-auto flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              className="cursor-crosshair shadow-lg"
              style={{ touchAction: 'none' }}
            />
          </div>
        </div>

        <PageNavigator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          t={t}
        />
      </div>

      {/* Redaction count */}
      {redactions.length > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">
            {t('import.redaction.redactionsMarked', { count: redactions.length, plural: redactions.length !== 1 ? 's' : '' })}
          </p>
        </div>
      )}
    </div>
  )
}
