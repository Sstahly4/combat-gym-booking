import type { BookingStatus } from '@/lib/types/database'

export type CanonicalBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'declined'
  | 'cancelled'

const PENDING_STATUSES = new Set<string>([
  'pending',
  'pending_payment',
  'pending_confirmation',
  'awaiting_approval',
  'checkout_initiated',
  'payment_failed',
  'abandoned',
])

const CONFIRMED_STATUSES = new Set<string>(['gym_confirmed', 'confirmed'])

const CANCELLED_STATUSES = new Set<string>([
  'cancelled',
  'declined',
  'cancelled_by_traveller',
  'cancelled_by_gym',
  'no_show',
  'refunded',
  'disputed',
])

export function toCanonicalBookingStatus(status: BookingStatus | string): CanonicalBookingStatus {
  if (PENDING_STATUSES.has(status)) return 'pending'
  if (CONFIRMED_STATUSES.has(status)) return 'confirmed'
  if (status === 'paid') return 'paid'
  if (status === 'completed') return 'completed'
  if (CANCELLED_STATUSES.has(status)) {
    if (status === 'declined' || status === 'cancelled_by_gym') return 'declined'
    return 'cancelled'
  }
  return 'pending'
}

export function canonicalBookingStatusLabel(status: CanonicalBookingStatus) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'confirmed':
      return 'Confirmed'
    case 'paid':
      return 'Paid'
    case 'completed':
      return 'Completed'
    case 'declined':
      return 'Declined'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Pending'
  }
}

/** @deprecated Import from `@/lib/bookings/admin-booking-filters` instead. */
export { ADMIN_ACTIVITY_BOOKING_STATUSES } from '@/lib/bookings/admin-booking-filters'
