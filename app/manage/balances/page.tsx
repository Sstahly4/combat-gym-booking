'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { useActiveGym } from '@/components/manage/active-gym-context'
import { ArrowLeftRight, BarChart3, ChevronDown, Info, X } from 'lucide-react'
import { PayoutsHoldBanner } from '@/components/manage/payouts-hold-banner'
import { useCurrency } from '@/lib/contexts/currency-context'
import { formatDashboardMoney } from '@/lib/currency/format-dashboard-money'

const BRAND = '#003580'

const dashCard =
  'rounded-xl border border-gray-200/90 bg-white shadow-sm shadow-gray-900/[0.03]'

type StripePayoutRow = {
  id: string
  amount: number
  currency: string
  status: string
  arrival_date: number | null
  created: number | null
  destination: string | null
  destination_bank_name: string | null
  destination_last4: string | null
  type: string
}

type BalancesResponse = {
  payout_rail?: 'wise' | 'stripe_connect'
  currency: string
  available: { total: number }
  pending: { total: number }
  payouts: StripePayoutRow[]
  stripe: { charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }
  gym: {
    id: string
    stripe_account_id: string | null
    stripe_connect_verified: boolean
    payout_rail?: 'wise' | 'stripe_connect'
    wise_payout_ready?: boolean
    wise_recipient_currency?: string | null
    payouts_hold_active?: boolean
    payouts_hold_reason?: string | null
    payouts_hold_set_at?: string | null
  }
}

function formatShortDate(sec: number | null) {
  if (!sec) return '—'
  try {
    return new Date(sec * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}

function payoutStatusBadge(status: string) {
  const s = status.toLowerCase()
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70' },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 ring-amber-200/70' },
    in_transit: { label: 'In transit', cls: 'bg-sky-50 text-sky-800 ring-sky-200/70' },
    canceled: { label: 'Canceled', cls: 'bg-gray-100 text-gray-700 ring-gray-200/70' },
    failed: { label: 'Failed', cls: 'bg-red-50 text-red-800 ring-red-200/70' },
  }
  return map[s] ?? { label: status, cls: 'bg-gray-100 text-gray-700 ring-gray-200/70' }
}

function destinationLabel(p: StripePayoutRow): string {
  if (p.destination_bank_name && p.destination_last4) return `${p.destination_bank_name} •••• ${p.destination_last4}`
  if (p.destination_last4) return `Bank •••• ${p.destination_last4}`
  if (p.destination) return `${p.destination.slice(0, 4)}…${p.destination.slice(-4)}`
  return '—'
}

export default function BalancesPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const { selectedCurrency, convertPrice } = useCurrency()
  const { activeGymId } = useActiveGym()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BalancesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activityTab, setActivityTab] = useState<'payouts' | 'all'>('payouts')
  const [showDescriptor, setShowDescriptor] = useState(true)
  const [payoutsMenuOpen, setPayoutsMenuOpen] = useState(false)

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

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') return
    if (!activeGymId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetch(`/api/stripe/balances?gym_id=${encodeURIComponent(activeGymId)}`, { cache: 'no-store' })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || 'Failed to load balances')
        return payload as BalancesResponse
      })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setData(null)
        setError(e instanceof Error ? e.message : 'Failed to load balances')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user, profile?.role, activeGymId])

  const primaryCurrency = (data?.currency || 'usd').toLowerCase()
  const formatMinorForViewer = (minor: number, sourceCurrency: string) => {
    const major = (Number(minor) || 0) / 100
    const converted = convertPrice(major, sourceCurrency)
    return formatDashboardMoney(converted, selectedCurrency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  const availableMinor = data?.available?.total ?? 0
  const pendingMinor = data?.pending?.total ?? 0
  const totalMinor = availableMinor + pendingMinor

  const stack = useMemo(() => {
    if (totalMinor <= 0) return { availablePct: 0, pendingPct: 0 }
    return {
      availablePct: Math.max(0, Math.min(100, (availableMinor / totalMinor) * 100)),
      pendingPct: Math.max(0, Math.min(100, (pendingMinor / totalMinor) * 100)),
    }
  }, [availableMinor, pendingMinor, totalMinor])

  const reportMonth = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }, [])

  const payouts = data?.payouts ?? []
  const visiblePayouts = activityTab === 'payouts' ? payouts : payouts

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              Balances{' '}
              <span className="font-light tabular-nums text-gray-900">
                {loading ? '—' : formatMinorForViewer(availableMinor, primaryCurrency)}
              </span>
            </h1>
            <span
              className="group relative inline-flex"
              tabIndex={0}
              role="button"
              aria-label="About balances"
            >
              <Info className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.75} aria-hidden />
              <span
                role="tooltip"
                className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+8px)] z-30 w-[min(18rem,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-[11px] font-normal leading-snug text-gray-700 shadow-md opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
              >
                {data?.payout_rail === 'wise'
                  ? 'Wise payouts settle outside this balance view. Use Bookings for paid stays; amounts here stay at zero until you use Stripe Connect.'
                  : 'Available balance is the amount we can pay out to your bank account. Incoming funds become available after the standard processing window.'}
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 disabled:opacity-60"
            >
              + Add funds
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPayoutsMenuOpen((o) => !o)}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                aria-haspopup="menu"
                aria-expanded={payoutsMenuOpen}
              >
                Manage payouts
                <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
              </button>
              {payoutsMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                  onMouseLeave={() => setPayoutsMenuOpen(false)}
                >
                  <Link
                    href={
                      activeGymId
                        ? `/manage/balances/payouts?gym_id=${encodeURIComponent(activeGymId)}`
                        : '/manage/balances/payouts'
                    }
                    className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    Payouts
                  </Link>
                  <Link
                    href={
                      activeGymId
                        ? `/manage/stripe-connect?gym_id=${encodeURIComponent(activeGymId)}`
                        : '/manage/stripe-connect'
                    }
                    className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    Connected account
                  </Link>
                  <Link
                    href="/manage/settings?tab=payouts"
                    className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    Payout settings
                  </Link>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              disabled
              className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 disabled:opacity-60"
            >
              + Add settlement currency
            </button>
          </div>
        </div>

        {data?.gym?.payouts_hold_active ? (
          <PayoutsHoldBanner
            variant="balances"
            active
            reason={data.gym.payouts_hold_reason ?? null}
            setAt={data.gym.payouts_hold_set_at ?? null}
          />
        ) : null}

        {data?.payout_rail === 'wise' && !error ? (
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 px-4 py-3 text-sm text-sky-950 shadow-sm shadow-sky-900/5">
            <p className="font-medium text-sky-950">Wise payouts</p>
            <p className="mt-1 text-xs leading-relaxed text-sky-900/90">
              This balance view is for Stripe Connect. You&apos;re on Wise — amounts stay at zero here. Track paid
              stays under{' '}
              <Link
                href={
                  activeGymId
                    ? `/manage/bookings?gym_id=${encodeURIComponent(activeGymId)}`
                    : '/manage/bookings'
                }
                className="font-semibold text-[#003580] underline-offset-2 hover:underline"
              >
                Bookings
              </Link>
              ; manage recipient details under{' '}
              <Link
                href={
                  activeGymId
                    ? `/manage/balances/payouts?gym_id=${encodeURIComponent(activeGymId)}`
                    : '/manage/balances/payouts'
                }
                className="font-semibold text-[#003580] underline-offset-2 hover:underline"
              >
                Payouts
              </Link>
              .
            </p>
          </div>
        ) : null}

        {showDescriptor && data?.payout_rail !== 'wise' ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-gray-200/80 bg-gray-50 px-4 py-3">
            <div className="flex items-start gap-2 text-xs text-gray-700">
              <BarChart3 className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
              <p>
                Customize your payout statement descriptor to track and reconcile payouts with your bank deposits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={
                  activeGymId
                    ? `/manage/balances/payouts?gym_id=${encodeURIComponent(activeGymId)}#account-management`
                    : '/manage/balances/payouts#account-management'
                }
                className="text-xs font-medium text-[color:var(--brand,#003580)] hover:underline underline-offset-2"
                style={{ color: BRAND }}
              >
                Statement descriptor
              </Link>
              <button
                type="button"
                aria-label="Dismiss"
                className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowDescriptor(false)}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className={`${dashCard} p-6`}>
            <p className="text-sm text-gray-700">{error}</p>
            <div className="mt-4">
              <Link
                href={
                  activeGymId
                    ? `/manage/balances/payouts?gym_id=${encodeURIComponent(activeGymId)}`
                    : '/manage/balances/payouts'
                }
                className="inline-flex h-9 items-center rounded-md bg-[#003580] px-4 text-sm font-medium text-white hover:bg-[#002a66]"
              >
                Open payouts
              </Link>
            </div>
          </div>
        ) : null}

        {!activeGymId ? (
          <div className={`${dashCard} p-6 text-sm text-gray-700`}>
            Select a gym to view balances.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-900">Balance summary</h2>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="flex h-full w-full">
                  <div
                    className="h-full"
                    style={{ width: `${stack.pendingPct}%`, backgroundColor: '#d1d5db' }}
                  />
                  <div
                    className="h-full"
                    style={{ width: `${stack.availablePct}%`, backgroundColor: BRAND }}
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto] gap-y-3 text-sm">
                <div className="text-gray-500">Payments type</div>
                <div className="text-right text-gray-500">Amount</div>

                <div className="flex items-center gap-2 text-gray-900">
                  <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" aria-hidden />
                  Incoming
                </div>
                <div className="text-right font-light tabular-nums text-gray-900">
                  {loading ? '—' : formatMinorForViewer(pendingMinor, primaryCurrency)}
                </div>

                <div className="flex items-center gap-2 text-gray-900">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND }} aria-hidden />
                  Available
                </div>
                <div className="text-right font-light tabular-nums text-gray-900">
                  {loading ? '—' : formatMinorForViewer(availableMinor, primaryCurrency)}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              <div className="mt-3 flex items-center gap-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActivityTab('payouts')}
                  className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
                    activityTab === 'payouts'
                      ? 'border-[#003580] font-medium text-[#003580]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Payouts
                </button>
                <button
                  type="button"
                  onClick={() => setActivityTab('all')}
                  className={`-mb-px border-b-2 pb-2 text-sm transition-colors ${
                    activityTab === 'all'
                      ? 'border-[#003580] font-medium text-[#003580]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All activity
                </button>
              </div>

              <div className="mt-2">
                <div className="grid grid-cols-[160px_1fr_180px_100px] gap-4 border-b border-gray-100 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  <span>Amount</span>
                  <span>Destination</span>
                  <span>Type</span>
                  <span className="text-right">Arrive by</span>
                </div>

                {loading ? (
                  <div className="py-6 text-sm text-gray-500">Loading activity…</div>
                ) : visiblePayouts.length === 0 ? (
                  <div className="py-6 text-sm text-gray-500">No payouts yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {visiblePayouts.slice(0, 8).map((p) => {
                      const badge = payoutStatusBadge(p.status)
                      return (
                        <div
                          key={p.id}
                          className="grid grid-cols-[160px_1fr_180px_100px] items-center gap-4 py-4 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-light tabular-nums text-gray-900">
                              {formatMinorForViewer(p.amount, p.currency)}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${badge.cls}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="min-w-0 truncate text-gray-700">
                            {destinationLabel(p)}
                          </div>
                          <div className="text-gray-700">{p.type}</div>
                          <div className="text-right text-gray-700">
                            {formatShortDate(p.arrival_date)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="py-3">
                  <Link
                    href={
                      activeGymId
                        ? `/manage/balances/payouts?gym_id=${encodeURIComponent(activeGymId)}`
                        : '/manage/balances/payouts'
                    }
                    className="text-sm font-normal text-[#003580] hover:underline underline-offset-2"
                  >
                    Full payout activity
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-900">Reports</h2>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200/80"
                    aria-hidden
                  >
                    <BarChart3 className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">Balance summary</p>
                    <p className="text-xs text-gray-500">{reportMonth}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200/80"
                    aria-hidden
                  >
                    <ArrowLeftRight className="h-4 w-4 text-gray-500" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">Payout reconciliation</p>
                    <p className="text-xs text-gray-500">{reportMonth}</p>
                  </div>
                </li>
              </ul>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Payout account</p>
                {data?.payout_rail === 'wise' ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>
                      Method: <span className="font-medium text-gray-800">Wise</span>
                    </li>
                    <li>
                      Recipient:{' '}
                      {data.gym.wise_payout_ready ? (
                        <span className="font-medium text-emerald-800">Ready</span>
                      ) : (
                        <span className="font-medium text-amber-800">Incomplete</span>
                      )}
                    </li>
                    {data.gym.wise_recipient_currency ? (
                      <li>
                        Payout currency:{' '}
                        <span className="font-medium text-gray-800">{data.gym.wise_recipient_currency}</span>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>
                      Accepting payments:{' '}
                      {data ? (data.stripe.charges_enabled ? 'Yes' : 'No') : '—'}
                    </li>
                    <li>
                      Transfers to bank:{' '}
                      {data ? (data.stripe.payouts_enabled ? 'Active' : 'Paused') : '—'}
                    </li>
                    <li>
                      Business profile:{' '}
                      {data ? (data.stripe.details_submitted ? 'Complete' : 'Incomplete') : '—'}
                    </li>
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
