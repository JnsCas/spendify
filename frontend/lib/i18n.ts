import { useAuthStore } from './store'
import enMessages from '../messages/en.json'
import esMessages from '../messages/es.json'

type Messages = typeof enMessages
type MessageKey = string

const messages: Record<string, Messages> = {
  en: enMessages,
  es: esMessages,
}

/**
 * Get a nested property from an object using dot notation
 * Example: getNested(obj, 'profile.title') => obj.profile.title
 */
function getNested(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Hook to use translations in components
 * Usage:
 *   const t = useTranslations()
 *   return <h1>{t('profile.title')}</h1>
 */
export function useTranslations() {
  const locale = useAuthStore((state) => state.locale)
  const translations = messages[locale] || messages.en

  return (key: MessageKey, replacements?: Record<string, string | number>): string => {
    let text = getNested(translations, key) || key

    // Replace placeholders like {count} with actual values
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value))
      })
    }

    return text
  }
}

/**
 * Hook to get the current locale
 */
export function useLocale(): string {
  return useAuthStore((state) => state.locale)
}

/**
 * Hook to get available locales
 */
export function useLocales(): string[] {
  return ['en', 'es']
}

/**
 * Get month names for the current locale
 */
export function useMonthNames(): string[] {
  const t = useTranslations()
  return [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december'),
  ]
}

/**
 * Get short month names for the current locale
 */
export function useMonthNamesShort(): string[] {
  const t = useTranslations()
  return [
    t('months.jan'),
    t('months.feb'),
    t('months.mar'),
    t('months.apr'),
    t('months.may_short'),
    t('months.jun'),
    t('months.jul'),
    t('months.aug'),
    t('months.sep'),
    t('months.oct'),
    t('months.nov'),
    t('months.dec'),
  ]
}
