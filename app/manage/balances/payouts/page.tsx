'use client'

/**
 * Partner Hub > Balances > Payouts
 *
 * Embedded Stripe Connect components: <ConnectPayouts /> for the payout
 * schedule + history, and <ConnectAccountManagement /> so the owner can
 * update their bank account / verification details without leaving our
 * dashboard. Both surfaces inherit our brand blue via the `appearance`
 * variables passed to <ConnectComponentsProvider />.
 *
 * Auth model: the page server-side relies on /api/stripe/connect/account-session
 * to enforce ownership of the active gym. We do not expose any Connect
 * account ids in the client beyond the short-lived session secret.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import {
  ConnectComponentsProvider,
  ConnectPayouts,
  ConnectAccountManagement,
} from '@stripe/react-connect-js'
import { useActiveGym } from '@/components/manage/active-gym-context'

const BRAND = '#003580'
const BRAND_DARK = '#002a5c'

const cardCls =
  'rounded-2xl border border-stone-200/80 bg-white shadow-sm shadow-stone-900/[0.03]'

export default function PayoutsPage() {
  const { activeGymId } = useActiveGym()
  const [connectInstance, setConnectInstance] = useState<ReturnType<typeof loadConnectAndInitialize> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!activeGymId) return

    setLoading(true)
    setError(null)
    setConnectInstance(null)

    const fetchClientSecret = async (): Promise<string> => {
      const res = await fetch('/api/stripe/connect/account-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gym_id: activeGymId }),
        cache: 'no-store',
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to start Stripe session')
      }
      if (!payload?.client_secret) {
        throw new Error('Missing client_secret from Stripe session')
      }
      return payload.client_secret as string
    }

    ;(async () => {
      try {
        const initial = await fetchClientSecret()
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!publishableKey) {
          throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
        }
        // loadConnectAndInitialize returns a thenable; the React provider
        // accepts the resolved instance so we resolve via Promise.resolve.
        const instance = loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret: async () => {
            // Stripe will call this to refresh the session as needed.
            return await fetchClientSecret()
          },
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: BRAND,
              colorText: '#1c1917',
              colorBackground: '#ffffff',
              borderRadius: '10px',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            },
          },
        })
        // Touch the initial secret so we surface auth/setup errors fast.
        void initial
        if (!cancelled) setConnectInstance(instance)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load Stripe Connect')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeGymId])

  const headerCrumbs = useMemo(
    () => (
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Link
          href="/manage/balances"
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" /> Balances
        </Link>
        <span aria-hidden>/</span>
        <span className="text-stone-700">Payouts</span>
      </div>
    ),
    [],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      {headerCrumbs}
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-[28px]">
            Payouts
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            Manage your payout schedule, review every payout we\u2019ve issued, and update your
            bank account or verification details \u2014 all from inside the Partner Hub.
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com/express/payouts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-stone-300 hover:text-stone-800"
        >
          Open in Stripe <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      {!activeGymId ? (
        <div className={`${cardCls} px-5 py-8 text-center text-sm text-stone-500`}>
          Select a gym from the sidebar to view payouts.
        </div>
      ) : loading ? (
        <div className={`${cardCls} flex items-center justify-center px-5 py-12 text-stone-400`}>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="ml-2 text-sm">Connecting to Stripe\u2026</span>
        </div>
      ) : error ? (
        <div className={`${cardCls} px-5 py-6`}>
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <p className="mt-1 text-xs text-stone-500">
            If your gym hasn\u2019t completed Stripe Connect yet, finish onboarding first
            via the {' '}
            <Link href="/manage/stripe-connect" className="font-medium text-[color:var(--brand)] underline" style={{ ['--brand' as any]: BRAND_DARK }}>
              Stripe Connect setup
            </Link>{' '}
            page.
          </p>
        </div>
      ) : connectInstance ? (
        <ConnectComponentsProvider connectInstance={connectInstance as any}>
          <div className="space-y-6">
            <section className={`${cardCls} overflow-hidden`}>
              <header className="border-b border-stone-100 px-5 py-4">
                <h2 className="text-base font-semibold text-stone-900">Payout activity</h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Your balance, upcoming payout, and full history \u2014 powered by Stripe.
                </p>
              </header>
              <div className="px-2 py-3 sm:px-4">
                <ConnectPayouts />
              </div>
            </section>

            <section className={`${cardCls} overflow-hidden`}>
              <header className="border-b border-stone-100 px-5 py-4">
                <h2 className="text-base font-semibold text-stone-900">Account &amp; bank details</h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  Update your bank account, business details, and verification documents.
                </p>
              </header>
              <div className="px-2 py-3 sm:px-4">
                <ConnectAccountManagement />
              </div>
            </section>
          </div>
        </ConnectComponentsProvider>
      ) : null}
    </div>
  )
}
