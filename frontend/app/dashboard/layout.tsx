'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { authApi, statementsApi } from '@/lib/api'
import { Navigator } from '@/components/Navigator'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isAdmin, logout, hydrate, setIsAdmin } = useAuthStore()
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
      }
    }
  }, [isAuthenticated, router])

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
    router.push('/')
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
