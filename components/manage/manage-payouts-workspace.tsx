'use client'

/**
 * Full payout setup: Wise vs Stripe preference form plus Stripe Connect embedded
 * tools when the gym is on the Connect rail. Used from Settings → Payouts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import {
  ConnectComponentsProvider,
  ConnectPayouts,
  ConnectAccountManagement,
  ConnectAccountOnboarding,
} from '@stripe/react-connect-js'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { ManagePayoutPreferencesForm } from '@/components/manage/manage-payout-preferences-form'
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'
import type { Gym } from '@/lib/types/database'

const BRAND = '#003580'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

export function ManagePayoutsWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const { activeGymId } = useActiveGym()
  const [gym, setGym] = useState<Gym | null>(null)
  const [gymLoading, setGymLoading] = useState(true)
  const [gymError, setGymError] = useState<string | null>(null)

  const [connectInstance, setConnectInstance] = useState<ReturnType<typeof loadConnectAndInitialize> | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (!profile) {
      router.replace('/auth/role-selection')
      return
    }
    if (profile.role !== 'owner') {
      router.replace('/')
    }
  }, [authLoading, user, profile, router])

  const loadGym = useCallback(async () => {
    if (!user || !activeGymId) {
      setGym(null)
      setGymLoading(false)
      return
    }
    setGymLoading(true)
    setGymError(null)
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', activeGymId)
      .eq('owner_id', user.id)
      .maybeSingle()
    if (qErr || !data) {
      setGym(null)
      setGymError(qErr?.message || 'Could not load this gym.')
    } else {
      setGym(data as Gym)
    }
    setGymLoading(false)
  }, [user, activeGymId])

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') return
    void loadGym()
  }, [authLoading, user, profile?.role, loadGym])

  const rail = (gym?.payout_rail as 'wise' | 'stripe_connect') || 'wise'
  const useConnectedAccount = rail === 'stripe_connect'
  /** Account session requires `acct_…`; wait until create-account (embedded_only) has run after switching rail. */
  const stripeAccountId = gym?.stripe_account_id ?? null

  useEffect(() => {
    let cancelled = false
    if (!activeGymId || !useConnectedAccount || !stripeAccountId) {
      setConnectInstance(null)
      setConnectError(null)
      setConnectLoading(false)
      return
    }

    setConnectLoading(true)
    setConnectError(null)
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
        throw new Error(payload?.error || 'Could not open payout session')
      }
      if (!payload?.client_secret) {
        throw new Error('Missing session from server')
      }
      return payload.client_secret as string
    }

    ;(async () => {
      try {
        const initial = await fetchClientSecret()
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!publishableKey) {
          throw new Error('Payments are not configured for this environment.')
        }
        const instance = loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret: async () => await fetchClientSecret(),
          appearance: {
            /** Drawer keeps sub-steps anchored to the layout; modal dialogs can feel like leaving the page. */
            overlays: 'drawer',
            variables: {
              colorPrimary: BRAND,
              colorText: '#1c1917',
              colorBackground: '#ffffff',
              borderRadius: '10px',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            },
          },
        })
        void initial
        if (!cancelled) setConnectInstance(instance)
      } catch (err: unknown) {
        if (!cancelled) setConnectError(err instanceof Error ? err.message : 'Could not load payouts')
      } finally {
        if (!cancelled) setConnectLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeGymId, useConnectedAccount, stripeAccountId])

  /** Hosted Account Link return URL lands here with `from_stripe=1` — sync verification then drop the flag. */
  const fromStripe = searchParams.get('from_stripe') === '1' || searchParams.get('success') === 'true'
  const urlGymId = searchParams.get('gym_id')
  useEffect(() => {
    if (!fromStripe || !activeGymId) return
    if (urlGymId && urlGymId !== activeGymId) return

    let cancelled = false
    void (async () => {
      try {
        await fetch(`/api/gyms/${encodeURIComponent(activeGymId)}/update-stripe-status`, { method: 'POST' })
        if (!cancelled) await loadGym()
        if (!cancelled) {
          router.replace(manageSettingsPayoutsHref(activeGymId), { scroll: false })
        }
      } catch {
        if (!cancelled) {
          router.replace(manageSettingsPayoutsHref(activeGymId), { scroll: false })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fromStripe, urlGymId, activeGymId, loadGym, router])

  /** Deep link: #account-management or #stripe-onboarding */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hash.slice(1)
    if (h !== 'account-management' && h !== 'stripe-onboarding') return
    const el = document.getElementById(h)
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [connectInstance, connectLoading, gymLoading, gym?.id, gym?.stripe_connect_verified])

  const headerCrumbs = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link
          href={activeGymId ? `/manage/balances?gym_id=${encodeURIComponent(activeGymId)}` : '/manage/balances'}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Balances
        </Link>
        <span aria-hidden>/</span>
        <Link href="/manage/settings" className="rounded-md px-1 py-0.5 hover:text-gray-800">
          Settings
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-800">Payouts</span>
      </div>
    ),
    [activeGymId]
  )

  const accountEmail = user?.email ?? null
  const defaultHolder = profile?.full_name?.trim() || ''

  return (
    <div className="space-y-6">
      {headerCrumbs}
      <p className="max-w-2xl text-sm text-gray-600">
        Choose how you get paid and keep bank details up to date. Live Stripe balances and payout history stay on{' '}
        <Link
          href={activeGymId ? `/manage/balances?gym_id=${encodeURIComponent(activeGymId)}` : '/manage/balances'}
          className="font-medium text-[#003580] underline-offset-2 hover:underline"
        >
          Balances
        </Link>
        .
      </p>

      {!activeGymId ? (
        <div className={`${dashCard} px-5 py-8 text-center text-sm text-gray-500`}>
          Select a gym from the sidebar to manage payouts.
        </div>
      ) : gymLoading ? (
        <div className={`${dashCard} flex items-center justify-center px-5 py-12 text-gray-400`}>
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          <span className="ml-2 text-sm">Loading…</span>
        </div>
      ) : gymError || !gym ? (
        <div className={`${dashCard} px-5 py-6 text-sm text-rose-700`}>{gymError || 'Gym not found.'}</div>
      ) : (
        <div className="space-y-8">
          <ManagePayoutPreferencesForm
            gymId={gym.id}
            gym={gym}
            accountEmail={accountEmail}
            defaultAccountHolderName={defaultHolder}
            onGymRefresh={loadGym}
          />

          {useConnectedAccount ? (
            <>
              {connectLoading ? (
                <div className={`${dashCard} flex items-center justify-center px-5 py-12 text-gray-400`}>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span className="ml-2 text-sm">Loading payout tools…</span>
                </div>
              ) : connectError ? (
                <div className={`${dashCard} px-5 py-6`}>
                  <p className="text-sm font-medium text-rose-700">{connectError}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Choose <strong className="font-semibold text-gray-900">Stripe Connect</strong> above, then{' '}
                    <strong className="font-semibold text-gray-900">Connect payouts</strong> so we can create your
                    connected account. Embedded payout tools load here automatically afterward.
                  </p>
                </div>
              ) : connectInstance ? (
                <ConnectComponentsProvider connectInstance={connectInstance as never}>
                  <div className="space-y-6">
                    {!gym.stripe_connect_verified ? (
                      <section id="stripe-onboarding" className={`${dashCard} overflow-hidden`}>
                        <header className="border-b border-gray-100 px-5 py-4">
                          <h3 className="text-base font-semibold text-gray-900">Finish payout account setup</h3>
                          <p className="mt-0.5 text-sm text-gray-500">
                            Complete the steps below. If a secure Stripe window opens, follow the prompts—it closes
                            when you are done and you return here. We then refresh your listing status.
                          </p>
                        </header>
                        <div className="px-2 py-3 sm:px-4">
                          <ConnectAccountOnboarding
                            onExit={() => {
                              void (async () => {
                                try {
                                  await fetch(`/api/gyms/${encodeURIComponent(gym.id)}/update-stripe-status`, {
                                    method: 'POST',
                                  })
                                } catch {
                                  /* best-effort sync */
                                }
                                await loadGym()
                              })()
                            }}
                          />
                        </div>
                      </section>
                    ) : null}

                    <section className={`${dashCard} overflow-hidden`}>
                      <header className="border-b border-gray-100 px-5 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Payout activity</h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Balance, payout schedule, and transfer history for your connected account.
                        </p>
                      </header>
                      <div className="px-2 py-3 sm:px-4">
                        <ConnectPayouts />
                      </div>
                    </section>

                    <section id="account-management" className={`${dashCard} overflow-hidden`}>
                      <header className="border-b border-gray-100 px-5 py-4">
                        <h3 className="text-base font-semibold text-gray-900">Account &amp; bank details</h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Update bank account, business profile, and verification when your provider asks for them.
                        </p>
                      </header>
                      <div className="px-2 py-3 sm:px-4">
                        <ConnectAccountManagement />
                      </div>
                    </section>
                  </div>
                </ConnectComponentsProvider>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
