'use client'

import { cn } from '@/lib/utils'
import {
  TRAINING_ACCESS_OPTIONS,
  normalizeTrainingAccess,
  type PackageTrainingAccess,
} from '@/lib/packages/training-access'

export function TrainingAccessPicker({
  value,
  onChange,
  className,
}: {
  value: PackageTrainingAccess | null
  onChange: (value: PackageTrainingAccess) => void
  className?: string
}) {
  const normalizedValue = normalizeTrainingAccess(value)
  return (
    <div className={cn('space-y-2', className)}>
      {TRAINING_ACCESS_OPTIONS.map((option) => {
        const selected = normalizedValue === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'w-full rounded-lg border p-4 text-left transition-colors',
              selected
                ? 'border-[#003580] bg-blue-50/60 ring-1 ring-[#003580]/20'
                : 'border-gray-200 bg-white hover:border-gray-300',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{option.label}</span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {option.subtitle}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{option.description}</p>
              </div>
              <span
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 rounded-full border',
                  selected ? 'border-[#003580] bg-[#003580]' : 'border-gray-300 bg-white',
                )}
                aria-hidden
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
