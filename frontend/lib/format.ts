/**
 * Format a date string according to the specified locale
 * @param dateStr - Date string in ISO format or parseable format
 * @param locale - Locale string ('en' or 'es')
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)

  if (locale === 'es') {
    // Spanish: dd/mm/yyyy
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // English: mm/dd/yyyy
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format a currency value according to the specified locale
 * @param value - Numeric value to format
 * @param currency - Currency code ('ARS' or 'USD')
 * @param locale - Locale string ('en' or 'es')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: 'ARS' | 'USD',
  locale: string
): string {
  // Use appropriate locale for each currency
  const localeMap = {
    ARS: locale === 'es' ? 'es-AR' : 'en-US',
    USD: 'en-US',
  }

  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'ARS' ? 0 : 2,
  }).format(value)
}
