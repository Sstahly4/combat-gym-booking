'use client'

import { ChevronRight } from 'lucide-react'
import {
  buildArrivalInfoSections,
  hasArrivalInfo,
  type ArrivalInfoGym,
} from '@/lib/booking/arrival-info'
import { CheckoutBottomSheet } from '@/components/booking/checkout-bottom-sheet'
import { CheckoutAccordion } from '@/components/booking/checkout-accordion'

export function CheckoutArrivalInfoRow({
  gym,
  onOpen,
}: {
  gym: ArrivalInfoGym
  onOpen: () => void
}) {
  if (!hasArrivalInfo(gym)) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-2">Arrival info</div>
        <div className="text-sm text-gray-600">Address, hours, and how to get there</div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-900 shrink-0" />
    </button>
  )
}

export function CheckoutArrivalInfoSheet({
  gym,
  onClose,
}: {
  gym: ArrivalInfoGym
  onClose: () => void
}) {
  const sections = buildArrivalInfoSections(gym)
  if (sections.length === 0) return null

  const accordionSections = [
    {
      items: sections.map((section) => ({
        id: section.label,
        title: section.label,
        subtitle: section.value.split('\n')[0],
        body: section.href
          ? 'Open the link below for directions or to call the gym on arrival.'
          : section.value,
        link: section.href
          ? { href: section.href, label: section.value }
          : undefined,
      })),
      footerText:
        'Exact check-in instructions may be confirmed by the gym after your booking is complete.',
    },
  ]

  return (
    <CheckoutBottomSheet
      title="Arrival info"
      primaryLabel="Done"
      onPrimary={onClose}
      onCancel={onClose}
      onClose={onClose}
    >
      <CheckoutAccordion sections={accordionSections} />
      <div className="flex-1 min-h-0" aria-hidden />
    </CheckoutBottomSheet>
  )
}
