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
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { BookingDetailsModal } from '@/components/admin/booking-details-modal'
import type { Booking, Gym } from '@/lib/types/database'
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
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
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
          .select('*')
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

      const bookings = bookingsRes.status === 'fulfilled' ? bookingsRes.value.data ?? [] : []
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
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
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

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Verification queue"
          value={stats.unverified}
          icon={ShieldCheck}
          accent="orange"
          href="/admin/verification"
          loading={loading}
        />
        <StatCard
          label="Claim links open"
          value={stats.orphan}
          icon={KeyRound}
          accent="blue"
          href="/admin/orphan-gyms"
          loading={loading}
        />
        <StatCard
          label="Pending (legacy)"
          value={stats.pendingApproval}
          icon={Clock}
          accent="slate"
          loading={loading}
        />
        <StatCard
          label="Approved gyms"
          value={stats.totalGyms}
          icon={Building2}
          accent="emerald"
          href="/admin/gyms"
          loading={loading}
        />
        <StatCard
          label="Offers live"
          value={stats.offers}
          icon={Sparkles}
          accent="fuchsia"
          href="/admin/offers"
          loading={loading}
        />
        <StatCard
          label="Recent bookings"
          value={stats.recentBookings}
          icon={CreditCard}
          accent="indigo"
          loading={loading}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/admin/verification"
            title="Verify gyms"
            description="Approve drafts and clear the verification queue."
            icon={ShieldCheck}
          />
          <ActionCard
            href="/admin/orphan-gyms"
            title="Issue claim links"
            description="Generate single-use links so pre-listed owners can take over their account."
            icon={KeyRound}
            highlight
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Recent bookings
          </h2>
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
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-stone-900">
                          {b.total_price?.toFixed(2) || '0.00'}
                        </span>
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
            className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
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

const ACCENTS = {
  orange: 'text-orange-600 bg-orange-50',
  blue: 'text-blue-700 bg-blue-50',
  slate: 'text-slate-700 bg-slate-100',
  emerald: 'text-emerald-700 bg-emerald-50',
  fuchsia: 'text-fuchsia-700 bg-fuchsia-50',
  indigo: 'text-indigo-700 bg-indigo-50',
} as const

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
          <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
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

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  highlight,
}: {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-sm ${
        highlight
          ? 'border-orange-300 bg-orange-50/40 hover:border-orange-400'
          : 'border-stone-200 bg-white hover:border-stone-300'
      }`}
    >
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
          highlight ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-700'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="text-xs text-stone-600">{description}</p>
    </Link>
  )
}
