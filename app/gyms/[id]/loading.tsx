'use client'

import { ReviewModalShell } from '@/components/booking/review-modal-shell'
import { LoadingOverlay } from '@/components/loading-overlay'
import { hydrateReviewParams } from '@/lib/utils/booking-prefill'
import {
  isReviewCheckoutChromeHidden,
  readReviewModalRestore,
} from '@/lib/utils/review-checkout-chrome'

export default function Loading() {
  if (typeof window !== 'undefined' && isReviewCheckoutChromeHidden()) {
    const stored = readReviewModalRestore()
    if (stored) {
      return <ReviewModalShell params={hydrateReviewParams(stored)} />
    }
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <LoadingOverlay show={true} />
    </div>
  )
}
