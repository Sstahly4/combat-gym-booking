/**
 * Partner Hub — platform payout rail (Wise, manual, future rails): balances are
 * derived from bookings plus optional gym_platform_payouts rows. Not used for
 * stripe_connect (Stripe balance APIs are the source of truth there).
 *
 * Eligibility follows {@link resolvePartnerPayoutEligibility} (check-in + 3 business days).
 */

import {
  buildGymPaidBookingOrdinals,
  isPaidLikeBookingStatus,
  resolvePartnerPayoutEligibility,
  type PartnerPayoutBookingInput,
  type PartnerPayoutEligibility,
} from '@/lib/manage/partner-payout-eligibility'

export type PlatformBalanceBooking = PartnerPayoutBookingInput & {
  total_price: number | null
  platform_fee: number | null
  guest_name: string | null
  discipline: string | null
  platform_payout_id: string | null
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

export function bookingNetShare(
  b: Pick<PlatformBalanceBooking, 'total_price' | 'platform_fee'>,
): number {
  const gross = Number(b.total_price) || 0
  const fee = Number(b.platform_fee) || 0
  return Math.max(0, gross - fee)
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
  | {
      kind: 'booking_unpaid'
      at: string
      booking: PlatformBalanceBooking
      net: number
      eligibility: PartnerPayoutEligibility
    }

export type PlatformRouteBalanceSnapshot = {
  upcomingNet: number
  /** Eligible for transfer but not yet linked to a platform payout batch. */
  unpaidEarnedNet: number
  /** Historical total already marked paid out. */
  paidOutNet: number
  activityItems: PlatformActivityItem[]
}

export function bookingEligibleForPlatformPayout(
  booking: PlatformBalanceBooking,
  gymPaidBookingOrdinal: number,
  now: Date = new Date(),
): boolean {
  return resolvePartnerPayoutEligibility(booking, { gymPaidBookingOrdinal, now }).eligible
}

export function computePlatformRouteBalances(
  bookings: PlatformBalanceBooking[],
  payouts: GymPlatformPayoutRow[],
  now: Date = new Date(),
): PlatformRouteBalanceSnapshot {
  const ordinals = buildGymPaidBookingOrdinals(bookings)
  let upcomingNet = 0
  let unpaidEarnedNet = 0
  let paidOutNet = 0
  const unpaidForActivity: Array<{
    booking: PlatformBalanceBooking
    net: number
    eligibility: PartnerPayoutEligibility
  }> = []

  for (const b of bookings) {
    if (!isPaidLikeBookingStatus(b.status)) continue
    const net = bookingNetShare(b)
    const ordinal = ordinals.get(b.id) ?? 0
    if (ordinal === 0) continue

    const eligibility = resolvePartnerPayoutEligibility(b, {
      gymPaidBookingOrdinal: ordinal,
      now,
    })

    if (b.platform_paid_out_at) {
      paidOutNet += net
      continue
    }

    if (eligibility.eligible) {
      unpaidEarnedNet += net
      unpaidForActivity.push({ booking: b, net, eligibility })
    } else if (eligibility.reason === 'upcoming') {
      upcomingNet += net
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

  unpaidForActivity.sort(
    (a, b) => b.eligibility.eligibleAt.getTime() - a.eligibility.eligibleAt.getTime(),
  )
  const bookingItems: PlatformActivityItem[] = unpaidForActivity.slice(0, 12).map((row) => ({
    kind: 'booking_unpaid' as const,
    at: row.eligibility.eligibleAtIso,
    booking: row.booking,
    net: row.net,
    eligibility: row.eligibility,
  }))

  const activityItems = [...payoutItems, ...bookingItems].sort(
    (x, y) => new Date(y.at).getTime() - new Date(x.at).getTime(),
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

/** Bookings ready for an ops payout batch (platform rail). */
export function listPlatformPayoutEligibleBookings(
  bookings: PlatformBalanceBooking[],
  now: Date = new Date(),
): Array<{ booking: PlatformBalanceBooking; net: number; eligibility: PartnerPayoutEligibility }> {
  const ordinals = buildGymPaidBookingOrdinals(bookings)
  const out: Array<{
    booking: PlatformBalanceBooking
    net: number
    eligibility: PartnerPayoutEligibility
  }> = []
  for (const b of bookings) {
    const ordinal = ordinals.get(b.id)
    if (!ordinal) continue
    const eligibility = resolvePartnerPayoutEligibility(b, { gymPaidBookingOrdinal: ordinal, now })
    if (!eligibility.eligible) continue
    out.push({ booking: b, net: bookingNetShare(b), eligibility })
  }
  out.sort((a, b) => a.eligibility.eligibleAt.getTime() - b.eligibility.eligibleAt.getTime())
  return out
}
