'use client'

import type { ImportItem } from '@/lib/importStore'

interface UploadProgressItemProps {
  item: ImportItem
  onRemove?: () => void
  onRetry?: () => void
}

export default function UploadProgressItem({
  item,
  onRemove,
  onRetry,
}: UploadProgressItemProps) {
  const getStatusColor = () => {
    switch (item.status) {
      case 'completed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
      case 'processing':
        return 'bg-blue-500'
      case 'uploading':
      case 'pending':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStatusText = () => {
    switch (item.status) {
      case 'queued':
        return 'Ready to upload'
      case 'uploading':
        return 'Uploading...'
      case 'pending':
        return 'Queued for processing'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return item.status
    }
  }

  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return (
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        )
      case 'failed':
        return (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )
      case 'processing':
      case 'uploading':
      case 'pending':
        return (
          <svg
            className="w-5 h-5 text-blue-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )
      default:
        return (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        )
    }
  }

  const showRemove = item.status === 'queued'
  const showRetry = item.status === 'failed'

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">{getStatusIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {item.filename}
          </p>
          <p className="text-xs text-gray-500">
            {(item.fileSize / 1024).toFixed(1)} KB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              item.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : item.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : item.status === 'processing' || item.status === 'uploading'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {getStatusText()}
          </span>

          {showRemove && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-500 transition"
              title="Remove file"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="p-1 text-gray-400 hover:text-blue-500 transition"
              title="Retry upload"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {item.status !== 'queued' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {item.error && (
        <p className="mt-2 text-xs text-red-600">{item.error}</p>
      )}
    </div>
  )
}
