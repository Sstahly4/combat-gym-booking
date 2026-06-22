'use client'

import { Button } from '@/components/ui/button'
import {
  travelerSessionDescription,
  travelerSessionLabel,
  type TrainingTier,
} from '@/lib/packages/training-access'

export const TRAVELER_SESSION_OPTIONS: {
  value: TrainingTier
  title: string
  description: string
}[] = [
  {
    value: 'once_daily',
    title: travelerSessionLabel('once_daily'),
    description: travelerSessionDescription('once_daily'),
  },
  {
    value: 'twice_daily',
    title: travelerSessionLabel('twice_daily'),
    description: travelerSessionDescription('twice_daily'),
  },
]

export function TrainingSessionSheet({
  value,
  onChange,
  onClose,
}: {
  value: TrainingTier
  onChange: (tier: TrainingTier) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[300]">
      <div className="fixed inset-0 bg-black/50 z-[301]" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[302] flex flex-col max-h-[85dvh]">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold">Sessions per day</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 flex-1 overflow-y-auto space-y-3">
          {TRAVELER_SESSION_OPTIONS.map((opt) => {
            const selected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-colors ${
                  selected
                    ? 'border-[#003580] bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{opt.title}</div>
                <div className="mt-1 text-sm text-gray-600 leading-snug">{opt.description}</div>
              </button>
            )
          })}
        </div>
        <div
          className="px-5 pb-8 flex-shrink-0"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            className="w-full h-11 bg-[#003580] hover:bg-[#003580]/90 font-semibold text-base"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TrainingSessionInlineChoice({
  value,
  onChange,
}: {
  value: TrainingTier
  onChange: (tier: TrainingTier) => void
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TRAVELER_SESSION_OPTIONS.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-left rounded-xl border-2 p-4 transition-colors ${
              selected
                ? 'border-[#003580] bg-blue-50/40'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">{opt.title}</div>
            <div className="mt-1 text-sm text-gray-600 leading-snug">{opt.description}</div>
          </button>
        )
      })}
    </div>
  )
}
