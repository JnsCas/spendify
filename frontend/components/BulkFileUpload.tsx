'use client'

import { useRef, useState } from 'react'
import { useBulkUpload } from '@/hooks/useBulkUpload'
import UploadProgressItem from './UploadProgressItem'
import PdfRedactor from './PdfRedactor'
import { useTranslations } from '@/lib/i18n'

interface BulkFileUploadProps {
  onComplete?: () => void
}

interface PendingFile {
  id: string
  file: File
}

export default function BulkFileUpload({ onComplete }: BulkFileUploadProps) {
  const t = useTranslations()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [currentRedactionFile, setCurrentRedactionFile] = useState<PendingFile | null>(null)

  const {
    files,
    duplicates,
    isUploading,
    uploadError,
    addFiles,
    removeFile,
    clearAll,
    startUpload,
    retryFile,
    allComplete,
    successCount,
    failedCount,
    canUpload,
  } = useBulkUpload()

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleNewFiles(droppedFiles)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    handleNewFiles(selectedFiles)
    // Reset input so same files can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleNewFiles = (newFiles: File[]) => {
    // Validate files before adding to redaction queue
    const validFiles: File[] = []
    const invalidFiles: string[] = []

    newFiles.forEach((file) => {
      if (file.type !== 'application/pdf') {
        invalidFiles.push(`${file.name}: Only PDF files are allowed`)
      } else {
        validFiles.push(file)
      }
    })

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      // Use the addFiles validation to show errors (it will reject them)
      addFiles(newFiles)
      return
    }

    // Add valid files to pending redaction queue
    const pending: PendingFile[] = validFiles.map((file) => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      file,
    }))
    setPendingFiles((prev) => [...prev, ...pending])

    // Auto-start redaction for first file if not already redacting
    if (!currentRedactionFile && pending.length > 0) {
      setCurrentRedactionFile(pending[0])
    }
  }

  const handleRedactionComplete = (redactedFile: File) => {
    if (!currentRedactionFile) return

    // Remove from pending
    setPendingFiles((prev) => prev.filter((f) => f.id !== currentRedactionFile.id))

    // Add redacted file to upload queue
    addFiles([redactedFile])

    // Move to next pending file
    const remaining = pendingFiles.filter((f) => f.id !== currentRedactionFile.id)
    setCurrentRedactionFile(remaining.length > 0 ? remaining[0] : null)
  }

  const handleSkipRedaction = () => {
    if (!currentRedactionFile) return

    // Remove from pending
    setPendingFiles((prev) => prev.filter((f) => f.id !== currentRedactionFile.id))

    // Add original file to upload queue
    addFiles([currentRedactionFile.file])

    // Move to next pending file
    const remaining = pendingFiles.filter((f) => f.id !== currentRedactionFile.id)
    setCurrentRedactionFile(remaining.length > 0 ? remaining[0] : null)
  }

  const handleCancelRedaction = () => {
    if (!currentRedactionFile) return

    // Remove from pending
    setPendingFiles((prev) => prev.filter((f) => f.id !== currentRedactionFile.id))

    // Move to next pending file
    const remaining = pendingFiles.filter((f) => f.id !== currentRedactionFile.id)
    setCurrentRedactionFile(remaining.length > 0 ? remaining[0] : null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div className="space-y-4">
      {/* Redaction UI - shown when there's a file pending redaction */}
      {currentRedactionFile && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('import.redaction.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('import.redaction.fileName', { name: currentRedactionFile.file.name })}
              {pendingFiles.length > 1 && (
                <span className="ml-2 text-gray-400">
                  {t('import.redaction.fileProgress', {
                    current: pendingFiles.findIndex(f => f.id === currentRedactionFile.id) + 1,
                    total: pendingFiles.length
                  })}
                </span>
              )}
            </p>
          </div>
          <div className="p-6">
            <PdfRedactor
              file={currentRedactionFile.file}
              onRedacted={handleRedactionComplete}
              onSkip={handleSkipRedaction}
              onCancel={handleCancelRedaction}
            />
          </div>
        </div>
      )}

      {/* Drop zone - hidden when redacting */}
      {!currentRedactionFile && (
        <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleChange}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-white p-3 ring-1 ring-gray-200">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-gray-600">
              {t('import.bulk.dragDropText')}
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {t('import.bulk.browseFiles')}
            </button>
          </div>

          <p className="text-xs text-gray-400">
            {t('import.bulk.fileRestrictions')}
          </p>
        </div>
      </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* Duplicates warning */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-amber-800">{t('import.bulk.duplicatesSkipped')}</span>
          </div>
          <ul className="space-y-1 text-sm text-amber-700">
            {duplicates.map((dup, index) => (
              <li key={index}>
                {t('import.bulk.duplicateMessage', { original: dup.originalFilename, existing: dup.existingFilename })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              {t('import.bulk.filesCount', { count: files.length })}
            </h3>
            {!isUploading && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-500 transition-colors hover:text-red-500"
              >
                {t('import.bulk.clearAll')}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <UploadProgressItem
                key={file.localId}
                item={file}
                onRemove={() => removeFile(file.localId)}
                onRetry={() => retryFile(file.localId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {files.length > 0 && (
        <div className="flex justify-end gap-3">
          {!allComplete && (
            <button
              onClick={startUpload}
              disabled={!canUpload}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                canUpload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
              }`}
            >
              {isUploading ? t('import.bulk.uploading') : t('import.bulk.startImport')}
            </button>
          )}

          {allComplete && (
            <button
              onClick={onComplete}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              {t('import.bulk.viewDashboard')}
            </button>
          )}
        </div>
      )}

      {/* Completion summary */}
      {allComplete && (
        <div
          className={`rounded-lg border p-4 ${
            failedCount > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex items-center gap-2">
            {failedCount === 0 ? (
              <svg
                className="h-5 w-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            <span
              className={`text-sm font-medium ${
                failedCount > 0 ? 'text-amber-800' : 'text-emerald-800'
              }`}
            >
              {t('import.bulk.importComplete')}
            </span>
          </div>
          <p
            className={`mt-1 text-sm ${
              failedCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {t('import.bulk.successMessage', { successCount, total: files.length })}
            {failedCount > 0 && `. ${t('import.bulk.failedMessage', { failedCount })}`}
          </p>
        </div>
      )}
    </div>
  )
}
