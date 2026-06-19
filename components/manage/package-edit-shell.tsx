'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OfferStepper } from '@/components/manage/offer-stepper'
import type { Package } from '@/lib/types/database'
import { ChevronRight } from 'lucide-react'

/** Below Partner Hub navbar (+ mobile hub bar); matches manage sidebar offsets. */
export const PACKAGE_EDITOR_CHROME =
  'fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-gray-50 top-32 md:left-56 md:top-20'

const HUB_MAIN_SCROLL_SELECTORS = '[data-manage-main-scroll], [data-admin-hub-main-scroll]'

function usePackageEditorScrollLock() {
  useEffect(() => {
    const scrollEls = Array.from(
      document.querySelectorAll<HTMLElement>(HUB_MAIN_SCROLL_SELECTORS)
    )
    const prevBodyOverflow = document.body.style.overflow
    const prevScrollOverflows = scrollEls.map((el) => el.style.overflow)

    document.body.style.overflow = 'hidden'
    for (const el of scrollEls) el.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      scrollEls.forEach((el, index) => {
        el.style.overflow = prevScrollOverflows[index] ?? ''
      })
    }
  }, [])
}

/** Full-viewport package editor shell — portaled so gym edit form content cannot bleed through. */
export function PackageEditorOverlay({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  usePackageEditorScrollLock()

  if (!mounted) return null

  return createPortal(
    <div className={PACKAGE_EDITOR_CHROME} role="dialog" aria-modal="true">
      {children}
    </div>,
    document.body
  )
}

export function PackageEditShell({
  gymId,
  currency,
  package: pkg,
  onClose,
  onUpdated,
}: {
  gymId: string
  currency: string
  package: Package
  onClose: () => void
  onUpdated: () => void
}) {
  return (
    <PackageEditorOverlay>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to packages
          </button>
          <span className="text-sm text-gray-300">|</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{pkg.name}</p>
            <p className="text-xs text-gray-500">Edit package</p>
          </div>
        </div>
      </div>

      <OfferStepper
        gymId={gymId}
        currency={currency}
        existingPackage={pkg}
        embedded
        onComplete={() => {
          onUpdated()
          onClose()
        }}
      />
    </PackageEditorOverlay>
  )
}
