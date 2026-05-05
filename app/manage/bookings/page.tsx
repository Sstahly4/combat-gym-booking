'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInCalendarDays, format, formatDistanceToNow, isSameDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { BookingDateRangePicker } from '@/components/manage/booking-date-range-picker'
import { formatDashboardMoney } from '@/lib/currency/format-dashboard-money'
import { canonicalBookingStatusLabel, toCanonicalBookingStatus } from '@/lib/bookings/status-normalization'
import {
  OwnerBookingDetailDialog,
  type OwnerBookingRow,
} from '@/components/manage/owner-booking-detail-dialog'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

const BRAND = '#003580'

function dayStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayEnd(d: Date): Date {
  const x = dayStart(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function parseBookingDay(ymd: string): Date {
  const part = ymd.slice(0, 10)
  const [y, m, d] = part.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function bookingOverlapsToday(b: OwnerBookingRow, now: Date): boolean {
  const todayS = dayStart(now)
  const todayE = dayEnd(now)
  const s = parseBookingDay(b.start_date)
  const e = dayEnd(parseBookingDay(b.end_date))
  return e >= todayS && s <= todayE
}

function categorizeBooking(
  b: OwnerBookingRow,
  now: Date
): 'pending' | 'current' | 'upcoming' | 'older' {
  const c = toCanonicalBookingStatus(b.status)
  if (c === 'pending') return 'pending'

  const todayE = dayEnd(now)
  const start = parseBookingDay(b.start_date)
  const end = dayEnd(parseBookingDay(b.end_date))

  if (c === 'cancelled' || c === 'declined') return 'older'

  if (bookingOverlapsToday(b, now) && (c === 'confirmed' || c === 'paid' || c === 'completed')) {
    return 'current'
  }

  if (start > todayE) return 'upcoming'

  if (end < dayStart(now)) return 'older'

  return 'older'
}

type BookingCategory = 'pending' | 'current' | 'upcoming' | 'older'

function liveBookingHint(
  booking: OwnerBookingRow,
  now: Date,
  category: BookingCategory
): string {
  const c = toCanonicalBookingStatus(booking.status)
  const start = parseBookingDay(booking.start_date)
  const end = dayEnd(parseBookingDay(booking.end_date))
  const todayS = dayStart(now)

  if (category === 'pending' || c === 'pending') {
    return 'Needs your confirmation'
  }

  if (category === 'older') {
    if (c === 'cancelled' || c === 'declined') {
      return canonicalBookingStatusLabel(c)
    }
    if (end < todayS) {
      const days = differenceInCalendarDays(todayS, end)
      if (days === 1) return 'Ended yesterday'
      if (days === 0) return 'Recently ended'
      return `Ended ${format(end, 'd MMM yyyy')}`
    }
    return 'Past booking'
  }

  if (category === 'upcoming') {
    const days = differenceInCalendarDays(start, todayS)
    if (days < 0) return 'Check-in soon'
    if (days === 0) return 'Arrives today'
    if (days === 1) return 'Arrives tomorrow'
    return `Check-in in ${days} days`
  }

  if (category === 'current') {
    if (isSameDay(start, now) && isSameDay(end, now)) return 'In session today'
    if (isSameDay(start, now)) return 'Check-in today'
    if (isSameDay(end, now)) return 'Check-out today'
    return `In progress · ends ${format(end, 'd MMM')}`
  }

  return ''
}

function categoryAccentBar(category: BookingCategory): string {
  switch (category) {
    case 'pending':
      return 'bg-amber-400'
    case 'current':
      return 'bg-[#003580]'
    case 'upcoming':
      return 'bg-sky-400'
    case 'older':
      return 'bg-gray-300'
    default:
      return 'bg-gray-200'
  }
}

function statusPillClass(c: ReturnType<typeof toCanonicalBookingStatus>): string {
  switch (c) {
    case 'pending':
      return 'bg-amber-50 text-amber-900 ring-amber-200/80'
    case 'confirmed':
      return 'bg-sky-50 text-sky-900 ring-sky-200/80'
    case 'paid':
      return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80'
    case 'completed':
      return 'bg-gray-100 text-gray-800 ring-gray-200/80'
    case 'declined':
    case 'cancelled':
      return 'bg-red-50 text-red-900 ring-red-200/80'
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-200/80'
  }
}

function BookingCard({
  booking,
  category,
  now,
  onOpen,
}: {
  booking: OwnerBookingRow
  category: BookingCategory
  now: Date
  onOpen: () => void
}) {
  const c = toCanonicalBookingStatus(booking.status)
  const currency = booking.gym.currency || 'USD'
  const price = formatDashboardMoney(Number(booking.total_price) || 0, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const start = parseBookingDay(booking.start_date)
  const end = parseBookingDay(booking.end_date)
  const range = `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
  const hint = liveBookingHint(booking, now, category)
  const initial = (booking.guest_name || 'Guest').trim().charAt(0).toUpperCase() || 'G'
  const updatedRel = formatDistanceToNow(new Date(booking.updated_at), { addSuffix: true })

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full cursor-pointer gap-0 border-b border-gray-100 py-4 text-left transition-colors last:border-b-0 hover:bg-gray-50/70 sm:gap-1 sm:rounded-lg sm:px-2 sm:hover:bg-gray-50/90"
    >
      <span
        className={cn('mt-1.5 hidden w-0.5 shrink-0 self-stretch rounded-full sm:block', categoryAccentBar(category))}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 gap-3 sm:gap-4 sm:pl-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-700"
          aria-hidden
        >
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 space-y-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-tight text-gray-900">
                {booking.guest_name?.trim() || 'Guest'}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                  statusPillClass(c)
                )}
              >
                {canonicalBookingStatusLabel(c)}
              </span>
            </div>
            <p className="text-xs font-normal text-gray-500">{booking.gym.name}</p>
            {hint ? (
              <p className="text-[13px] font-normal leading-snug text-[#003580]/90">{hint}</p>
            ) : null}
            <p className="text-sm font-light tabular-nums text-gray-700">{range}</p>
            <p className="text-xs font-light text-gray-500">
              {booking.discipline || 'Training'}
              {booking.package?.name ? ` · ${booking.package.name}` : ''}
            </p>
            <p className="text-[11px] font-light tabular-nums text-gray-400">Updated {updatedRel}</p>
          </div>
          <div className="flex shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:pt-0.5">
            <p className="text-lg font-light tabular-nums tracking-tight text-gray-900 sm:text-right">{price}</p>
            <span
              className="inline-flex items-center gap-0.5 text-xs font-normal opacity-90 group-hover:opacity-100"
              style={{ color: BRAND }}
            >
              View details
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function BookingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<OwnerBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [detailBooking, setDetailBooking] = useState<OwnerBookingRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [packageFilter, setPackageFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [activityTab, setActivityTab] = useState<'all' | BookingCategory>('all')

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return
    const supabase = createClient()
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('id')
      .eq('owner_id', user.id)

    if (gymsError) {
      console.error('Error fetching gyms:', gymsError)
      setBookings([])
      setLoading(false)
      setFetchedAt(new Date())
      return
    }

    const gymIds = (gyms || []).map((g) => g.id)
    if (gymIds.length === 0) {
      setBookings([])
      setLoading(false)
      setFetchedAt(new Date())
      return
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        gym:gyms(*),
        package:packages(id, name, sport, offer_type),
        variant:package_variants(id, name)
      `
      )
      .in('gym_id', gymIds)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    } else {
      setBookings((data || []) as OwnerBookingRow[])
    }
    setFetchedAt(new Date())
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/auth/signin')
      return
    }
    if (profile?.role !== 'owner') {
      router.replace('/')
      return
    }
    setLoading(true)
    void fetchBookings()
  }, [user, profile?.role, authLoading, router, fetchBookings])

  useEffect(() => {
    if (authLoading || !user || profile?.role !== 'owner') return
    const tick = () => {
      void fetchBookings()
    }
    const id = setInterval(tick, 30_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [authLoading, user, profile?.role, fetchBookings])

  const callBookingAction = async (bookingId: string, endpoint: string) => {
    setActionLoadingId(bookingId)
    try {
      const response = await fetch(`/api/bookings/${bookingId}/${endpoint}`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) {
        console.error('Error updating booking:', data.error)
        return
      }
      await fetchBookings()
      setDetailBooking((prev) => (prev?.id === bookingId ? null : prev))
      setDetailOpen(false)
    } catch (error) {
      console.error('Error updating booking:', error)
    } finally {
      setActionLoadingId(null)
    }
  }

  const exportCsv = (rows: OwnerBookingRow[]) => {
    const headers = [
      'booking_id',
      'reference',
      'guest_name',
      'guest_email',
      'discipline',
      'package',
      'status',
      'start_date',
      'end_date',
      'total_price',
      'currency',
      'created_at',
    ]
    const escapeValue = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const lines = rows.map((booking) => {
      const status = canonicalBookingStatusLabel(toCanonicalBookingStatus(booking.status))
      return [
        booking.id,
        booking.booking_reference || '',
        booking.guest_name || '',
        booking.guest_email || '',
        booking.discipline || '',
        booking.package?.name || '',
        status,
        booking.start_date,
        booking.end_date,
        booking.total_price,
        booking.gym?.currency || '',
        booking.created_at,
      ]
        .map(escapeValue)
        .join(',')
    })
    const content = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `owner-bookings-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const packageOptions = useMemo(
    () =>
      Array.from(new Set(bookings.map((b) => b.package?.name || '').filter(Boolean))).sort(),
    [bookings]
  )

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const canonicalStatus = toCanonicalBookingStatus(booking.status)
      const normalizedStatus = canonicalBookingStatusLabel(canonicalStatus).toLowerCase()
      const isPaid = canonicalStatus === 'paid' || canonicalStatus === 'completed'
      const start = parseBookingDay(booking.start_date)
      const searchTarget =
        `${booking.id} ${booking.guest_name || ''} ${booking.discipline || ''} ${booking.booking_reference || ''}`.toLowerCase()

      if (searchTerm.trim().length > 0 && !searchTarget.includes(searchTerm.trim().toLowerCase())) {
        return false
      }
      if (statusFilter !== 'all' && normalizedStatus !== statusFilter) return false
      if (paymentFilter === 'paid' && !isPaid) return false
      if (paymentFilter === 'unpaid' && isPaid) return false
      if (packageFilter !== 'all' && (booking.package?.name || '') !== packageFilter) return false
      if (dateFrom && start < new Date(dateFrom)) return false
      if (dateTo) {
        const endBoundary = new Date(dateTo)
        endBoundary.setHours(23, 59, 59, 999)
        if (start > endBoundary) return false
      }
      return true
    })
  }, [bookings, searchTerm, statusFilter, paymentFilter, packageFilter, dateFrom, dateTo])

  const now = useMemo(() => new Date(nowTick), [nowTick])

  const { pending, current, upcoming, older } = useMemo(() => {
    const pendingList: OwnerBookingRow[] = []
    const currentList: OwnerBookingRow[] = []
    const upcomingList: OwnerBookingRow[] = []
    const olderList: OwnerBookingRow[] = []
    for (const b of filteredBookings) {
      const cat = categorizeBooking(b, now)
      if (cat === 'pending') pendingList.push(b)
      else if (cat === 'current') currentList.push(b)
      else if (cat === 'upcoming') upcomingList.push(b)
      else olderList.push(b)
    }
    return { pending: pendingList, current: currentList, upcoming: upcomingList, older: olderList }
  }, [filteredBookings, now])

  const openDetail = (b: OwnerBookingRow) => {
    setDetailBooking(b)
    setDetailOpen(true)
  }

  if (authLoading || (loading && bookings.length === 0)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-3 sm:px-6 sm:py-8">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full max-w-md animate-pulse rounded bg-gray-100/80" />
          </div>
          <div className="h-px w-full bg-gray-100" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-gray-50" />
            ))}
          </div>
          <div className="space-y-0 divide-y divide-gray-100 border-t border-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 py-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function Section({
    title,
    description,
    items,
    category,
  }: {
    title: string
    description: string
    items: OwnerBookingRow[]
    category: BookingCategory
  }) {
    if (items.length === 0) return null
    return (
      <section className="space-y-1" aria-labelledby={`book-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        <div className="border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn('inline-block h-3 w-0.5 rounded-full', categoryAccentBar(category))}
              aria-hidden
            />
            <h2
              id={`book-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="scroll-mt-28 text-sm font-semibold text-gray-900"
            >
              {title}
            </h2>
            <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-gray-700 ring-1 ring-inset ring-gray-200/80">
              {items.length}
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-gray-500">{description}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              category={category}
              now={now}
              onOpen={() => openDetail(b)}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-3 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
                Bookings{' '}
                <span className="font-light tabular-nums text-gray-900">{bookings.length}</span>
              </h1>
              {pending.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#003580]/10 px-2 py-0.5 text-[11px] font-medium text-[#003580] ring-1 ring-inset ring-[#003580]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#003580]" aria-hidden />
                  {pending.length} needs response
                </span>
              ) : null}
            </div>
            <p className="max-w-2xl text-sm font-normal text-gray-500">
              Live reservations for your gym{bookings.length > 1 ? 's' : ''}. Open a row for guest, payment, and policy
              details.
            </p>
            {fetchedAt ? (
              <p className="text-[11px] font-light text-gray-400">
                Updated {formatDistanceToNow(fetchedAt, { addSuffix: true })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="h-8 bg-[#003580] px-3 text-xs font-medium text-white hover:bg-[#002a66]"
              onClick={() => exportCsv(filteredBookings)}
              disabled={filteredBookings.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => void fetchBookings()}
            >
              Refresh
            </Button>
          </div>
        </header>

        <div className="space-y-5 border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Refine list</h2>
            <p className="mt-1 text-xs font-normal text-gray-500">
              Filters apply instantly. The list refreshes every 30 seconds while you stay on this page.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-x-4 lg:gap-y-4">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="bookings-search" className="text-xs font-medium text-gray-600">
                Search
              </Label>
              <Input
                id="bookings-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Guest, discipline, reference…"
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="bookings-date-range" className="text-xs font-medium text-gray-600">
                Check-in period
              </Label>
              <BookingDateRangePicker
                id="bookings-date-range"
                from={dateFrom}
                to={dateTo}
                onChange={(f, t) => {
                  setDateFrom(f)
                  setDateTo(t)
                }}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs font-medium text-gray-600">Status</Label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs font-medium text-gray-600">Payment</Label>
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label className="text-xs font-medium text-gray-600">Package</Label>
              <Select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="h-9 border-gray-200 bg-white text-sm shadow-none"
              >
                <option value="all">All packages</option>
                {packageOptions.map((pkg) => (
                  <option key={pkg} value={pkg}>
                    {pkg}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing{' '}
              <span className="font-medium text-gray-900 tabular-nums">{filteredBookings.length}</span>{' '}
              of <span className="tabular-nums">{bookings.length}</span>
            </span>
            <span aria-hidden className="text-gray-300">
              ·
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setPaymentFilter('all')
                setPackageFilter('all')
                setDateFrom('')
                setDateTo('')
              }}
              className="text-[#003580] underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-14 text-center">
            <p className="text-sm font-normal text-gray-700">No bookings yet</p>
            <p className="mt-2 text-xs font-normal text-gray-500">
              When guests book your gym, they will appear here with full details.
            </p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/40 px-6 py-14 text-center">
            <p className="text-sm text-gray-700">No bookings match your filters</p>
            <p className="mt-1 text-xs text-gray-500">Try clearing filters or widening the check-in period.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Reservations</h2>
              <p className="mt-1 text-xs font-normal text-gray-500">
                Switch between groups. Counts reflect the current filter selection.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-gray-200">
                {(
                  [
                    { id: 'all', label: 'All', count: filteredBookings.length },
                    { id: 'pending', label: 'Needs response', count: pending.length },
                    { id: 'current', label: 'Current', count: current.length },
                    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
                    { id: 'older', label: 'Older', count: older.length },
                  ] as Array<{ id: 'all' | BookingCategory; label: string; count: number }>
                ).map((tab) => {
                  const active = activityTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivityTab(tab.id)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-sm transition-colors',
                        active
                          ? 'border-[#003580] font-medium text-[#003580]'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ring-1 ring-inset',
                          active
                            ? 'bg-[#003580]/10 text-[#003580] ring-[#003580]/20'
                            : 'bg-gray-100 text-gray-600 ring-gray-200/80'
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {activityTab === 'all' || activityTab === 'pending' ? (
              <Section
                title="Needs your response"
                description="Requests waiting for accept or decline."
                items={pending}
                category="pending"
              />
            ) : null}
            {activityTab === 'all' || activityTab === 'current' ? (
              <Section
                title="Current"
                description="Stays active today (check-in through check-out window)."
                items={current}
                category="current"
              />
            ) : null}
            {activityTab === 'all' || activityTab === 'upcoming' ? (
              <Section
                title="Upcoming"
                description="Future arrivals that are confirmed, paid, or otherwise active."
                items={upcoming}
                category="upcoming"
              />
            ) : null}
            {activityTab === 'all' || activityTab === 'older' ? (
              <Section
                title="Older"
                description="Past stays, cancelled, and declined bookings."
                items={older}
                category="older"
              />
            ) : null}
          </div>
        )}
      </div>

      <OwnerBookingDetailDialog
        booking={detailBooking}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailBooking(null)
        }}
        actionLoadingId={actionLoadingId}
        onAccept={(id) => void callBookingAction(id, 'accept-request')}
        onDeclineRequest={(id) => void callBookingAction(id, 'decline-request')}
        onCapture={(id) => void callBookingAction(id, 'capture')}
        onCancelBooking={(id) => void callBookingAction(id, 'decline')}
      />
    </div>
  )
}
