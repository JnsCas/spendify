import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (user: User, token: string) => void
  setIsAdmin: (isAdmin: boolean) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isAdmin: false,
  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },
  setIsAdmin: (isAdmin) => {
    localStorage.setItem('isAdmin', JSON.stringify(isAdmin))
    set({ isAdmin })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false })
  },
  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      const isAdminStr = localStorage.getItem('isAdmin')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          const isAdmin = isAdminStr ? JSON.parse(isAdminStr) : false
          set({ user, token, isAuthenticated: true, isAdmin })
        } catch {
          // Invalid stored data
        }
      }
    }
  },
}))
