'use client'

import type { InstallmentDetail, InstallmentCard as CardType } from '@/lib/types/installments'
import { formatCurrency } from '@/lib/utils/currency'
import { useTranslations } from '@/lib/i18n'

interface InstallmentCardProps {
  installment: InstallmentDetail
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {t('installments.status.active')}
        </span>
      )
    case 'completing':
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
          {t('installments.status.completing')}
        </span>
      )
    default:
      return null
  }
}

function InstallmentHeader({
  description,
  purchaseDate,
  status,
  t,
  locale,
}: {
  description: string
  purchaseDate: string | null
  status: string
  t: (key: string) => string
  locale: string
}) {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{description}</h3>
        {purchaseDate && (
          <p className="mt-1 text-xs text-gray-500">
            {new Date(purchaseDate).toLocaleDateString(locale)}
          </p>
        )}
      </div>
      <StatusBadge status={status} t={t} />
    </div>
  )
}

function ProgressBar({
  current,
  total,
  t,
}: {
  current: number
  total: number
  t: (key: string) => string
}) {
  const progress = (current / total) * 100

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{t('installments.progress')}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function AmountRow({
  label,
  arsAmount,
  usdAmount,
  variant = 'default',
}: {
  label: string
  arsAmount: number | null
  usdAmount: number | null
  variant?: 'default' | 'monthly'
}) {
  const arsColorClass =
    variant === 'monthly' ? 'text-blue-600 font-medium' : 'text-gray-600'
  const usdColorClass =
    variant === 'monthly' ? 'text-emerald-600 font-medium' : 'text-gray-600'

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}:</span>
      <div className="text-right">
        {arsAmount !== null && arsAmount > 0 && (
          <div className={`text-sm ${arsColorClass}`}>
            {formatCurrency(arsAmount, 'ARS')}
          </div>
        )}
        {usdAmount !== null && usdAmount > 0 && (
          <div className={`text-sm ${usdColorClass}`}>
            {formatCurrency(usdAmount, 'USD')}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

function CardInfo({ card, t }: { card: CardType | null; t: (key: string) => string }) {
  if (!card) return null

  return (
    <InfoRow
      label={t('installments.card')}
      value={card.customName || `****${card.lastFourDigits || '0000'}`}
    />
  )
}

export function InstallmentCard({ installment }: InstallmentCardProps) {
  const t = useTranslations()
  const locale = t('_locale') as string

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <InstallmentHeader
        description={installment.description}
        purchaseDate={installment.purchaseDate}
        status={installment.status}
        t={t}
        locale={locale}
      />

      <ProgressBar
        current={installment.currentInstallment}
        total={installment.totalInstallments}
        t={t}
      />

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <AmountRow
          label={t('installments.monthly')}
          arsAmount={installment.monthlyAmountArs}
          usdAmount={installment.monthlyAmountUsd}
          variant="monthly"
        />

        <AmountRow
          label={t('installments.remaining')}
          arsAmount={installment.remainingAmountArs}
          usdAmount={installment.remainingAmountUsd}
        />

        <InfoRow label={t('installments.monthsLeft')} value={installment.remainingMonths} />

        <CardInfo card={installment.card} t={t} />
      </div>
    </div>
  )
}
