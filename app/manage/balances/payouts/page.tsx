'use client'

/**
 * Legacy URL: /manage/balances/payouts — payouts setup now lives under Settings → Payouts.
 */
import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

function BalancesPayoutsRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const gymId = searchParams.get('gym_id')
    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
    router.replace(manageSettingsPayoutsHref(gymId, hash || null))
  }, [router, searchParams])

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
      <p className="text-sm text-gray-500">Redirecting to Settings…</p>
    </div>
  )
}

export default function BalancesPayoutsRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-white px-4">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <BalancesPayoutsRedirectInner />
    </Suspense>
  )
}
