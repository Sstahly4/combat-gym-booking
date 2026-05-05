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
import { manageSettingsPayoutsHref } from '@/lib/manage/settings-payouts-href'
import { createClient } from '@/lib/supabase/client'
import {
  computePlatformRouteBalances,
  platformRouteStackPercents,
  type GymPlatformPayoutRow,
  type PlatformBalanceBooking,
} from '@/lib/manage/compute-platform-route-balances'

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

function formatRangeLabel(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso)
    const end = new Date(endIso)
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    const opts: Intl.DateTimeFormatOptions = sameMonth
      ? { day: 'numeric' }
      : { day: 'numeric', month: 'short' }
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
    })}`
  } catch {
    return `${startIso} – ${endIso}`
  }
}

function bookingStatusBadge(status: string): { label: string; cls: string } {
  const s = (status || '').toLowerCase()
  if (s === 'completed') {
    return { label: 'Awaiting payout', cls: 'bg-amber-50 text-amber-900 ring-amber-200/70' }
  }
  if (s === 'paid') {
    return { label: 'Upcoming', cls: 'bg-sky-50 text-sky-800 ring-sky-200/70' }
  }
  if (s === 'confirmed') {
    return { label: 'Confirmed', cls: 'bg-sky-50 text-sky-800 ring-sky-200/70' }
  }
  return { label: status, cls: 'bg-gray-100 text-gray-700 ring-gray-200/70' }
}

function platformRailLabel(rail: string): string {
  const r = (rail || '').toLowerCase()
  if (r === 'wise') return 'Wise'
  if (r === 'manual') return 'Manual transfer'
  return 'Payout'
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
  const [bookingRows, setBookingRows] = useState<PlatformBalanceBooking[]>([])
  const [platformPayoutRows, setPlatformPayoutRows] = useState<GymPlatformPayoutRow[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [gymCurrency, setGymCurrency] = useState<string>('USD')

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
    if (!activeGymId) {
      setLoading(false)
      setData(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setData(null)

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

  /** Derived balances for the platform payout route come from bookings — OTA-standard view. */
  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner' || !activeGymId) {
      setBookingRows([])
      setPlatformPayoutRows([])
      return
    }
    let cancelled = false
    setBookingLoading(true)
    const supabase = createClient()
    ;(async () => {
      const [bookingsRes, gymRes, payoutsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(
            'id, status, total_price, platform_fee, start_date, end_date, guest_name, discipline, platform_payout_id, platform_paid_out_at'
          )
          .eq('gym_id', activeGymId),
        supabase.from('gyms').select('currency').eq('id', activeGymId).maybeSingle(),
        supabase
          .from('gym_platform_payouts')
          .select('id, rail, status, amount, currency, external_reference, completed_at, created_at')
          .eq('gym_id', activeGymId)
          .order('created_at', { ascending: false })
          .limit(40),
      ])
      if (cancelled) return
      setBookingRows((bookingsRes.data || []) as PlatformBalanceBooking[])
      if (payoutsRes.error) {
        console.warn('[balances] gym_platform_payouts', payoutsRes.error.message)
        setPlatformPayoutRows([])
      } else {
        setPlatformPayoutRows((payoutsRes.data || []) as GymPlatformPayoutRow[])
      }
      setGymCurrency(((gymRes.data as { currency?: string | null } | null)?.currency || 'USD').toUpperCase())
      setBookingLoading(false)
    })().catch(() => {
      if (!cancelled) setBookingLoading(false)
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
  const formatMajorForViewer = (amount: number, sourceCurrency: string) => {
    const converted = convertPrice(amount, sourceCurrency)
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

  const platformSnapshot = useMemo(
    () => computePlatformRouteBalances(bookingRows, platformPayoutRows),
    [bookingRows, platformPayoutRows]
  )
  const earningsStack = useMemo(() => platformRouteStackPercents(platformSnapshot), [platformSnapshot])

  const reportMonth = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }, [])

  const payouts = data?.payouts ?? []
  const visiblePayouts = activityTab === 'payouts' ? payouts : payouts

  /**
   * Payout-method state for the callout. New gyms default to `payout_rail='wise'` but
   * haven't configured Wise yet, so treat "wise rail + not ready" as "needs setup"
   * rather than advertising a Wise balance that will always be zero.
   */
  type PayoutState =
    | 'loading'
    | 'needs_setup'
    | 'wise_ready'
    | 'wise_pending'
    | 'stripe'
  const payoutState: PayoutState = (() => {
    if (loading || !data) return 'loading'
    if (data.payout_rail === 'stripe_connect') return 'stripe'
    const wiseReady = Boolean(data.gym?.wise_payout_ready)
    if (wiseReady) return 'wise_ready'
    return 'needs_setup'
  })()
  const payoutsHref = manageSettingsPayoutsHref(activeGymId)
  const bookingsHref = activeGymId
    ? `/manage/bookings?gym_id=${encodeURIComponent(activeGymId)}`
    : '/manage/bookings'

  const usePlatformEarnings = !loading && Boolean(data) && data?.payout_rail !== 'stripe_connect'
  /** Platform route: unpaid earned (awaiting transfer). Stripe Connect: available balance. */
  const headlineLabel = usePlatformEarnings ? 'Available to pay out' : 'Available'
  const headlineValue = (() => {
    if (loading) return '—'
    if (usePlatformEarnings)
      return formatMajorForViewer(platformSnapshot.unpaidEarnedNet, gymCurrency)
    return formatMinorForViewer(availableMinor, primaryCurrency)
  })()

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-3 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              Balances{' '}
              <span className="font-light tabular-nums text-gray-900">{headlineValue}</span>
              <span className="ml-2 align-middle text-xs font-medium uppercase tracking-wide text-gray-400">
                {headlineLabel}
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
                {!data
                  ? 'Loading balance information for this listing…'
                  : usePlatformEarnings
                    ? 'Upcoming is from confirmed stays that have not ended yet. Available to pay out is your host share from ended or completed stays that has not been transferred yet. Paid out sums transfers already sent to your payout method (Wise, manual, or other platform rails). Stripe Connect listings use Stripe balances instead.'
                    : 'Shows your connected payout account: available is what can be transferred to your bank; pending is still clearing with your payment provider. Open Settings → Payouts to review payout method and account details.'}
              </span>
            </span>
          </div>
          <div className="relative flex flex-wrap items-center gap-2">
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
                <Link href={payoutsHref} className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">
                  Payout setup (Settings)
                </Link>
                <Link
                  href={manageSettingsPayoutsHref(activeGymId, 'stripe-onboarding')}
                  className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Stripe Connect onboarding
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        {error && activeGymId ? (
          <div className={`${dashCard} p-6`}>
            <p className="text-sm text-gray-700">{error}</p>
            <div className="mt-4">
              <Link
                href={payoutsHref}
                className="inline-flex h-9 items-center rounded-md bg-[#003580] px-4 text-sm font-medium text-white hover:bg-[#002a66]"
              >
                Open payout setup
              </Link>
            </div>
          </div>
        ) : null}

        {!activeGymId ? (
          <div className={`${dashCard} p-6 text-sm text-gray-700`}>
            Select a gym to view balances.
          </div>
        ) : null}

        {loading && activeGymId && !error ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading balances">
            <div className={`${dashCard} h-20 bg-gradient-to-r from-gray-50 to-gray-100/80`} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
              <div className="space-y-6">
                <div className={`${dashCard} h-52 bg-gray-50/90 p-6`}>
                  <div className="h-3 w-28 rounded bg-gray-200/90" />
                  <div className="mt-6 h-2 w-full rounded-full bg-gray-100" />
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="h-4 w-24 rounded bg-gray-100" />
                    <div className="ml-auto h-4 w-20 rounded bg-gray-100" />
                    <div className="h-4 w-32 rounded bg-gray-100" />
                    <div className="ml-auto h-4 w-24 rounded bg-gray-100" />
                  </div>
                </div>
                <div className={`${dashCard} h-36 bg-gray-50/90 p-6`}>
                  <div className="h-3 w-36 rounded bg-gray-200/90" />
                  <div className="mt-4 h-3 w-full rounded bg-gray-100" />
                  <div className="mt-3 h-3 max-w-md rounded bg-gray-100" style={{ width: '80%' }} />
                </div>
              </div>
              <div className={`${dashCard} h-56 bg-gray-50/90 p-5`}>
                <div className="h-3 w-24 rounded bg-gray-200/90" />
                <div className="mt-6 space-y-3">
                  <div className="h-10 rounded-lg bg-gray-100" />
                  <div className="h-10 rounded-lg bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        ) : !error && !loading && activeGymId ? (
          <>
        {data?.gym?.payouts_hold_active ? (
          <PayoutsHoldBanner
            variant="balances"
            active
            reason={data.gym.payouts_hold_reason ?? null}
            setAt={data.gym.payouts_hold_set_at ?? null}
            gymId={activeGymId}
          />
        ) : null}

        {!error && payoutState === 'needs_setup' ? (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950 shadow-sm shadow-amber-900/5">
            <p className="font-medium text-amber-950">Payment method not set</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
              Earnings below are tracked against your bookings, but no payout method is on file yet. Add or update
              your payout details under{' '}
              <Link
                href={payoutsHref}
                className="font-semibold text-[#003580] underline-offset-2 hover:underline"
              >
                Settings → Payouts
              </Link>{' '}
              so these funds can reach your bank.
            </p>
          </div>
        ) : null}

        {!error && payoutState === 'wise_ready' ? (
          <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 px-4 py-3 text-sm text-sky-950 shadow-sm shadow-sky-900/5">
            <p className="font-medium text-sky-950">Wise payouts active</p>
            <p className="mt-1 text-xs leading-relaxed text-sky-900/90">
              Paid stays settle to your bank through Wise. Track income under{' '}
              <Link href={bookingsHref} className="font-semibold text-[#003580] underline-offset-2 hover:underline">
                Bookings
              </Link>
              ; update recipient details under{' '}
              <Link href={payoutsHref} className="font-semibold text-[#003580] underline-offset-2 hover:underline">
                Settings → Payouts
              </Link>
              .
            </p>
          </div>
        ) : null}

        {showDescriptor && payoutState === 'stripe' ? (
          <div className="flex items-start justify-between gap-3 rounded-md border border-gray-200/80 bg-gray-50 px-4 py-3">
            <div className="flex items-start gap-2 text-xs text-gray-700">
              <BarChart3 className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.75} aria-hidden />
              <p>
                Customize your payout statement descriptor to track and reconcile payouts with your bank deposits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={manageSettingsPayoutsHref(activeGymId, 'account-management')}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-900">Balance summary</h2>
              {usePlatformEarnings ? (
                <>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="flex h-full w-full">
                      <div
                        className="h-full"
                        style={{ width: `${earningsStack.upcomingPct}%`, backgroundColor: '#d1d5db' }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${earningsStack.unpaidPct}%`, backgroundColor: BRAND }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${earningsStack.paidOutPct}%`, backgroundColor: '#059669' }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-y-3 text-sm">
                    <div className="text-gray-500">Source</div>
                    <div className="text-right text-gray-500">Amount</div>

                    <div className="flex items-center gap-2 text-gray-900">
                      <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" aria-hidden />
                      Upcoming bookings
                    </div>
                    <div className="text-right font-light tabular-nums text-gray-900">
                      {bookingLoading
                        ? '—'
                        : formatMajorForViewer(platformSnapshot.upcomingNet, gymCurrency)}
                    </div>

                    <div className="flex items-center gap-2 text-gray-900">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BRAND }} aria-hidden />
                      Available to pay out
                    </div>
                    <div className="text-right font-light tabular-nums text-gray-900">
                      {bookingLoading
                        ? '—'
                        : formatMajorForViewer(platformSnapshot.unpaidEarnedNet, gymCurrency)}
                    </div>

                    <div className="flex items-center gap-2 text-gray-900">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" aria-hidden />
                      Paid out
                    </div>
                    <div className="text-right font-light tabular-nums text-gray-900">
                      {bookingLoading
                        ? '—'
                        : formatMajorForViewer(platformSnapshot.paidOutNet, gymCurrency)}
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-500">
                    Amounts are net of the platform fee. Paid out reflects transfers recorded for this listing.
                  </p>
                </>
              ) : (
                <>
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
                </>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              {usePlatformEarnings ? (
                <div className="mt-2">
                  <div className="grid grid-cols-[160px_1fr_140px_120px] gap-4 border-b border-gray-100 py-3 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    <span>Amount</span>
                    <span>Description</span>
                    <span>Date</span>
                    <span className="text-right">Status</span>
                  </div>

                  {bookingLoading ? (
                    <div className="py-6 text-sm text-gray-500">Loading activity…</div>
                  ) : platformSnapshot.activityItems.length === 0 ? (
                    <div className="py-6 text-sm text-gray-500">
                      {payoutState === 'needs_setup' ? (
                        <>
                          No bookings or transfers yet. Once guests start booking, earnings will appear here. Configure
                          your payout method under{' '}
                          <Link
                            href={payoutsHref}
                            className="font-medium text-[#003580] underline-offset-2 hover:underline"
                          >
                            Settings → Payouts
                          </Link>
                          .
                        </>
                      ) : (
                        <>
                          No confirmed or completed bookings yet.{' '}
                          <Link
                            href={bookingsHref}
                            className="font-medium text-[#003580] underline-offset-2 hover:underline"
                          >
                            Open Bookings
                          </Link>
                          .
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {platformSnapshot.activityItems.slice(0, 10).map((row) => {
                        if (row.kind === 'payout') {
                          const paidBadge = payoutStatusBadge('paid')
                          const dateStr = (() => {
                            try {
                              return new Date(row.at).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            } catch {
                              return '—'
                            }
                          })()
                          return (
                            <div
                              key={`payout-${row.id}`}
                              className="grid grid-cols-[160px_1fr_140px_120px] items-center gap-4 py-4 text-sm"
                            >
                              <span className="font-light tabular-nums text-gray-900">
                                {formatMajorForViewer(row.amount, row.currency)}
                              </span>
                              <div className="min-w-0 text-gray-700">
                                <span className="font-medium">{platformRailLabel(row.rail)}</span>
                                {row.external_reference ? (
                                  <span className="ml-1 truncate text-xs text-gray-500">
                                    · Ref {row.external_reference}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-gray-600">{dateStr}</div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${paidBadge.cls}`}
                                >
                                  Paid out
                                </span>
                              </div>
                            </div>
                          )
                        }
                        const b = row.booking
                        const badge = bookingStatusBadge(b.status)
                        return (
                          <div
                            key={`b-${b.id}`}
                            className="grid grid-cols-[160px_1fr_140px_120px] items-center gap-4 py-4 text-sm"
                          >
                            <span className="font-light tabular-nums text-gray-900">
                              {formatMajorForViewer(row.net, gymCurrency)}
                            </span>
                            <div className="min-w-0 truncate text-gray-700">
                              {b.guest_name || 'Guest'}
                              {b.discipline ? (
                                <span className="ml-1 text-xs text-gray-500">· {b.discipline}</span>
                              ) : null}
                            </div>
                            <div className="text-gray-700">{formatRangeLabel(b.start_date, b.end_date)}</div>
                            <div className="text-right">
                              <span
                                className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${badge.cls}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="py-3 flex items-center gap-4">
                    <Link
                      href={bookingsHref}
                      className="text-sm font-normal text-[#003580] hover:underline underline-offset-2"
                    >
                      Full booking activity
                    </Link>
                    <Link
                      href={payoutsHref}
                      className="text-sm font-normal text-[#003580] hover:underline underline-offset-2"
                    >
                      Payout setup
                    </Link>
                  </div>
                </div>
              ) : (
                <>
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
                              <div className="min-w-0 truncate text-gray-700">{destinationLabel(p)}</div>
                              <div className="text-gray-700">{p.type}</div>
                              <div className="text-right text-gray-700">{formatShortDate(p.arrival_date)}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="py-3">
                      <Link
                        href={payoutsHref}
                        className="text-sm font-normal text-[#003580] hover:underline underline-offset-2"
                      >
                        Payout setup &amp; activity
                      </Link>
                    </div>
                  </div>
                </>
              )}
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
                {payoutState === 'loading' ? (
                  <p className="mt-2 text-xs text-gray-500">Loading…</p>
                ) : payoutState === 'needs_setup' ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>
                      Method: <span className="font-medium text-amber-800">Not set</span>
                    </li>
                    <li>
                      <Link
                        href={payoutsHref}
                        className="font-medium text-[#003580] underline-offset-2 hover:underline"
                      >
                        Set up payouts
                      </Link>
                    </li>
                  </ul>
                ) : payoutState === 'wise_ready' ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li>
                      Method: <span className="font-medium text-gray-800">Wise</span>
                    </li>
                    <li>
                      Recipient: <span className="font-medium text-emerald-800">Ready</span>
                    </li>
                    {data?.gym?.wise_recipient_currency ? (
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
          </>
        ) : null}
      </div>
    </div>
  )
}
