'use client'

interface InstallmentFiltersProps {
  selectedStatus: 'all' | 'active' | 'completing'
  onStatusChange: (status: 'all' | 'active' | 'completing') => void
}

export function InstallmentFilters({ selectedStatus, onStatusChange }: InstallmentFiltersProps) {
  const tabs = [
    { value: 'all' as const, label: 'All', description: null },
    { value: 'active' as const, label: 'Active', description: 'Ongoing installments with remaining payments' },
    { value: 'completing' as const, label: 'Completing', description: 'Final payment is due this month' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedStatus === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {selectedStatus !== 'all' && (
        <p className="text-xs text-gray-500">
          {tabs.find((t) => t.value === selectedStatus)?.description}
        </p>
      )}
    </div>
  )
}
