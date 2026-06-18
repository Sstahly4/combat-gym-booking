'use client'

import { Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { ReviewModalProvider } from '@/lib/contexts/review-modal-context'

function GymPageClientShellInner({
  children,
  gymId,
  gymSlugOrId,
}: {
  children: ReactNode
  gymId: string
  gymSlugOrId: string
}) {
  const searchParams = useSearchParams()
  const checkin = searchParams.get('checkin') ?? undefined
  const checkout = searchParams.get('checkout') ?? undefined

  return (
    <BookingProvider initialCheckin={checkin} initialCheckout={checkout}>
      <ReviewModalProvider gymSlugOrId={gymSlugOrId} gymId={gymId}>
        {children}
      </ReviewModalProvider>
    </BookingProvider>
  )
}

/** Reads URL search params on the client so the gym page shell can stay ISR-cacheable. */
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
    <Suspense fallback={<>{children}</>}>
      <GymPageClientShellInner gymId={gymId} gymSlugOrId={gymSlugOrId}>
        {children}
      </GymPageClientShellInner>
    </Suspense>
  )
}
