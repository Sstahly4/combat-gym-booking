'use client'

/**
 * Admin overview / home page.
 *
 * Page-level auth guard lives in `app/admin/layout.tsx` (`AdminLayoutShell`).
 * This page only renders the dashboard content for an already-authorised admin.
 *
 * Heavier surfaces (verification queue, manual reviews, claim links) have been
 * moved to dedicated routes; this page is intentionally a calm overview with
 * brand-aligned stat cards, quick actions, and a recent bookings strip.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Clock,
  CreditCard,
  Eye,
  KeyRound,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { ADMIN_CREATE_GYM_ONBOARDING_HREF } from '@/lib/admin/admin-routes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BookingDetailsModal } from '@/components/admin/booking-details-modal'
import { ViewerMoneyLine } from '@/components/admin/viewer-money-line'
import type { Booking, Gym } from '@/lib/types/database'

type BookingListRow = Booking & {
  gym?: Pick<Gym, 'id' | 'name' | 'currency'> | null
}
import {
  canonicalBookingStatusLabel,
  toCanonicalBookingStatus,
} from '@/lib/bookings/status-normalization'

interface OverviewStats {
  unverified: number
  pendingApproval: number
  totalGyms: number
  recentBookings: number
  offers: number
  orphan: number
}

const ZERO: OverviewStats = {
  unverified: 0,
  pendingApproval: 0,
  totalGyms: 0,
  recentBookings: 0,
  offers: 0,
  orphan: 0,
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats>(ZERO)
  const [recentBookings, setRecentBookings] = useState<BookingListRow[]>([])
  const [recentGyms, setRecentGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const supabase = createClient()
      const [
        unverifiedRes,
        pendingRes,
        totalRes,
        bookingsRes,
        offersRes,
        recentGymsRes,
        orphanRes,
      ] = await Promise.allSettled([
        supabase.from('gyms').select('id', { count: 'exact', head: true }).eq('verification_status', 'draft'),
        supabase.from('gyms').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('gyms').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase
          .from('bookings')
          .select(
            `
            *,
            gym:gyms(id, name, currency)
          `
          )
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
        supabase
          .from('gyms')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(4),
        fetch('/api/admin/orphan-gyms', { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : { gyms: [] }))
          .catch(() => ({ gyms: [] })),
      ])

      const bookings = (bookingsRes.status === 'fulfilled' ? bookingsRes.value.data ?? [] : []) as BookingListRow[]
      const gyms = recentGymsRes.status === 'fulfilled' ? recentGymsRes.value.data ?? [] : []

      setRecentBookings(bookings)
      setRecentGyms(gyms)
      setStats({
        unverified: unverifiedRes.status === 'fulfilled' ? unverifiedRes.value.count ?? 0 : 0,
        pendingApproval: pendingRes.status === 'fulfilled' ? pendingRes.value.count ?? 0 : 0,
        totalGyms: totalRes.status === 'fulfilled' ? totalRes.value.count ?? 0 : 0,
        recentBookings: bookings.length,
        offers: offersRes.status === 'fulfilled' ? offersRes.value.count ?? 0 : 0,
        orphan:
          orphanRes.status === 'fulfilled' && Array.isArray((orphanRes.value as any)?.gyms)
            ? (orphanRes.value as any).gyms.length
            : 0,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">Overview</h1>
          <p className="mt-1 text-sm text-stone-600">
            Pending work, recent activity, and quick actions across the platform.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="rounded-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      <section className="mb-8">
        <Link
          href={ADMIN_CREATE_GYM_ONBOARDING_HREF}
          className="flex flex-col gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/40 p-4 transition-all hover:border-emerald-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <PlusCircle className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900">Create a new gym</p>
              <p className="mt-0.5 text-sm text-stone-600">
                Opens the same partner onboarding wizard (basics, packages, photos, payouts). The
                listing is created under your admin account (counts as pre-listed) — issue a claim
                link later, or verify it from{' '}
                <span className="font-medium text-stone-800">Verification</span> when ready.
              </p>
            </div>
          </div>
          <span className="shrink-0 self-start rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white sm:self-center">
            Start wizard
          </span>
        </Link>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Verification queue"
          value={stats.unverified}
          icon={ShieldCheck}
          accent="urgent"
          href="/admin/verification"
          loading={loading}
        />
        <StatCard
          label="Claim links open"
          value={stats.orphan}
          icon={KeyRound}
          accent="attention"
          href="/admin/orphan-gyms"
          loading={loading}
        />
        <StatCard
          label="Pending (legacy)"
          value={stats.pendingApproval}
          icon={Clock}
          accent="muted"
          loading={loading}
        />
        <StatCard
          label="Approved gyms"
          value={stats.totalGyms}
          icon={Building2}
          accent="positive"
          href="/admin/gyms"
          loading={loading}
        />
        <StatCard
          label="Offers live"
          value={stats.offers}
          icon={Sparkles}
          accent="promo"
          href="/admin/offers"
          loading={loading}
        />
        <StatCard
          label="Recent bookings"
          value={stats.recentBookings}
          icon={CreditCard}
          accent="info"
          loading={loading}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href={ADMIN_CREATE_GYM_ONBOARDING_HREF}
            title="Create gym"
            description="Full listing wizard — same steps owners use. Edit anytime under All gyms."
            icon={PlusCircle}
            tone="positive"
          />
          <ActionCard
            href="/admin/verification"
            title="Verify gyms"
            description="Approve drafts and clear the verification queue."
            icon={ShieldCheck}
            tone="urgent"
          />
          <ActionCard
            href="/admin/orphan-gyms"
            title="Issue claim links"
            description="Generate single-use links so pre-listed owners can take over their account."
            icon={KeyRound}
            tone="attention"
          />
          <ActionCard
            href="/admin/reviews"
            title="Add a review"
            description="Backfill verified reviews against any approved gym."
            icon={Star}
          />
          <ActionCard
            href="/admin/gyms"
            title="Browse all gyms"
            description="View every approved listing and jump into edits."
            icon={Building2}
          />
          <ActionCard
            href="/admin/offers"
            title="Manage offers"
            description="Schedule or retire homepage promotions."
            icon={Sparkles}
          />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Recent bookings
          </h2>
          <p className="text-[11px] text-stone-500">
            Amounts use your selected currency (navbar). Change currency there to match your location.
          </p>
        </div>
        {loading ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
            No bookings yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <ul className="divide-y divide-stone-100">
              {recentBookings.map((b) => {
                const status = toCanonicalBookingStatus(b.status)
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => setSelectedBookingId(b.id)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {b.guest_name || 'Guest'} · {b.discipline}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {new Date(b.start_date).toLocaleDateString()} →{' '}
                          {new Date(b.end_date).toLocaleDateString()} ·{' '}
                          {b.booking_reference || `#${b.id.slice(0, 8)}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-start gap-3">
                        <ViewerMoneyLine
                          amount={b.total_price}
                          storedCurrency={b.gym?.currency}
                          align="end"
                        />
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'completed'
                              ? 'bg-indigo-100 text-indigo-800'
                              : status === 'declined' || status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {canonicalBookingStatusLabel(status)}
                        </span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Recently approved gyms
          </h2>
          <Link
            href="/admin/gyms"
            className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-emerald-700"
          >
            View all <Eye className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-100" />
            ))}
          </div>
        ) : recentGyms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-500">
            No approved gyms yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentGyms.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <p className="truncate text-sm font-semibold text-stone-900">{g.name}</p>
                <p className="mt-1 truncate text-xs text-stone-500">
                  {g.city}, {g.country}
                </p>
                <p className="mt-2 text-[11px] text-stone-400">
                  {(g.disciplines || []).slice(0, 3).join(' · ') || 'No disciplines'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookingDetailsModal
        bookingId={selectedBookingId}
        isOpen={!!selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
        onRefresh={() => fetchData(true)}
      />
    </main>
  )
}

/** Stat tile icon backgrounds — urgency / semantic (not all brand navy). */
const ACCENTS = {
  /** Needs timely review */
  urgent: 'text-amber-800 bg-amber-50',
  /** Owner handoff / claim workflow */
  attention: 'text-slate-800 bg-slate-100',
  /** Low-priority / legacy */
  muted: 'text-slate-700 bg-slate-100',
  /** Healthy inventory */
  positive: 'text-emerald-800 bg-emerald-50',
  /** Marketing */
  promo: 'text-fuchsia-800 bg-fuchsia-50',
  /** Activity / bookings */
  info: 'text-indigo-800 bg-indigo-50',
} as const

const VIEW_LINK: Record<keyof typeof ACCENTS, string> = {
  urgent: 'text-amber-800',
  attention: 'text-slate-800',
  muted: 'text-slate-600',
  positive: 'text-emerald-800',
  promo: 'text-fuchsia-800',
  info: 'text-indigo-800',
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
  loading,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accent: keyof typeof ACCENTS
  href?: string
  loading?: boolean
}) {
  const body = (
    <div className="flex h-full flex-col rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${ACCENTS[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
        {href && (
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${VIEW_LINK[accent]}`}>
            View
          </span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">
        {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-stone-100" /> : value}
      </p>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

type ActionTone = 'default' | 'positive' | 'urgent' | 'attention'

const ACTION_TONE: Record<
  ActionTone,
  { card: string; icon: string }
> = {
  default: {
    card: 'border-stone-200 bg-white hover:border-stone-300',
    icon: 'bg-stone-100 text-stone-700',
  },
  positive: {
    card: 'border-emerald-200/90 bg-emerald-50/40 hover:border-emerald-300',
    icon: 'bg-emerald-600 text-white',
  },
  urgent: {
    card: 'border-amber-200/90 bg-amber-50/50 hover:border-amber-300',
    icon: 'bg-amber-600 text-white',
  },
  attention: {
    card: 'border-slate-200/90 bg-slate-50/60 hover:border-slate-300',
    icon: 'bg-[#003580] text-white',
  },
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  tone = 'default',
}: {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tone?: ActionTone
}) {
  const t = ACTION_TONE[tone]
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-sm ${t.card}`}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${t.icon}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="text-xs text-stone-600">{description}</p>
    </Link>
  )
}
