'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { usersApi } from '@/lib/api'
import { useTranslations } from '@/lib/i18n'
import { CheckIcon } from '@heroicons/react/24/outline'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

export default function ProfilePage() {
  const t = useTranslations()
  const { user, locale, setLocale } = useAuthStore()
  const [saving, setSaving] = useState(false)

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === locale || saving) return

    setSaving(true)
    try {
      await usersApi.updateProfile({ language: newLanguage })
      setLocale(newLanguage)

      if (user) {
        localStorage.setItem('user', JSON.stringify({ ...user, language: newLanguage }))
      }
    } catch (error) {
      console.error('Error updating language:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">{t('profile.title')}</h1>
          <p className="text-sm text-gray-500">{t('profile.selectLanguage')}</p>
        </div>

        <div className="p-4">
          <div className="flex gap-3">
            {LANGUAGES.map((lang) => {
              const isSelected = locale === lang.code
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={saving}
                  className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  } ${saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {lang.name}
                  </span>
                  {isSelected && <CheckIcon className="h-5 w-5 text-indigo-600" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
