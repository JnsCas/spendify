/**
 * Auth Store Tests
 *
 * Tests authentication state management using Zustand.
 * Focuses on user flows: login, logout, and state persistence.
 */

import { useAuthStore } from '@/lib/store'
import { renderHook, act } from '@testing-library/react'

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  describe('Authentication Flow', () => {
    it('should start unauthenticated', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should authenticate user on login', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      act(() => {
        result.current.setAuth(mockUser, 'jwt-token')
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('jwt-token')
    })

    it('should clear auth state on logout', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setAuth(
          { id: '1', email: 'test@test.com', name: 'Test' },
          'token'
        )
        result.current.setIsAdmin(true)
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(result.current.isAdmin).toBe(false)
    })
  })

  describe('Admin Role', () => {
    it('should start as non-admin', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.isAdmin).toBe(false)
    })

    it('should set admin status', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.setIsAdmin(true)
      })

      expect(result.current.isAdmin).toBe(true)
    })
  })

  describe('State Persistence', () => {
    it('should persist auth state to localStorage', () => {
      const { result } = renderHook(() => useAuthStore())
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' }

      act(() => {
        result.current.setAuth(mockUser, 'token-123')
        result.current.setIsAdmin(true)
      })

      // Verify localStorage has the data
      expect(localStorage.getItem('token')).toBe('token-123')
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
      expect(localStorage.getItem('isAdmin')).toBe('true')
    })

    it('should restore auth state from localStorage', () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Test' }
      localStorage.setItem('token', 'stored-token')
      localStorage.setItem('user', JSON.stringify(mockUser))
      localStorage.setItem('isAdmin', 'true')

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.hydrate()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.token).toBe('stored-token')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isAdmin).toBe(true)
    })

    it('should handle invalid data in localStorage gracefully', () => {
      localStorage.setItem('token', 'valid-token')
      localStorage.setItem('user', 'invalid-json{')

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.hydrate()
      })

      // Should not throw and should remain unauthenticated
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should clear localStorage on logout', () => {
      localStorage.setItem('token', 'token')
      localStorage.setItem('user', '{}')
      localStorage.setItem('isAdmin', 'true')

      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.logout()
      })

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      expect(localStorage.getItem('isAdmin')).toBeNull()
    })
  })
})
