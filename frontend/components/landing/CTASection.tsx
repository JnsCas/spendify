'use client'

import Link from 'next/link'
import { useTranslations } from '@/lib/i18n'

export function CTASection() {
  const t = useTranslations()

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          {t('landing.ctaTitle')}
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          {t('landing.ctaSubtitle')}
        </p>

        {/* CTA Button */}
        <Link
          href="/auth/register"
          className="inline-block px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
        >
          {t('landing.ctaButton')}
        </Link>

        {/* Trust line */}
        <p className="mt-6 text-blue-200 text-sm">
          {t('landing.ctaTrust')}
        </p>
      </div>
    </section>
  )
}
