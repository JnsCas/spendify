import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  language: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  locale: string
  setAuth: (user: User, token: string) => void
  setIsAdmin: (isAdmin: boolean) => void
  setLocale: (locale: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  locale: 'en',
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    const locale = user.language || 'en'
    localStorage.setItem('locale', locale)
    set({ user, token, isAuthenticated: true, locale })
  },
  setIsAdmin: (isAdmin) => {
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin))
    set({ isAdmin })
  },
  setLocale: (locale) => {
    localStorage.setItem('locale', locale)
    set({ locale })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('locale')
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false, locale: 'en' })
  },
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      const isAdminStr = localStorage.getItem('isAdmin')
      const storedLocale = localStorage.getItem('locale')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          const isAdmin = isAdminStr ? JSON.parse(isAdminStr) : false
          const locale = storedLocale || user.language || 'en'
          set({ user, token, isAuthenticated: true, isAdmin, locale })
        } catch {
          // Invalid stored data
        }
      } else if (storedLocale) {
        set({ locale: storedLocale })
      }
    }
  },
}))
