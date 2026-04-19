'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const STORAGE_KEY = 'manage_dismiss_no_bookings_hint'

export function DashboardNoBookingsToast({
  show,
  previewHref,
}: {
  show: boolean
  previewHref: string
}) {
  const [visible, setVisible] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (!show) {
      setVisible(false)
      setEntered(false)
      return
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setVisible(false)
        return
      }
    } catch {
      /* ignore */
    }
    // Stagger after mount so the slide-in is noticeable on every navigation (host uses key=pathname).
    const t = window.setTimeout(() => setVisible(true), 320)
    return () => window.clearTimeout(t)
  }, [show])

  useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    // Reset off-screen, then animate in (pairs with transition on the wrapper).
    setEntered(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(id)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    setEntered(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (!visible) return null

  return (
    <div
      role="status"
      className={`pointer-events-auto fixed right-4 top-20 z-50 max-w-sm transition-all duration-300 ease-out md:right-8 ${
        entered ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-x-2 -translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white py-3 pl-4 pr-2 shadow-lg ring-1 ring-black/5">
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">No bookings yet</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Finish your listing and go live to receive requests.{' '}
            <Link href={previewHref} className="font-medium text-[#003580] underline underline-offset-2">
              Preview listing
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
