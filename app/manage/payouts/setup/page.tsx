'use client'

/**
 * Legacy URL: `/manage/payouts/setup` — payout preferences live under Settings → Payouts.
 */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

function PayoutSetupRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const gymId = searchParams.get('gym_id')?.trim() || null
    router.replace(manageSettingsPayoutsHref(gymId))
  }, [router, searchParams])

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Redirecting to Settings → Payouts…
      </div>
    </div>
  )
}

export default function ManagePayoutSetupRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <PayoutSetupRedirectInner />
    </Suspense>
  )
}
