'use client'

import { ChevronRight } from 'lucide-react'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import {
  buildPackageInclusionAccordion,
  buildPackageInclusionLines,
} from '@/lib/booking/package-inclusions'
import { CheckoutBottomSheet } from '@/components/booking/checkout-bottom-sheet'
import { CheckoutAccordion } from '@/components/booking/checkout-accordion'

export function CheckoutWhatsIncludedInline({
  package_,
  gym,
  variant,
  onOpenDetails,
}: {
  package_: Package
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] }
  variant?: PackageVariant | null
  onOpenDetails: () => void
}) {
  const lines = buildPackageInclusionLines(package_, gym, variant)
  if (lines.length === 0) return null

  return (
    <div className="border border-gray-200 rounded-xl px-4 py-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">What&apos;s included</h2>
      <ul className="space-y-2 text-sm text-gray-700">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2 leading-snug">
            <span className="text-gray-900 shrink-0" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onOpenDetails}
        className="mt-4 w-full flex items-center justify-between gap-3 text-sm font-semibold text-gray-900 pt-3 border-t border-gray-100 hover:text-gray-700 transition-colors"
      >
        <span>Learn more about what&apos;s included</span>
        <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
      </button>
    </div>
  )
}

export function CheckoutWhatsIncludedSheet({
  package_,
  gym,
  variant,
  onClose,
}: {
  package_: Package
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] }
  variant?: PackageVariant | null
  onClose: () => void
}) {
  const sections = buildPackageInclusionAccordion(package_, gym, variant)
  if (sections.length === 0) return null

  return (
    <CheckoutBottomSheet
      title="What's included"
      primaryLabel="Done"
      onPrimary={onClose}
      onCancel={onClose}
      onClose={onClose}
    >
      <CheckoutAccordion sections={sections} />
      <div className="flex-1 min-h-0" aria-hidden />
    </CheckoutBottomSheet>
  )
}
