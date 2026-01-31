'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { ErrorAlert, LoadingSpinner, getTranslatedError } from '../layout'

const INPUT_ICON_CLASS = 'w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const t = useTranslations()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authApi.login(email, password)
      setAuth(data.user, data.accessToken)
      router.push('/dashboard')
    } catch (err: any) {
      setError(getTranslatedError(err.response?.data?.message, 'auth.loginError', t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.login')}</h1>
        <p className="text-gray-600">{t('auth.signInToAccount')}</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorAlert message={error} />}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <EnvelopeIcon className={INPUT_ICON_CLASS} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <LockClosedIcon className={INPUT_ICON_CLASS} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner />
                {t('common.loading')}
              </span>
            ) : (
              t('auth.loginButton')
            )}
          </button>
        </form>
      </div>

      {/* Sign Up Link */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          {t('auth.noAccount')}{' '}
          <Link
            href="/auth/register"
            className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
          >
            {t('auth.registerLink')}
          </Link>
        </p>
      </div>
    </>
  )
}
