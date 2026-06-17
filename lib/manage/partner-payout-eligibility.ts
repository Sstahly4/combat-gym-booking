/**
 * Partner payout eligibility — aligns with Gym Partner Agreement §4.2 (June 2026).
 *
 * Standard: Net payout initiated within 3 business days after guest check-in (`start_date`).
 * Provisional: first {@link PROVISIONAL_PAYOUT_BOOKING_LIMIT} captured bookings per gym use
 * checkout (`end_date`) + 3 business days (ecosystem security hold).
 *
 * Check-in is calendar `start_date` (option A). The guest 48-hour arrival report window is
 * shorter than the payout delay, so no separate dispute flag is required for eligibility.
 */

export const PARTNER_PAYOUT_BUSINESS_DAYS_AFTER_CHECKIN = 3
export const PROVISIONAL_PAYOUT_BOOKING_LIMIT = 3
export const GUEST_ARRIVAL_REPORT_WINDOW_HOURS = 48

export const PAID_LIKE_BOOKING_STATUSES = new Set(['paid', 'confirmed', 'completed'])

export type PartnerPayoutBookingInput = {
  id: string
  status: string
  start_date: string
  end_date: string
  created_at?: string | null
  payment_captured_at?: string | null
  platform_paid_out_at?: string | null
}

export type PartnerPayoutScheduleKind = 'standard' | 'provisional_first_bookings'

export type PartnerPayoutEligibilityReason =
  | 'paid_out'
  | 'invalid_status'
  | 'not_captured'
  | 'upcoming'
  | 'ready'

export type PartnerPayoutEligibility = {
  eligible: boolean
  eligibleAt: Date
  eligibleAtIso: string
  schedule: PartnerPayoutScheduleKind
  anchorDateYmd: string
  gymPaidBookingOrdinal: number
  reason: PartnerPayoutEligibilityReason
}

export function isPaidLikeBookingStatus(status: string): boolean {
  return PAID_LIKE_BOOKING_STATUSES.has((status || '').toLowerCase())
}

/** Payment is considered captured when flagged or in a post-capture status. */
export function isPartnerBookingPaymentCaptured(booking: PartnerPayoutBookingInput): boolean {
  if (booking.payment_captured_at) return true
  return isPaidLikeBookingStatus(booking.status)
}

/** UTC noon anchor for YYYY-MM-DD (same pattern as cancellation deadline math). */
export function ymdToUtcNoon(ymd: string): Date {
  const parts = ymd.split('-').map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid date: ${ymd}`)
  }
  const [y, m, d] = parts
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
}

/**
 * Returns 00:00 UTC on the calendar day that is `businessDays` business days after `ymd`.
 * Weekends (Sat/Sun UTC) are skipped.
 */
export function addUtcBusinessDaysFromYmd(ymd: string, businessDays: number): Date {
  if (businessDays < 0) throw new Error('businessDays must be non-negative')
  if (businessDays === 0) {
    const noon = ymdToUtcNoon(ymd)
    return new Date(
      Date.UTC(noon.getUTCFullYear(), noon.getUTCMonth(), noon.getUTCDate(), 0, 0, 0, 0),
    )
  }
  let cursor = ymdToUtcNoon(ymd)
  let added = 0
  while (added < businessDays) {
    cursor = new Date(cursor.getTime())
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    const dow = cursor.getUTCDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return new Date(
    Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), 0, 0, 0, 0),
  )
}

export function resolvePartnerPayoutSchedule(
  gymPaidBookingOrdinal: number,
): PartnerPayoutScheduleKind {
  return gymPaidBookingOrdinal <= PROVISIONAL_PAYOUT_BOOKING_LIMIT
    ? 'provisional_first_bookings'
    : 'standard'
}

export function partnerPayoutAnchorYmd(
  booking: Pick<PartnerPayoutBookingInput, 'start_date' | 'end_date'>,
  schedule: PartnerPayoutScheduleKind,
): string {
  return schedule === 'provisional_first_bookings' ? booking.end_date : booking.start_date
}

export function getPartnerPayoutEligibleAt(
  booking: Pick<PartnerPayoutBookingInput, 'start_date' | 'end_date'>,
  gymPaidBookingOrdinal: number,
): Date {
  const schedule = resolvePartnerPayoutSchedule(gymPaidBookingOrdinal)
  const anchorYmd = partnerPayoutAnchorYmd(booking, schedule)
  return addUtcBusinessDaysFromYmd(
    anchorYmd,
    PARTNER_PAYOUT_BUSINESS_DAYS_AFTER_CHECKIN,
  )
}

/**
 * 1-based index among this gym's captured bookings, ordered by `created_at` then `id`.
 */
export function buildGymPaidBookingOrdinals(
  bookings: PartnerPayoutBookingInput[],
): Map<string, number> {
  const paid = bookings
    .filter((b) => isPartnerBookingPaymentCaptured(b))
    .sort((a, b) => {
      const ca = a.created_at || ''
      const cb = b.created_at || ''
      if (ca !== cb) return ca.localeCompare(cb)
      return a.id.localeCompare(b.id)
    })
  const map = new Map<string, number>()
  paid.forEach((b, i) => map.set(b.id, i + 1))
  return map
}

export function resolvePartnerPayoutEligibility(
  booking: PartnerPayoutBookingInput,
  options: { gymPaidBookingOrdinal: number; now?: Date },
): PartnerPayoutEligibility {
  const now = options.now ?? new Date()
  const ordinal = options.gymPaidBookingOrdinal

  if (booking.platform_paid_out_at) {
    const eligibleAt = getPartnerPayoutEligibleAt(booking, ordinal)
    const schedule = resolvePartnerPayoutSchedule(ordinal)
    return {
      eligible: false,
      eligibleAt,
      eligibleAtIso: eligibleAt.toISOString(),
      schedule,
      anchorDateYmd: partnerPayoutAnchorYmd(booking, schedule),
      gymPaidBookingOrdinal: ordinal,
      reason: 'paid_out',
    }
  }

  if (!isPaidLikeBookingStatus(booking.status)) {
    const eligibleAt = getPartnerPayoutEligibleAt(booking, ordinal)
    const schedule = resolvePartnerPayoutSchedule(ordinal)
    return {
      eligible: false,
      eligibleAt,
      eligibleAtIso: eligibleAt.toISOString(),
      schedule,
      anchorDateYmd: partnerPayoutAnchorYmd(booking, schedule),
      gymPaidBookingOrdinal: ordinal,
      reason: 'invalid_status',
    }
  }

  if (!isPartnerBookingPaymentCaptured(booking)) {
    const eligibleAt = getPartnerPayoutEligibleAt(booking, ordinal)
    const schedule = resolvePartnerPayoutSchedule(ordinal)
    return {
      eligible: false,
      eligibleAt,
      eligibleAtIso: eligibleAt.toISOString(),
      schedule,
      anchorDateYmd: partnerPayoutAnchorYmd(booking, schedule),
      gymPaidBookingOrdinal: ordinal,
      reason: 'not_captured',
    }
  }

  const schedule = resolvePartnerPayoutSchedule(ordinal)
  const anchorDateYmd = partnerPayoutAnchorYmd(booking, schedule)
  const eligibleAt = getPartnerPayoutEligibleAt(booking, ordinal)
  const eligible = now.getTime() >= eligibleAt.getTime()

  return {
    eligible,
    eligibleAt,
    eligibleAtIso: eligibleAt.toISOString(),
    schedule,
    anchorDateYmd,
    gymPaidBookingOrdinal: ordinal,
    reason: eligible ? 'ready' : 'upcoming',
  }
}

export function partnerPayoutStatusLabel(
  eligibility: Pick<PartnerPayoutEligibility, 'eligible' | 'reason' | 'schedule'>,
): { label: string; cls: string } {
  if (eligibility.reason === 'paid_out') {
    return { label: 'Paid out', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70' }
  }
  if (eligibility.reason === 'ready') {
    return { label: 'Ready for payout', cls: 'bg-amber-50 text-amber-900 ring-amber-200/70' }
  }
  if (eligibility.reason === 'upcoming') {
    if (eligibility.schedule === 'provisional_first_bookings') {
      return {
        label: 'After checkout (+3 biz days)',
        cls: 'bg-violet-50 text-violet-900 ring-violet-200/70',
      }
    }
    return { label: 'After check-in (+3 biz days)', cls: 'bg-sky-50 text-sky-800 ring-sky-200/70' }
  }
  return { label: 'Pending', cls: 'bg-gray-100 text-gray-700 ring-gray-200/70' }
}

export const PARTNER_PAYOUT_SCHEDULE_OWNER_SUMMARY =
  'Payouts are initiated within 3 business days after guest check-in. Your first 3 bookings use a provisional schedule (3 business days after checkout) while we verify your account.'
