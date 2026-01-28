'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { usersApi } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const t = useTranslations()
  const { user, locale, setLocale } = useAuthStore()
  const [currentLanguage, setCurrentLanguage] = useState(locale)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    setCurrentLanguage(locale)
  }, [locale])

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === currentLanguage) return

    setSaving(true)
    setMessage(null)

    try {
      // Update backend
      await usersApi.updateProfile({ language: newLanguage })

      // Update local state
      setLocale(newLanguage)
      setCurrentLanguage(newLanguage)

      // Update user in store if needed
      if (user) {
        const updatedUser = { ...user, language: newLanguage }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }

      setMessage({ type: 'success', text: t('profile.languageSaved') })
    } catch (error) {
      console.error('Error updating language:', error)
      setMessage({ type: 'error', text: t('profile.errorSaving') })
    } finally {
      setSaving(false)
    }
  }

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('profile.title')}</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">{t('profile.language')}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">{t('profile.selectLanguage')}</p>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={saving}
                className={`flex w-full items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-all ${
                  currentLanguage === lang.code
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                } ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <p
                      className={`font-medium ${
                        currentLanguage === lang.code ? 'text-indigo-900' : 'text-gray-900'
                      }`}
                    >
                      {lang.name}
                    </p>
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <CheckIcon className="h-5 w-5 text-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {message && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
