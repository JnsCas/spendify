'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { AppIcon } from '@/components/AppIcon'
import { useTranslations } from '@/lib/i18n'
import { useAuthStore } from '@/lib/store'

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

export function LandingHeader() {
  const t = useTranslations()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <AppIcon size="small" />
            <span className="text-xl font-bold tracking-tight text-gray-900">Spendify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {t('landing.howItWorks')}
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {t('landing.features')}
            </button>
          </div>

          {/* Desktop CTA Buttons + Language Switcher */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              {t('auth.login')}
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
            >
              {t('landing.getStarted')}
            </Link>
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
              >
                {t('landing.howItWorks')}
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
              >
                {t('landing.features')}
              </button>
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                <div className="flex justify-center">
                  <LanguageSwitcher />
                </div>
                <Link
                  href="/auth/login"
                  className="text-center text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="text-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25"
                >
                  {t('landing.getStarted')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
