'use client'

import { GymListingShell } from '@/components/gym/gym-listing-shell'
import { GymDetailSkeleton } from '@/components/gym/gym-detail-skeleton'
import { ReviewModalShell } from '@/components/booking/review-modal-shell'
import { hydrateReviewParams, readBookingPrefillForGymRoute } from '@/lib/utils/booking-prefill'
import { gymSlugOrIdFromPathname } from '@/lib/utils/gym-route'
import {
  isCheckoutExitToGym,
  isReviewCheckoutChromeHidden,
  readReviewModalRestore,
} from '@/lib/utils/review-checkout-chrome'

export default function Loading() {
  if (typeof window !== 'undefined') {
    const slugOrId = gymSlugOrIdFromPathname(window.location.pathname)

    if (slugOrId && isCheckoutExitToGym(slugOrId)) {
      const prefill = readBookingPrefillForGymRoute(slugOrId)
      if (prefill) {
        return <GymListingShell prefill={prefill} />
      }
    }

    if (slugOrId && isReviewCheckoutChromeHidden()) {
      const stored = readReviewModalRestore()
      const prefill = readBookingPrefillForGymRoute(slugOrId)
      if (stored && prefill && stored.gymId === prefill.gymId) {
        return <ReviewModalShell params={hydrateReviewParams(stored)} />
      }
    }
  }

  return <GymDetailSkeleton />
}
