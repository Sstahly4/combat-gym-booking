'use client'

import { ChevronRight } from 'lucide-react'
import {
  buildArrivalInfoAccordion,
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

  const subtitle = gym.address?.trim() || [gym.city, gym.country].filter(Boolean).join(', ')

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-2">Arrival info</div>
        <div className="text-sm text-gray-600 leading-snug line-clamp-2">
          {subtitle || 'Directions, hours, and what to bring'}
        </div>
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
  const sections = buildArrivalInfoAccordion(gym)

  return (
    <CheckoutBottomSheet
      title="Arrival info"
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
