'use client'

import {
  ArrowUpTrayIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'
import { useTranslations } from '@/lib/i18n'

const steps = [
  {
    icon: ArrowUpTrayIcon,
    titleKey: 'landing.step1Title',
    descriptionKey: 'landing.step1Description',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: SparklesIcon,
    titleKey: 'landing.step2Title',
    descriptionKey: 'landing.step2Description',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    icon: CheckCircleIcon,
    titleKey: 'landing.step3Title',
    descriptionKey: 'landing.step3Description',
    gradient: 'from-purple-500 to-purple-600',
  },
]

export function HowItWorksSection() {
  const t = useTranslations()

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('landing.howItWorksTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.howItWorksSubtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200" />

          {steps.map((step, index) => (
            <div key={step.titleKey} className="relative">
              {/* Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative z-10">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(step.titleKey)}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {t(step.descriptionKey)}
                </p>
              </div>

              {/* Arrow (mobile) */}
              {index < steps.length - 1 && (
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowRightIcon className="w-6 h-6 text-gray-300 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
