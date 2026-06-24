'use client'

import { useEffect, useRef } from 'react'

interface MatCapacityInfoPopoverProps {
  open: boolean
  onClose: () => void
}

export function MatCapacityInfoPopover({ open, onClose }: MatCapacityInfoPopoverProps) {
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
      className="absolute left-0 top-full z-30 mt-2 w-[min(240px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-600 shadow-lg"
      role="tooltip"
    >
      Based on visits to this place
    </div>
  )
}
