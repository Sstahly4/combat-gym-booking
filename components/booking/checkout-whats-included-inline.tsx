'use client'

import { ChevronRight } from 'lucide-react'
import type { Gym, Package, PackageVariant } from '@/lib/types/database'
import {
  buildPackageInclusionAccordion,
  buildPackageInclusionLines,
} from '@/lib/booking/package-inclusions'
import { CheckoutBottomSheet } from '@/components/booking/checkout-bottom-sheet'
import { CheckoutAccordion } from '@/components/booking/checkout-accordion'

function inclusionSummary(
  lines: string[],
  maxParts = 2
): string {
  if (lines.length === 0) return ''
  if (lines.length <= maxParts) return lines.join(' · ')
  return `${lines.slice(0, maxParts).join(' · ')} +${lines.length - maxParts} more`
}

export function CheckoutWhatsIncludedRow({
  package_,
  gym,
  variant,
  onOpen,
}: {
  package_: Package
  gym: Pick<Gym, 'amenities'> & { training_schedule?: Gym['training_schedule'] }
  variant?: PackageVariant | null
  onOpen: () => void
}) {
  const lines = buildPackageInclusionLines(package_, gym, variant)
  if (lines.length === 0) return null

  const summary = inclusionSummary(lines)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-2">What&apos;s included</div>
        <div className="text-sm text-gray-600 leading-snug line-clamp-2">{summary}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-900 shrink-0" />
    </button>
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
