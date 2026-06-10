'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Package } from '@/lib/types/database'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'
import { getCheckoutCancellationCopy } from '@/lib/booking/checkout-cancellation-copy'
import { CheckoutBottomSheet } from '@/components/booking/checkout-bottom-sheet'
import { CheckoutAccordion } from '@/components/booking/checkout-accordion'
import { CheckoutCancellationFullPolicySheet } from '@/components/booking/checkout-cancellation-full-policy'

export function CheckoutCancellationPolicyRow({
  package_,
  checkin,
  gymPolicyTone,
  onOpen,
}: {
  package_: Package
  checkin: string
  gymPolicyTone?: GymCancellationPolicyTone | null
  onOpen: () => void
}) {
  const copy = getCheckoutCancellationCopy({
    checkin,
    packageCancellationPolicyDays: package_.cancellation_policy_days,
    gymPolicyTone: gymPolicyTone ?? null,
  })

  if (!copy) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-gray-200 rounded-xl px-4 py-4 text-left flex items-center justify-between gap-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-900 mb-2">Cancellation policy</div>
        <div className="text-sm text-gray-600 leading-snug">{copy.summary}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-900 shrink-0" />
    </button>
  )
}

export function CheckoutCancellationPolicySheet({
  package_,
  checkin,
  gymPolicyTone,
  onClose,
}: {
  package_: Package
  checkin: string
  gymPolicyTone?: GymCancellationPolicyTone | null
  onClose: () => void
}) {
  const [fullPolicyOpen, setFullPolicyOpen] = useState(false)
  const copy = getCheckoutCancellationCopy({
    checkin,
    packageCancellationPolicyDays: package_.cancellation_policy_days,
    gymPolicyTone: gymPolicyTone ?? null,
  })

  if (!copy) return null

  const handleClose = () => {
    if (fullPolicyOpen) {
      setFullPolicyOpen(false)
      return
    }
    onClose()
  }

  return (
    <>
      <CheckoutBottomSheet
        title="Cancellation policy"
        primaryLabel="Done"
        onPrimary={handleClose}
        onCancel={handleClose}
        onClose={handleClose}
      >
        <CheckoutAccordion sections={copy.sections} />
        <p className="pb-4 text-sm text-gray-700">
          <button
            type="button"
            onClick={() => setFullPolicyOpen(true)}
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            Full policy
          </button>
        </p>
        <div className="flex-1 min-h-0" aria-hidden />
      </CheckoutBottomSheet>

      {fullPolicyOpen && (
        <CheckoutCancellationFullPolicySheet onClose={() => setFullPolicyOpen(false)} />
      )}
    </>
  )
}
