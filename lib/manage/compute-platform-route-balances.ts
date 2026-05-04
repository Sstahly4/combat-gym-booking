/**
 * Partner Hub — platform payout rail (Wise, manual, future rails): balances are
 * derived from bookings plus optional gym_platform_payouts rows. Not used for
 * stripe_connect (Stripe balance APIs are the source of truth there).
 */

export type PlatformBalanceBooking = {
  id: string
  status: string
  total_price: number | null
  platform_fee: number | null
  start_date: string
  end_date: string
  guest_name: string | null
  discipline: string | null
  platform_payout_id: string | null
  platform_paid_out_at: string | null
}

export type GymPlatformPayoutRow = {
  id: string
  rail: string
  status: string
  amount: number
  currency: string
  external_reference: string | null
  completed_at: string | null
  created_at: string
}

const PAID_LIKE = new Set(['paid', 'confirmed', 'completed'])

export function bookingNetShare(
  b: Pick<PlatformBalanceBooking, 'total_price' | 'platform_fee'>
): number {
  const gross = Number(b.total_price) || 0
  const fee = Number(b.platform_fee) || 0
  return Math.max(0, gross - fee)
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Stay has ended (host share becomes payable on platform rail). */
function stayEndedByEndDate(endDateIso: string, today: Date): boolean {
  const end = startOfDay(new Date(endDateIso))
  return end < startOfDay(today)
}

export function bookingEligibleForPlatformPayout(
  b: Pick<PlatformBalanceBooking, 'status' | 'end_date' | 'platform_paid_out_at'>,
  today: Date
): boolean {
  if (b.platform_paid_out_at) return false
  const status = (b.status || '').toLowerCase()
  if (!PAID_LIKE.has(status)) return false
  if (status === 'completed') return true
  return stayEndedByEndDate(b.end_date, today)
}

export type PlatformActivityItem =
  | {
      kind: 'payout'
      id: string
      at: string
      amount: number
      currency: string
      rail: string
      external_reference: string | null
    }
  | { kind: 'booking_unpaid'; at: string; booking: PlatformBalanceBooking; net: number }

export type PlatformRouteBalanceSnapshot = {
  upcomingNet: number
  /** Completed / ended stays not yet linked to a platform payout transfer. */
  unpaidEarnedNet: number
  /** Historical total already marked paid out (sum of booking net shares with platform_paid_out_at set). */
  paidOutNet: number
  activityItems: PlatformActivityItem[]
}

export function computePlatformRouteBalances(
  bookings: PlatformBalanceBooking[],
  payouts: GymPlatformPayoutRow[],
  now: Date = new Date()
): PlatformRouteBalanceSnapshot {
  const today = startOfDay(now)
  let upcomingNet = 0
  let unpaidEarnedNet = 0
  let paidOutNet = 0
  const unpaidForActivity: PlatformBalanceBooking[] = []

  for (const b of bookings) {
    const status = (b.status || '').toLowerCase()
    if (!PAID_LIKE.has(status)) continue
    const net = bookingNetShare(b)

    if (b.platform_paid_out_at) {
      paidOutNet += net
      continue
    }

    if (status === 'completed') {
      unpaidEarnedNet += net
      unpaidForActivity.push(b)
      continue
    }

    // paid / confirmed
    if (!stayEndedByEndDate(b.end_date, today)) {
      upcomingNet += net
    } else {
      unpaidEarnedNet += net
      unpaidForActivity.push(b)
    }
  }

  const payoutItems: PlatformActivityItem[] = payouts
    .filter((p) => p.status === 'completed')
    .map((p) => ({
      kind: 'payout' as const,
      id: p.id,
      at: p.completed_at || p.created_at,
      amount: Number(p.amount) || 0,
      currency: (p.currency || 'USD').toUpperCase(),
      rail: p.rail,
      external_reference: p.external_reference,
    }))

  unpaidForActivity.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
  const bookingItems: PlatformActivityItem[] = unpaidForActivity.slice(0, 12).map((booking) => ({
    kind: 'booking_unpaid' as const,
    at: booking.end_date,
    booking,
    net: bookingNetShare(booking),
  }))

  const activityItems = [...payoutItems, ...bookingItems].sort(
    (x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()
  )

  return { upcomingNet, unpaidEarnedNet, paidOutNet, activityItems }
}

export function platformRouteStackPercents(snapshot: PlatformRouteBalanceSnapshot): {
  upcomingPct: number
  unpaidPct: number
  paidOutPct: number
} {
  const t = snapshot.upcomingNet + snapshot.unpaidEarnedNet + snapshot.paidOutNet
  if (t <= 0) return { upcomingPct: 0, unpaidPct: 0, paidOutPct: 0 }
  return {
    upcomingPct: Math.max(0, Math.min(100, (snapshot.upcomingNet / t) * 100)),
    unpaidPct: Math.max(0, Math.min(100, (snapshot.unpaidEarnedNet / t) * 100)),
    paidOutPct: Math.max(0, Math.min(100, (snapshot.paidOutNet / t) * 100)),
  }
}
