import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

interface AppIconProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function AppIcon({ size = 'medium', className = '' }: AppIconProps) {
  const sizeClasses = {
    small: 'h-9 w-9',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  }

  const iconSizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-11 w-11',
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200`}
    >
      <CurrencyDollarIcon className={`${iconSizeClasses[size]} text-white`} />
    </div>
  )
}
