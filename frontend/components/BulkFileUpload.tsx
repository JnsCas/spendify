'use client'

import { useRef, useState } from 'react'
import { useBulkUpload } from '@/hooks/useBulkUpload'
import UploadProgressItem from './UploadProgressItem'

interface BulkFileUploadProps {
  onComplete?: () => void
}

export default function BulkFileUpload({ onComplete }: BulkFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

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
    addFiles(droppedFiles)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    addFiles(selectedFiles)
    // Reset input so same files can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
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
            <svg
              className="w-12 h-12 text-gray-400"
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

          <div>
            <p className="text-gray-600 mb-2">
              Drag and drop your credit card statement PDFs here, or
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Browse Files
            </button>
          </div>

          <p className="text-sm text-gray-500">
            PDF files only, max 10MB each, up to 12 files
          </p>
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{uploadError}</p>
        </div>
      )}

      {/* Duplicates warning */}
      {duplicates.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-amber-800">Duplicate Files Skipped</span>
          </div>
          <ul className="text-sm text-amber-700 space-y-1">
            {duplicates.map((dup, index) => (
              <li key={index}>
                <span className="font-medium">{dup.originalFilename}</span> is a duplicate of{' '}
                <span className="font-medium">{dup.existingFilename}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Files ({files.length})
            </h3>
            {!isUploading && !allComplete && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-red-500 transition"
              >
                Clear all
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
              className={`px-6 py-2 rounded-lg font-medium transition ${
                canUpload
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Start Import'}
            </button>
          )}

          {allComplete && (
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              View Dashboard
            </button>
          )}
        </div>
      )}

      {/* Completion summary */}
      {allComplete && (
        <div
          className={`p-4 rounded-lg ${
            failedCount > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {failedCount === 0 ? (
              <svg
                className="w-5 h-5 text-green-500"
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
                className="w-5 h-5 text-yellow-500"
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
              className={`font-medium ${
                failedCount > 0 ? 'text-yellow-800' : 'text-green-800'
              }`}
            >
              Import Complete
            </span>
          </div>
          <p
            className={`mt-1 text-sm ${
              failedCount > 0 ? 'text-yellow-700' : 'text-green-700'
            }`}
          >
            {successCount} of {files.length} files processed successfully
            {failedCount > 0 && `. ${failedCount} failed - click retry to try again.`}
          </p>
        </div>
      )}
    </div>
  )
}
