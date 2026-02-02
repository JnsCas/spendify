'use client'

import Link from 'next/link'
import {
  ClockIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from '@/lib/i18n'

export function HeroSection() {
  const t = useTranslations()

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
      <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />

      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {t('landing.badge')}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            {t('landing.headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.subheadline')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 text-lg"
            >
              {t('landing.startFree')}
            </Link>
            <button
              onClick={() => {
                const element = document.getElementById('how-it-works')
                if (element) element.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 text-lg"
            >
              {t('landing.seeHowItWorks')}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-green-500" />
              <span>{t('landing.trustBadge1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-green-500" />
              <span>{t('landing.trustBadge2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-green-500" />
              <span>{t('landing.trustBadge3')}</span>
            </div>
          </div>
        </div>

        {/* Hero Visual - Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Mock Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>

            {/* Mock Dashboard Content */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                <div className="text-xs opacity-80 mb-1">{t('landing.mockTotalSpending')}</div>
                <div className="text-2xl font-bold">$2,847</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="text-xs opacity-80 mb-1">{t('landing.mockTransactions')}</div>
                <div className="text-2xl font-bold">47</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-4 text-white">
                <div className="text-xs opacity-80 mb-1">{t('landing.mockCards')}</div>
                <div className="text-2xl font-bold">3</div>
              </div>
            </div>

            {/* Mock Chart */}
            <div className="bg-gray-50 rounded-xl p-4 h-48 flex items-end justify-around gap-2">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((height, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t-sm w-full"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl rotate-12 opacity-20 hidden lg:block" />
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl -rotate-12 opacity-20 hidden lg:block" />
        </div>
      </div>
    </section>
  )
}
