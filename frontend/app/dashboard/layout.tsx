'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { authApi, statementsApi } from '@/lib/api'

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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              Spendify
            </Link>
            <Link
              href="/dashboard/import"
              className={`text-sm font-medium transition ${
                isFirstTimeUser
                  ? 'bg-blue-600 text-white px-3 py-1.5 rounded-lg animate-pulse hover:bg-blue-700'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isFirstTimeUser ? 'Start Here: Import' : 'Import'}
            </Link>
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
