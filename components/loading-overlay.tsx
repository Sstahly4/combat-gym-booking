'use client'

import { useState, useEffect } from 'react'

interface LoadingOverlayProps {
  show: boolean
  /** Tailwind z-index class — defaults to z-50 for pages, pass z-[220] for modals */
  zClass?: string
}

export function LoadingOverlay({ show, zClass = 'z-50' }: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(show)
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setMounted(true)
      // One frame delay so the opacity transition fires on mount
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    } else if (mounted) {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(t)
    }
  }, [show]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 ${zClass} bg-white/55 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex gap-2 pointer-events-none">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
