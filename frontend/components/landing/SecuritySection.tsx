'use client'

import {
  TrashIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from '@/lib/i18n'

const securityFeatures = [
  {
    icon: PencilSquareIcon,
    titleKey: 'landing.security.feature1Title',
    descriptionKey: 'landing.security.feature1Description',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    icon: EyeSlashIcon,
    titleKey: 'landing.security.feature2Title',
    descriptionKey: 'landing.security.feature2Description',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    icon: TrashIcon,
    titleKey: 'landing.security.feature3Title',
    descriptionKey: 'landing.security.feature3Description',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    icon: ShieldCheckIcon,
    titleKey: 'landing.security.feature4Title',
    descriptionKey: 'landing.security.feature4Description',
    gradient: 'from-sky-500 to-sky-600',
  },
]

export function SecuritySection() {
  const t = useTranslations()

  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <ShieldCheckIcon className="w-4 h-4" />
            {t('landing.security.badge')}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.security.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.security.subtitle')}
          </p>
        </div>

        {/* Main Visual */}
        <div className="relative mb-16">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 md:p-12 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-cyan-50/50" />

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              {/* Left: Redaction Visualization */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                    <PencilSquareIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {t('landing.security.redactionTitle')}
                    </h3>
                    <p className="text-gray-500 text-sm">{t('landing.security.redactionSubtitle')}</p>
                  </div>
                </div>

                {/* PDF redaction visualization */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="space-y-3">
                    {/* Simulated PDF content with redactions */}
                    <div className="flex items-center gap-3 text-sm font-mono">
                      <span className="text-gray-500">Name:</span>
                      <span className="bg-gray-700 text-gray-700 px-8 rounded">████████</span>
                      <span className="text-emerald-400 text-xs">✓ Redacted</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-mono">
                      <span className="text-gray-500">Address:</span>
                      <span className="bg-gray-700 text-gray-700 px-12 rounded">████████████</span>
                      <span className="text-emerald-400 text-xs">✓ Redacted</span>
                    </div>
                    <div className="border-t border-gray-700 my-3" />
                    <div className="flex items-center gap-3 text-sm font-mono">
                      <span className="text-gray-500">Purchase:</span>
                      <span className="text-white">Amazon - $45.99</span>
                      <span className="text-cyan-400 text-xs">Extracted</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-mono">
                      <span className="text-gray-500">Purchase:</span>
                      <span className="text-white">Netflix - $15.99</span>
                      <span className="text-cyan-400 text-xs">Extracted</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('landing.security.redactionDescription')}
                </p>
              </div>

              {/* Right: Key Points */}
              <div className="space-y-6">
                {securityFeatures.map((feature) => (
                  <div key={feature.titleKey} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {t(feature.titleKey)}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {t(feature.descriptionKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <PencilSquareIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">{t('landing.security.trustBadge1')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <TrashIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">{t('landing.security.trustBadge2')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">{t('landing.security.trustBadge3')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
