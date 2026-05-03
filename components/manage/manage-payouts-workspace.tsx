'use client'

/**
 * Full payout setup: Wise vs Stripe preference form plus Stripe Connect embedded
 * tools when the gym is on the Connect rail. Used from Settings → Payouts.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import {
  ConnectComponentsProvider,
  ConnectPayouts,
  ConnectAccountManagement,
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

  useEffect(() => {
    let cancelled = false
    if (!activeGymId || !useConnectedAccount) {
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
  }, [activeGymId, useConnectedAccount])

  /** Deep link from Balances (statement descriptor): #account-management */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash.slice(1) !== 'account-management') return
    const el = document.getElementById('account-management')
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(t)
  }, [connectInstance, connectLoading, gymLoading, gym?.id])

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
                    Finish{' '}
                    <Link
                      href={`/manage/stripe-connect?gym_id=${encodeURIComponent(gym.id)}`}
                      className="font-semibold text-[#003580] underline-offset-2 hover:underline"
                    >
                      Stripe setup
                    </Link>{' '}
                    for this gym, then return here for activity and bank details.
                  </p>
                </div>
              ) : connectInstance ? (
                <ConnectComponentsProvider connectInstance={connectInstance as never}>
                  <div className="space-y-6">
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
