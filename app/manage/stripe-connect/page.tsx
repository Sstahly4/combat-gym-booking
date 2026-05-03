'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { buildOnboardingWizardUrl } from '@/lib/onboarding/owner-wizard'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'

/** Page shell aligned with onboarding packages overlay: soft blur + grey wash. */
function StripeConnectShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f9]/95 backdrop-blur-[1px] px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:px-10">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center sm:min-h-0 sm:py-6">
        <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-md">
          <header className="border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/40 px-6 py-6 text-center md:px-8 md:py-7">
            <h1 className="text-lg font-semibold tracking-tight text-[#003580] md:text-xl">{title}</h1>
            {subtitle ? (
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
          <div className="px-6 py-8 text-center md:px-8 md:py-10">{children}</div>
        </div>
      </div>
    </div>
  )
}

type StripeReturnStatus = 'idle' | 'verified' | 'incomplete' | 'error'

function StripeConnectPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [returnStatus, setReturnStatus] = useState<StripeReturnStatus>('idle')

  const refresh = searchParams.get('refresh')
  const gymId = searchParams.get('gym_id')
  /** Stripe sends users to return_url when they finish OR exit — not a guarantee of completion. */
  const returnedFromStripe =
    searchParams.get('from_stripe') === '1' || searchParams.get('success') === 'true'

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (profile && profile.role !== 'owner') {
      router.replace('/')
    }
  }, [authLoading, user, profile, router])

  useEffect(() => {
    if (!returnedFromStripe || authLoading || !user) return

    if (!gymId) {
      setReturnStatus('incomplete')
      return
    }

    let cancelled = false

    void fetch(`/api/gyms/${gymId}/update-stripe-status`, { method: 'POST' })
      .then(async (res) => {
        if (!res.ok) throw new Error('status')
        return res.json() as Promise<{ verified?: boolean }>
      })
      .then((data) => {
        if (cancelled) return
        setReturnStatus(data.verified ? 'verified' : 'incomplete')
      })
      .catch(() => {
        if (!cancelled) setReturnStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [returnedFromStripe, gymId, authLoading, user])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gymId ? { gym_id: gymId } : {}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account link')
      }

      window.location.href = data.url as string
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setConnecting(false)
    }
  }

  if (authLoading) {
    return (
      <StripeConnectShell title="Connect Stripe" subtitle="Checking your session…">
        <div className="mx-auto max-w-sm space-y-3 text-left">
          <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </StripeConnectShell>
    )
  }

  if (!user || (profile && profile.role !== 'owner')) {
    return (
      <StripeConnectShell title="Connect Stripe" subtitle="Redirecting…">
        <p className="text-sm text-muted-foreground">One moment.</p>
      </StripeConnectShell>
    )
  }

  const payoutsHubUrl = manageSettingsPayoutsHref(gymId)
  const onboardingGoLiveUrl = buildOnboardingWizardUrl('step-7', gymId)

  /** Until the API responds, `returnStatus` is `idle` then `checking` — treat both as loading when we have a gym. */
  const returnCheckPending =
    returnedFromStripe &&
    Boolean(gymId) &&
    returnStatus !== 'verified' &&
    returnStatus !== 'incomplete' &&
    returnStatus !== 'error'

  if (returnedFromStripe) {
    if (returnCheckPending) {
      return (
        <StripeConnectShell
          title="Back from Stripe"
          subtitle="Checking whether your payout account is ready…"
        >
          <div className="mx-auto max-w-sm space-y-3 text-left">
            <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </StripeConnectShell>
      )
    }

    if (returnStatus === 'error') {
      return (
        <StripeConnectShell
          title="Couldn’t verify Stripe status"
          subtitle="You can try again from Settings → Payouts or reopen Stripe onboarding."
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-6">
            <p className="text-left text-sm text-muted-foreground">
              We couldn&apos;t reach Stripe to confirm your account. Check your connection, then use{' '}
              <strong className="font-semibold text-gray-900">Refresh status</strong> on Settings → Payouts, or open Stripe
              again below.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Button
                onClick={() => void handleConnect()}
                disabled={connecting}
                className="w-full bg-[#003580] text-white hover:bg-[#002a66] sm:w-auto sm:min-w-[12rem]"
              >
                {connecting ? 'Opening Stripe…' : 'Open Stripe again'}
              </Button>
              <Button asChild variant="outline" className="w-full border-gray-200 bg-white sm:w-auto sm:min-w-[12rem]">
                <Link href={payoutsHubUrl}>Back to Payouts</Link>
              </Button>
            </div>
          </div>
        </StripeConnectShell>
      )
    }

    if (returnStatus === 'verified') {
      return (
        <StripeConnectShell
          title="Payouts connected"
          subtitle="Stripe shows your account can receive charges and payouts. Continue listing setup to finish Go live."
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-6">
            <p className="text-left text-sm leading-relaxed text-gray-700">
              Under <strong className="font-semibold text-gray-900">Settings → Payouts</strong>, use{' '}
              <strong className="font-semibold text-gray-900">Refresh status</strong> if the checklist doesn&apos;t update
              right away. Then complete the remaining steps through <strong className="font-semibold text-gray-900">Go live</strong>.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              {gymId ? (
                <Button asChild className="w-full bg-[#003580] text-white hover:bg-[#002a66] sm:w-auto sm:min-w-[12rem]">
                  <Link href={onboardingGoLiveUrl}>Continue to Go live</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" className="w-full border-gray-200 bg-white sm:w-auto sm:min-w-[12rem]">
                <Link href={payoutsHubUrl}>Back to Payouts</Link>
              </Button>
            </div>
          </div>
        </StripeConnectShell>
      )
    }

    /* incomplete OR no gymId — Stripe return is not proof of completion */
    return (
      <StripeConnectShell
        title="Stripe setup not finished yet"
        subtitle="Leaving Stripe brings you back here even if some steps are still required."
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-6">
          <p className="text-left text-sm leading-relaxed text-gray-700">
            Complete any remaining items in Stripe (business details, bank account, identity), or open Stripe again. When
            Stripe is satisfied, we&apos;ll mark payouts as connected — use{' '}
            <strong className="font-semibold text-gray-900">Refresh status</strong> on Settings → Payouts after you finish.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              onClick={() => void handleConnect()}
              disabled={connecting}
              className="w-full bg-[#003580] text-white hover:bg-[#002a66] sm:w-auto sm:min-w-[12rem]"
            >
              {connecting ? 'Opening Stripe…' : 'Continue in Stripe'}
            </Button>
            <Button asChild variant="outline" className="w-full border-gray-200 bg-white sm:w-auto sm:min-w-[12rem]">
              <Link href={payoutsHubUrl}>Back to Payouts</Link>
            </Button>
          </div>
        </div>
      </StripeConnectShell>
    )
  }

  return (
    <StripeConnectShell
      title="Connect Stripe payouts"
      subtitle="Secure onboarding is handled by Stripe. We only store your connected account ID on the gym you are setting up."
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-6">
        {error ? (
          <div
            role="alert"
            className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm leading-relaxed text-red-800"
          >
            {error}
          </div>
        ) : null}

        <div className="w-full space-y-3 text-left text-sm leading-relaxed text-gray-700">
          <p className="text-center text-muted-foreground">When you connect, you&apos;ll be able to:</p>
          <ul className="mx-auto max-w-sm list-inside list-disc space-y-2 text-muted-foreground">
            <li>Receive payouts to your bank when bookings are paid</li>
            <li>See balances and payouts in your Stripe Dashboard</li>
            <li>Let CombatStay route customer payments to your account</li>
          </ul>
        </div>

        <Button
          onClick={() => void handleConnect()}
          disabled={connecting}
          className="w-full max-w-xs bg-[#003580] text-white hover:bg-[#002a66] sm:min-w-[14rem]"
        >
          {connecting ? 'Opening Stripe…' : 'Connect Stripe account'}
        </Button>

        {refresh ? (
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Finish any steps Stripe still needs, then use the button above to open onboarding again.
          </p>
        ) : null}

        <div className="w-full border-t border-gray-100 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Not ready?{' '}
            <Link href={payoutsHubUrl} className="font-medium text-[#003580] underline-offset-2 hover:underline">
              Back to Payouts
            </Link>
            {gymId ? null : (
              <>
                {' '}
                or{' '}
                <Link href="/manage/onboarding" className="font-medium text-[#003580] underline-offset-2 hover:underline">
                  listing setup
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </StripeConnectShell>
  )
}

export default function StripeConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#f4f6f9]/95 backdrop-blur-[1px] px-4 py-8 sm:px-6 md:py-12 lg:px-10">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center sm:py-6">
            <div className="h-56 animate-pulse rounded-xl border border-gray-200/90 bg-white/80 shadow-md" />
          </div>
        </div>
      }
    >
      <StripeConnectPageContent />
    </Suspense>
  )
}
