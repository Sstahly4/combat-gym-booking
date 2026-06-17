'use client'

import { cn } from '@/lib/utils'
import {
  TRAINING_ACCESS_OPTIONS,
  type TrainingTierOptions,
} from '@/lib/packages/training-access'

export function TrainingAccessPicker({
  value,
  onChange,
  className,
}: {
  value: TrainingTierOptions
  onChange: (value: TrainingTierOptions) => void
  className?: string
}) {
  const toggle = (tier: keyof TrainingTierOptions, checked: boolean) => {
    const next = { ...value, [tier]: checked }
    if (!next.twice_daily && !next.once_daily) return
    onChange(next)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {TRAINING_ACCESS_OPTIONS.map((option) => {
        const selected = value[option.value]
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
              selected
                ? 'border-[#003580] bg-blue-50/60 ring-1 ring-[#003580]/20'
                : 'border-gray-200 bg-white hover:border-gray-300',
            )}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => toggle(option.value, e.target.checked)}
              className="mt-1 rounded"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {option.subtitle}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{option.description}</p>
            </div>
          </label>
        )
      })}
    </div>
  )
}
