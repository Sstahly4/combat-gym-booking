import { parseBookingDay, startOfLocalDay } from '@/lib/booking/validate-booking-dates'

/**
 * Admin booking list filters — maps OTA-style lifecycle groups onto DB statuses.
 *
 * CombatStay today:
 * - Packages use `booking_mode`: `instant` (pay → confirmed) or `request_to_book` (gym accept flow).
 * - Checkout abandon / card decline still land as `pending` until granular funnel statuses ship.
 * - `upcoming` is derived: confirmed|paid with stay not yet finished (end_date >= today).
 */
export type AdminBookingListFilter = 'live' | 'funnel' | 'completed' | 'cancelled' | 'all'

export const DEFAULT_ADMIN_BOOKING_FILTER: AdminBookingListFilter = 'live'

export const ADMIN_BOOKING_FILTER_OPTIONS: {
  value: AdminBookingListFilter
  label: string
  hint: string
}[] = [
  {
    value: 'live',
    label: 'Live & upcoming',
    hint: 'Confirmed or paid — active or future stays',
  },
  {
    value: 'funnel',
    label: 'Checkout funnel',
    hint: 'Started checkout, payment failed, or abandoned',
  },
  {
    value: 'completed',
    label: 'Completed',
    hint: 'Training or stay finished',
  },
  {
    value: 'cancelled',
    label: 'Cancelled & disputes',
    hint: 'Declined, cancelled, refunded, or disputed',
  },
  {
    value: 'all',
    label: 'All statuses',
    hint: 'Full diagnostic view',
  },
]

/** Funnel / pre-booking — current + migration-ready granular statuses. */
export const BOOKING_FUNNEL_DB_STATUSES = [
  'pending',
  'checkout_initiated',
  'payment_failed',
  'abandoned',
  'pending_confirmation',
] as const

/** Active booking — paid and accepted (upcoming is derived via dates). */
export const BOOKING_LIVE_DB_STATUSES = ['confirmed', 'paid'] as const

/** Terminal — stay finished. */
export const BOOKING_COMPLETED_DB_STATUSES = ['completed'] as const

/** Terminal — negative outcomes. */
export const BOOKING_CANCELLED_DB_STATUSES = [
  'cancelled',
  'declined',
  'cancelled_by_traveller',
  'cancelled_by_gym',
  'no_show',
  'refunded',
  'disputed',
] as const

/** Real bookings for admin activity bell / notifications (excludes funnel noise). */
export const ADMIN_ACTIVITY_BOOKING_STATUSES = [
  'confirmed',
  'paid',
  'completed',
] as const

export function dbStatusesForAdminFilter(
  filter: AdminBookingListFilter,
): readonly string[] | null {
  switch (filter) {
    case 'live':
      return BOOKING_LIVE_DB_STATUSES
    case 'funnel':
      return BOOKING_FUNNEL_DB_STATUSES
    case 'completed':
      return BOOKING_COMPLETED_DB_STATUSES
    case 'cancelled':
      return BOOKING_CANCELLED_DB_STATUSES
    case 'all':
      return null
    default:
      return BOOKING_LIVE_DB_STATUSES
  }
}

export function isBookingStayActiveOrUpcoming(
  endDate: string,
  now: Date = new Date(),
): boolean {
  if (!endDate) return false
  const today = startOfLocalDay(now)
  const end = parseBookingDay(endDate)
  return end >= today
}

export function passesAdminBookingFilter(
  booking: { status: string; end_date: string },
  filter: AdminBookingListFilter,
  now: Date = new Date(),
): boolean {
  const statuses = dbStatusesForAdminFilter(filter)
  if (statuses && !statuses.includes(booking.status)) return false
  if (filter === 'live' && !isBookingStayActiveOrUpcoming(booking.end_date, now)) {
    return false
  }
  return true
}

export function parseAdminBookingFilter(
  raw: string | null | undefined,
): AdminBookingListFilter {
  const v = raw?.trim().toLowerCase()
  if (v && ADMIN_BOOKING_FILTER_OPTIONS.some((o) => o.value === v)) {
    return v as AdminBookingListFilter
  }
  return DEFAULT_ADMIN_BOOKING_FILTER
}
