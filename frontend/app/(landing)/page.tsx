'use client'

import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { CTASection } from '@/components/landing/CTASection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <LandingFooter />
    </main>
  )
}
