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
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Import Statements
          </h1>
          <p className="text-gray-600">
            Upload multiple credit card statement PDFs at once. We'll automatically
            detect the month and year for each statement.
          </p>
        </div>

        <BulkFileUpload onComplete={handleComplete} />
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-xl">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Select or drag and drop your PDF statement files</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Click "Start Import" to begin processing</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>
              Each file is processed in parallel - watch the progress bars for status
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>
              The statement date is automatically detected from the PDF content
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
