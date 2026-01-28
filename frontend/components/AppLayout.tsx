'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authApi, statementsApi } from '@/lib/api'
import { Navigator } from '@/components/Navigator'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const { user, isAuthenticated, isAdmin, logout, hydrate, setIsAdmin } = useAuthStore()
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await authApi.me()
        setIsAdmin(data.isAdmin)
      } catch {
        // Ignore errors - user might not be logged in yet
      }
    }
    if (isAuthenticated) {
      fetchMe()
    }
  }, [isAuthenticated, setIsAdmin])

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      const response = await statementsApi.hasAny()
      setIsFirstTimeUser(!response.hasStatements)
    }
    if (isAuthenticated) {
      checkFirstTimeUser()
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigator
        userName={user?.name}
        isAdmin={isAdmin}
        isFirstTimeUser={isFirstTimeUser}
        onLogout={handleLogout}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
