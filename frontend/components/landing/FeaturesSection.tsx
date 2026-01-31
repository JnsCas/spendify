'use client'

import {
  DocumentTextIcon,
  CpuChipIcon,
  CreditCardIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from '@/lib/i18n'

const features = [
  {
    icon: DocumentTextIcon,
    titleKey: 'landing.feature1Title',
    descriptionKey: 'landing.feature1Description',
  },
  {
    icon: CpuChipIcon,
    titleKey: 'landing.feature2Title',
    descriptionKey: 'landing.feature2Description',
  },
  {
    icon: CreditCardIcon,
    titleKey: 'landing.feature3Title',
    descriptionKey: 'landing.feature3Description',
  },
  {
    icon: ArrowDownTrayIcon,
    titleKey: 'landing.feature4Title',
    descriptionKey: 'landing.feature4Description',
  },
  {
    icon: ChartBarIcon,
    titleKey: 'landing.feature5Title',
    descriptionKey: 'landing.feature5Description',
  },
  {
    icon: LockClosedIcon,
    titleKey: 'landing.feature6Title',
    descriptionKey: 'landing.feature6Description',
  },
]

export function FeaturesSection() {
  const t = useTranslations()

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.featuresSubtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.titleKey}
              className="group bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-5 group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t(feature.titleKey)}
              </h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {t(feature.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
