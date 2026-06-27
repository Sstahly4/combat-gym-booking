'use client'

import { OfferStepper } from '@/components/manage/offer-stepper'
import type { Package } from '@/lib/types/database'
import { ChevronRight } from 'lucide-react'

/** Below Partner Hub navbar (+ mobile hub bar); matches manage sidebar offsets. */
export const PACKAGE_EDITOR_CHROME =
  'fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-white top-32 md:left-56 md:top-20'

function PackageEditorHeader({
  onClose,
  title,
  subtitle,
}: {
  onClose: () => void
  title: string
  subtitle?: string
}) {
  return (
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
          <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
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
    <div className={PACKAGE_EDITOR_CHROME}>
      <PackageEditorHeader onClose={onClose} title={pkg.name} subtitle="Edit package" />
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
    </div>
  )
}

export function PackageCreateShell({
  gymId,
  currency,
  onClose,
  onComplete,
}: {
  gymId: string
  currency: string
  onClose: () => void
  onComplete: () => void
}) {
  return (
    <div className={PACKAGE_EDITOR_CHROME}>
      <PackageEditorHeader onClose={onClose} title="New Offer" />
      <OfferStepper
        gymId={gymId}
        currency={currency}
        onComplete={() => {
          onComplete()
          onClose()
        }}
      />
    </div>
  )
}
