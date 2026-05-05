'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

/**
 * Legacy `/manage/stripe-connect` entrypoint. Hosted Account Link return/refresh
 * URLs now land on Settings → Payouts; this page forwards any bookmarked links.
 */
function StripeConnectRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (profile && profile.role !== 'owner') {
      router.replace('/')
      return
    }

    const gymId = searchParams.get('gym_id')
    const base = manageSettingsPayoutsHref(gymId, 'stripe-onboarding')
    const u = new URL(base, 'http://localhost')
    if (searchParams.get('from_stripe') === '1' || searchParams.get('success') === 'true') {
      u.searchParams.set('from_stripe', '1')
    }
    if (searchParams.get('refresh') === 'true') {
      u.searchParams.set('stripe_refresh', '1')
    }
    router.replace(`${u.pathname}${u.search}${u.hash}`)
  }, [authLoading, user, profile, router, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f9]/95 px-4 py-8">
      <p className="text-sm text-muted-foreground">Redirecting to payout settings…</p>
    </div>
  )
}

export default function StripeConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f9]/95 px-4 py-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <StripeConnectRedirect />
    </Suspense>
  )
}
