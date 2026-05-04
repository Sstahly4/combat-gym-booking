'use client'

/**
 * Legacy URL: `/manage/upcoming-bookings` — consolidated under Bookings (`/manage/bookings`).
 */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function UpcomingBookingsRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const gymId = searchParams.get('gym_id')?.trim() || null
    const q = new URLSearchParams()
    if (gymId) q.set('gym_id', gymId)
    const qs = q.toString()
    router.replace(qs ? `/manage/bookings?${qs}` : '/manage/bookings')
  }, [router, searchParams])

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Opening Bookings…
      </div>
    </div>
  )
}

export default function UpcomingBookingsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <UpcomingBookingsRedirectInner />
    </Suspense>
  )
}
