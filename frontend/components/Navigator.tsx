'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ArrowUpTrayIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ArrowUpTrayIcon as ArrowUpTraySolid,
  CreditCardIcon as CreditCardSolid,
  Cog6ToothIcon as Cog6ToothSolid,
} from '@heroicons/react/24/solid'

interface NavigatorProps {
  userName?: string
  isAdmin?: boolean
  isFirstTimeUser?: boolean
  onLogout: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  highlight?: boolean
}

export function Navigator({
  userName,
  isAdmin = false,
  isFirstTimeUser = false,
  onLogout,
}: NavigatorProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      href: '/dashboard/import',
      label: isFirstTimeUser ? 'Start Here' : 'Import',
      icon: ArrowUpTrayIcon,
      activeIcon: ArrowUpTraySolid,
      highlight: isFirstTimeUser,
    },
    {
      href: '/dashboard/cards',
      label: 'Cards',
      icon: CreditCardIcon,
      activeIcon: CreditCardSolid,
    },
    {
      href: '/dashboard/admin',
      label: 'Admin',
      icon: Cog6ToothIcon,
      activeIcon: Cog6ToothSolid,
      adminOnly: true,
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Spendify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {filteredNavItems.map((item) => {
              const active = isActive(item.href)
              const Icon = active ? item.activeIcon : item.icon

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative ml-1 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-300"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-400" />
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                      active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Section - Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            {userName && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-semibold text-gray-700 ring-2 ring-white">
                  {getInitials(userName)}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {userName}
                </span>
              </div>
            )}
            <div className="h-6 w-px bg-gray-200" />
            <button
              onClick={onLogout}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          }`}
        >
          <div className="space-y-1 pt-2">
            {filteredNavItems.map((item) => {
              const active = isActive(item.href)
              const Icon = active ? item.activeIcon : item.icon

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-md"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    <span className="ml-auto flex h-2 w-2">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-yellow-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
                    </span>
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      active ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Mobile User Section */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              {userName && (
                <div className="mb-3 flex items-center gap-3 px-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-semibold text-gray-700">
                    {getInitials(userName)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500">Logged in</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
