'use client'

import { Suspense, useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookingProvider, useBooking } from '@/lib/contexts/booking-context'
import { ReviewModalProvider } from '@/lib/contexts/review-modal-context'

/** Apply ?checkin=&checkout= from the URL after hydration (keeps page ISR-cacheable). */
function BookingUrlDateSync() {
  const searchParams = useSearchParams()
  const { setCheckin, setCheckout } = useBooking()

  useEffect(() => {
    const checkin = searchParams.get('checkin')
    const checkout = searchParams.get('checkout')
    if (checkin) setCheckin(checkin)
    if (checkout) setCheckout(checkout)
  }, [searchParams, setCheckin, setCheckout])

  return null
}

function BookingUrlDateSyncBoundary() {
  return (
    <Suspense fallback={null}>
      <BookingUrlDateSync />
    </Suspense>
  )
}

/** Client providers for gym detail — search params read without opting the page into dynamic SSR. */
export function GymPageClientShell({
  children,
  gymId,
  gymSlugOrId,
}: {
  children: ReactNode
  gymId: string
  gymSlugOrId: string
}) {
  return (
    <BookingProvider>
      <BookingUrlDateSyncBoundary />
      <ReviewModalProvider gymSlugOrId={gymSlugOrId} gymId={gymId}>
        {children}
      </ReviewModalProvider>
    </BookingProvider>
  )
}
