'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon,
  TicketIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { useTranslations } from '@/lib/i18n'
import { ErrorAlert, LoadingSpinner, getTranslatedError } from '../layout'

const INPUT_ICON_CLASS = 'w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'

function PasswordMatchIndicator({ matches }: { matches: boolean }) {
  return matches ? (
    <CheckIcon className="w-5 h-5 text-green-500" />
  ) : (
    <XMarkIcon className="w-5 h-5 text-red-500" />
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const t = useTranslations()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordsMatch = password === confirmPassword
  const showPasswordValidation = confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordsMatch) {
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await authApi.register(email, password, name, inviteCode)
      setAuth(data.user, data.accessToken)
      router.push('/dashboard')
    } catch (err: any) {
      setError(getTranslatedError(err.response?.data?.message, 'auth.registerError', t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.register')}</h1>
        <p className="text-gray-600">{t('auth.createAccountSubtitle')}</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <ErrorAlert message={error} />}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.name')}
            </label>
            <div className="relative">
              <UserIcon className={INPUT_ICON_CLASS} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                required
              />
            </div>
          </div>

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
                minLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <LockClosedIcon className={INPUT_ICON_CLASS} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                  showPasswordValidation
                    ? passwordsMatch
                      ? 'border-green-300 focus:ring-green-500'
                      : 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                minLength={6}
                required
              />
              {showPasswordValidation && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <PasswordMatchIndicator matches={passwordsMatch} />
                </div>
              )}
            </div>
            {showPasswordValidation && !passwordsMatch && (
              <p className="mt-1.5 text-sm text-red-600">{t('auth.passwordsDoNotMatch')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('auth.inviteCode')}
            </label>
            <div className="relative">
              <TicketIcon className={INPUT_ICON_CLASS} />
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={t('auth.inviteCodePlaceholder')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (showPasswordValidation && !passwordsMatch)}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner />
                {t('common.loading')}
              </span>
            ) : (
              t('auth.registerButton')
            )}
          </button>
        </form>
      </div>

      {/* Sign In Link */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          {t('auth.hasAccount')}{' '}
          <Link
            href="/auth/login"
            className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
          >
            {t('auth.loginLink')}
          </Link>
        </p>
      </div>
    </>
  )
}
