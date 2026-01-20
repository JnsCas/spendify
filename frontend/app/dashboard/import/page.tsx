'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BulkFileUpload from '@/components/BulkFileUpload'

export default function ImportPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>

      {/* Main upload section */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">
            Import Statements
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload multiple credit card statement PDFs at once
          </p>
        </div>

        <div className="p-6">
          <BulkFileUpload onComplete={handleComplete} />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900">How it works</h3>
        </div>
        <div className="p-4">
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                1
              </span>
              <span className="text-sm text-gray-600">
                Select or drag and drop your PDF statement files
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                2
              </span>
              <span className="text-sm text-gray-600">
                Click "Start Import" to begin processing
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                3
              </span>
              <span className="text-sm text-gray-600">
                Each file is processed in parallel - watch the progress bars
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                4
              </span>
              <span className="text-sm text-gray-600">
                Statement dates are automatically detected from PDF content
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
