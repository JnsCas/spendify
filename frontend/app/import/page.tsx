'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTranslations } from '@/lib/i18n'

// Dynamically import BulkFileUpload with ssr: false to avoid PDF library issues during build
const BulkFileUpload = dynamic(() => import('@/components/BulkFileUpload'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-12">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  ),
})

export default function ImportPage() {
  const router = useRouter()
  const t = useTranslations()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <div className="space-y-4">
      {/* Main upload section */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h1 className="text-lg font-semibold text-gray-900">
            {t('import.importStatements')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('import.uploadMultiple')}
          </p>
        </div>

        <div className="p-6">
          <BulkFileUpload onComplete={handleComplete} />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900">{t('import.howItWorks')}</h3>
        </div>
        <div className="p-4">
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                1
              </span>
              <span className="text-sm text-gray-600">
                {t('import.step1')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                2
              </span>
              <span className="text-sm text-gray-600">
                {t('import.step2')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                3
              </span>
              <span className="text-sm text-gray-600">
                {t('import.step3')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                4
              </span>
              <span className="text-sm text-gray-600">
                {t('import.step4')}
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
