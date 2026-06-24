'use client'

import { useEffect, useRef } from 'react'
import type { BusynessSource } from '@/lib/gym/busyness-types'

const SOURCE_DESCRIPTIONS: Record<BusynessSource, string> = {
  google: 'Based on Google Popular Times for this gym.',
  nearby_clone: 'Estimated from similar gyms nearby.',
  template: 'Based on a typical training camp schedule.',
  unknown: 'Estimated typical busyness for this gym.',
}

interface MatCapacityInfoPopoverProps {
  open: boolean
  onClose: () => void
  source: BusynessSource
}

export function MatCapacityInfoPopover({
  open,
  onClose,
  source,
}: MatCapacityInfoPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-30 mt-2 w-[min(280px,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-gray-600 shadow-lg"
      role="tooltip"
    >
      <p className="font-medium text-gray-900">Mat Capacity</p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
        {SOURCE_DESCRIPTIONS[source]} Tap a bar to explore hourly patterns. On the
        current hour, a wide ghost bar shows the usual baseline and a thinner bar
        shows live occupancy.
      </p>
    </div>
  )
}
