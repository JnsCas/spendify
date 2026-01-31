'use client'

import Link from 'next/link'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '@/lib/store'
import { AppIcon } from '@/components/AppIcon'

const LANGUAGES = [
  { code: 'en', name: 'EN', flag: '🇺🇸' },
  { code: 'es', name: 'ES', flag: '🇪🇸' },
]

function LanguageSwitcher() {
  const { locale, setLocale } = useAuthStore()

  return (
    <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-200">
      {LANGUAGES.map((lang) => {
        const isSelected = locale === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isSelected
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function AuthHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <AppIcon size="small" />
            <span className="text-xl font-bold tracking-tight text-gray-900">Spendify</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
      <div className="flex items-start">
        <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

const ERROR_MAP: Record<string, string> = {
  'email must be an email': 'auth.invalidEmail',
  'Invalid credentials': 'auth.invalidCredentials',
  'Unauthorized': 'auth.invalidCredentials',
  'Email already exists': 'auth.emailAlreadyExists',
  'Invalid invite code': 'auth.invalidInviteCode',
}

export function getTranslatedError(
  backendMessage: string | undefined,
  fallbackKey: string,
  t: (key: string) => string
): string {
  if (!backendMessage) return t(fallbackKey)

  const translationKey = ERROR_MAP[backendMessage]
  if (translationKey) return t(translationKey)

  // Check for partial matches
  const lowerMessage = backendMessage.toLowerCase()
  if (lowerMessage.includes('email') && lowerMessage.includes('must be')) {
    return t('auth.invalidEmail')
  }
  if (lowerMessage.includes('already exists')) {
    return t('auth.emailAlreadyExists')
  }
  if (lowerMessage.includes('invite')) {
    return t('auth.invalidInviteCode')
  }

  return t(fallbackKey)
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 pt-24 relative">
      <AuthHeader />
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  )
}
