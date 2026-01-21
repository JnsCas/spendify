'use client'

interface InstallmentFiltersProps {
  selectedStatus: 'all' | 'active' | 'completing' | 'completed'
  onStatusChange: (status: 'all' | 'active' | 'completing' | 'completed') => void
}

export function InstallmentFilters({ selectedStatus, onStatusChange }: InstallmentFiltersProps) {
  const tabs = [
    { value: 'all' as const, label: 'All' },
    { value: 'active' as const, label: 'Active' },
    { value: 'completing' as const, label: 'Completing' },
    { value: 'completed' as const, label: 'Completed' },
  ]

  return (
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
  )
}
