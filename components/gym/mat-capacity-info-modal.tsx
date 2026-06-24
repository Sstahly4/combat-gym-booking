'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { BusynessSource } from '@/lib/gym/busyness-types'

const SOURCE_DESCRIPTIONS: Record<BusynessSource, string> = {
  google: 'Based on Google Popular Times for this gym.',
  nearby_clone: 'Estimated from similar gyms nearby.',
  template: 'Based on a typical training camp schedule.',
  unknown: 'Estimated typical busyness for this gym.',
}

interface MatCapacityInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: BusynessSource
}

export function MatCapacityInfoModal({
  open,
  onOpenChange,
  source,
}: MatCapacityInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} stackClassName="z-[200]">
      <DialogContent className="max-w-sm rounded-2xl border border-gray-200 p-0 shadow-xl [&>button]:hidden">
        <DialogTitle className="sr-only">About Mat Capacity</DialogTitle>
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Mat Capacity</h2>
          <p className="mt-1 text-sm text-gray-500">{SOURCE_DESCRIPTIONS[source]}</p>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm text-gray-600">
          <p>
            See when the mats are usually quiet or packed across the week. Tap a day to
            compare hourly patterns.
          </p>
          <p>
            <span className="font-medium text-gray-800">Live</span> shows how busy the gym
            is right now. The current hour highlights in red when mats are usually full.
          </p>
        </div>
        <div className="border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
