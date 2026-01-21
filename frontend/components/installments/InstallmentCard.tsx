import type { InstallmentDetail } from '@/lib/types/installments'

interface InstallmentCardProps {
  installment: InstallmentDetail
}

export function InstallmentCard({ installment }: InstallmentCardProps) {
  const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Active
          </span>
        )
      case 'completing':
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Completing
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Completed
          </span>
        )
    }
  }

  const progress = (installment.currentInstallment / installment.totalInstallments) * 100

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{installment.description}</h3>
          {installment.purchaseDate && (
            <p className="mt-1 text-xs text-gray-500">
              {new Date(installment.purchaseDate).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        {getStatusBadge(installment.status)}
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span>
            {installment.currentInstallment}/{installment.totalInstallments}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Remaining:</span>
          <div className="text-right">
            {installment.remainingAmountArs !== null && installment.remainingAmountArs > 0 && (
              <div className="text-sm font-medium text-blue-600">
                {formatCurrency(installment.remainingAmountArs, 'ARS')}
              </div>
            )}
            {installment.remainingAmountUsd !== null && installment.remainingAmountUsd > 0 && (
              <div className="text-sm font-medium text-emerald-600">
                {formatCurrency(installment.remainingAmountUsd, 'USD')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Monthly:</span>
          <div className="text-right">
            {installment.monthlyAmountArs !== null && installment.monthlyAmountArs > 0 && (
              <div className="text-sm text-gray-600">
                {formatCurrency(installment.monthlyAmountArs, 'ARS')}
              </div>
            )}
            {installment.monthlyAmountUsd !== null && installment.monthlyAmountUsd > 0 && (
              <div className="text-sm text-gray-600">
                {formatCurrency(installment.monthlyAmountUsd, 'USD')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Months Left:</span>
          <span className="text-sm font-medium text-gray-900">
            {installment.remainingMonths}
          </span>
        </div>

        {installment.card && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Card:</span>
            <span className="text-sm text-gray-900">
              {installment.card.customName || `****${installment.card.lastFourDigits}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
