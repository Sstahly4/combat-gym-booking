'use client'

import { Check, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  PACKAGE_CANCELLATION_PRESETS,
  getOwnerCancellationPreviewLine,
  type PackageCancellationPresetId,
} from '@/lib/manage/package-cancellation-policy-presets'

export function PackageCancellationPolicyFields({
  presetId,
  customDays,
  onPresetChange,
  onCustomDaysChange,
  className,
}: {
  presetId: PackageCancellationPresetId
  customDays: string
  onPresetChange: (presetId: PackageCancellationPresetId) => void
  onCustomDaysChange: (value: string) => void
  className?: string
}) {
  const previewLine = getOwnerCancellationPreviewLine(presetId, customDays)
  const customInvalid = presetId === 'custom' && customDays.trim() !== '' && !previewLine.startsWith('Guests will see:')

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-semibold text-gray-900">Cancellation policy</Label>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          Choose when guests can cancel for a full refund before check-in. This appears on your listing,
          checkout, and booking confirmations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PACKAGE_CANCELLATION_PRESETS.map((preset) => {
          const selected = presetId === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetChange(preset.id)}
              className={cn(
                'rounded-xl border-2 p-4 text-left transition-colors touch-manipulation',
                selected
                  ? 'border-[#003580] bg-[#003580]/[0.04]'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{preset.label}</p>
                  <p className="mt-1 text-xs text-gray-600 leading-snug">{preset.description}</p>
                  <p className="mt-2 text-[11px] font-medium text-[#003580]">{preset.guestSummary}</p>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-[#003580]" aria-hidden />}
              </div>
            </button>
          )
        })}

        <button
          type="button"
          onClick={() => onPresetChange('custom')}
          className={cn(
            'rounded-xl border-2 p-4 text-left transition-colors touch-manipulation sm:col-span-2',
            presetId === 'custom'
              ? 'border-[#003580] bg-[#003580]/[0.04]'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Custom</p>
              <p className="mt-1 text-xs text-gray-600 leading-snug">
                Set your own free-cancellation window (number of full days before check-in).
              </p>
            </div>
            {presetId === 'custom' && <Check className="h-4 w-4 shrink-0 text-[#003580]" aria-hidden />}
          </div>
          {presetId === 'custom' && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="sm:max-w-[12rem] w-full">
                <Label htmlFor="custom-cancellation-days" className="text-xs text-gray-600">
                  Days before check-in
                </Label>
                <Input
                  id="custom-cancellation-days"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={customDays}
                  onChange={(e) => onCustomDaysChange(e.target.value)}
                  placeholder="e.g. 10"
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-gray-500 sm:pb-2">
                Guest receives a full refund if they cancel before this many days before arrival.
              </p>
            </div>
          )}
        </button>
      </div>

      <div
        className={cn(
          'flex gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
          customInvalid
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-gray-200 bg-gray-50 text-gray-700'
        )}
      >
        <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <p>{previewLine}</p>
      </div>
    </div>
  )
}
