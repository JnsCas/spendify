'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Exclude auth routes from protection
  const isPublicRoute = pathname.startsWith('/auth/')

  useEffect(() => {
    if (!isPublicRoute && typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
      }
    }
  }, [pathname, isPublicRoute, router])

  return <>{children}</>
}
