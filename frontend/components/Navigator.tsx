'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ArrowUpTrayIcon,
  CreditCardIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ArrowUpTrayIcon as ArrowUpTraySolid,
  CreditCardIcon as CreditCardSolid,
  BanknotesIcon as BanknotesSolid,
  Cog6ToothIcon as Cog6ToothSolid,
} from '@heroicons/react/24/solid'
import { useTranslations } from '@/lib/i18n'
import { AppIcon } from '@/components/AppIcon'
import clsx from 'clsx'

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

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  onClick?: () => void
  isMobile?: boolean
}

function PulsingBadge({ small }: { small?: boolean }) {
  return (
    <span className={clsx('flex', small ? 'h-2 w-2 ml-auto' : 'h-3 w-3 absolute -right-1 -top-1')}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
      <span className={clsx('relative inline-flex rounded-full bg-yellow-400', small ? 'h-2 w-2' : 'h-3 w-3')} />
    </span>
  )
}

function HighlightedNavLink({ item, onClick, isMobile }: NavLinkProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        'group relative flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-medium text-white shadow-md transition-all duration-200',
        isMobile
          ? 'rounded-xl px-4 py-3 gap-3'
          : 'rounded-full px-4 py-2 ml-1 shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300'
      )}
    >
      <Icon className={clsx(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
      <span>{item.label}</span>
      <PulsingBadge small={isMobile} />
    </Link>
  )
}

function RegularNavLink({ item, isActive, onClick, isMobile }: NavLinkProps) {
  const Icon = isActive ? item.activeIcon : item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        'group flex items-center text-sm font-medium transition-all duration-200',
        isMobile ? 'gap-3 rounded-xl px-4 py-3' : 'gap-2 rounded-lg px-3 py-2',
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : isMobile
          ? 'text-gray-600 hover:bg-gray-50'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon
        className={clsx(
          'h-5 w-5',
          !isMobile && 'transition-transform duration-200 group-hover:scale-110',
          isActive ? 'text-indigo-600' : isMobile ? 'text-gray-400' : 'text-gray-400 group-hover:text-gray-600'
        )}
      />
      <span>{item.label}</span>
    </Link>
  )
}

function NavItemLink(props: NavLinkProps) {
  if (props.item.highlight) {
    return <HighlightedNavLink {...props} />
  }
  return <RegularNavLink {...props} />
}

interface UserAvatarProps {
  userName: string
  size?: 'small' | 'medium'
}

function UserAvatar({ userName, size = 'small' }: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 font-semibold text-gray-700',
        size === 'medium' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs ring-2 ring-white'
      )}
    >
      {getInitials(userName)}
    </div>
  )
}

interface UserSectionProps {
  userName?: string
  onLogout: () => void
  isMobile?: boolean
  t: (key: string) => string
}

function UserSection({ userName, onLogout, isMobile, t }: UserSectionProps) {
  if (isMobile) {
    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        {userName && (
          <Link
            href="/profile"
            className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50"
          >
            <UserAvatar userName={userName} size="medium" />
            <div>
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{t('common.loggedIn')}</p>
            </div>
          </Link>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span>{t('common.logout')}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      {userName && (
        <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100">
          <UserAvatar userName={userName} />
          <span className="text-sm font-medium text-gray-700">{userName}</span>
        </Link>
      )}
      <div className="h-6 w-px bg-gray-200" />
      <button
        onClick={onLogout}
        className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
        <span>{t('common.logout')}</span>
      </button>
    </div>
  )
}

export function Navigator({
  userName,
  isAdmin = false,
  isFirstTimeUser = false,
  onLogout,
}: NavigatorProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations()

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      href: '/import',
      label: isFirstTimeUser ? t('nav.startHere') : t('nav.import'),
      icon: ArrowUpTrayIcon,
      activeIcon: ArrowUpTraySolid,
      highlight: isFirstTimeUser,
    },
    {
      href: '/cards',
      label: t('nav.cards'),
      icon: CreditCardIcon,
      activeIcon: CreditCardSolid,
    },
    {
      href: '/installments',
      label: t('nav.installments'),
      icon: BanknotesIcon,
      activeIcon: BanknotesSolid,
    },
    {
      href: '/admin',
      label: t('nav.admin'),
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

  const handleMobileNavClick = () => setMobileMenuOpen(false)
  const handleMobileLogout = () => {
    setMobileMenuOpen(false)
    onLogout()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
          >
            <AppIcon size="small" />
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Spendify
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {filteredNavItems.map((item) => (
              <NavItemLink key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>

          <UserSection userName={userName} onLogout={onLogout} t={t} />

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
            aria-label={mobileMenuOpen ? t('common.closeMenu') : t('common.openMenu')}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        <div
          className={clsx(
            'overflow-hidden transition-all duration-300 ease-in-out md:hidden',
            mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          )}
        >
          <div className="space-y-1 pt-2">
            {filteredNavItems.map((item) => (
              <NavItemLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleMobileNavClick}
                isMobile
              />
            ))}

            <UserSection userName={userName} onLogout={handleMobileLogout} isMobile t={t} />
          </div>
        </div>
      </div>
    </nav>
  )
}
