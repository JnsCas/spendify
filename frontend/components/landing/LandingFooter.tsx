'use client'

import Link from 'next/link'
import { AppIcon } from '@/components/AppIcon'
import { useTranslations } from '@/lib/i18n'

export function LandingFooter() {
  const t = useTranslations()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AppIcon size="small" />
              <span className="text-xl font-bold tracking-tight text-white">Spendify</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              {t('landing.footerTagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-semibold text-sm">{t('landing.footerProduct')}</h4>
              <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('auth.login')}
              </Link>
              <Link href="/auth/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              {t('landing.copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
