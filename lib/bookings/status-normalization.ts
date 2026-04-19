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
])

const CONFIRMED_STATUSES = new Set<string>(['gym_confirmed', 'confirmed'])

export function toCanonicalBookingStatus(status: BookingStatus | string): CanonicalBookingStatus {
  if (PENDING_STATUSES.has(status)) return 'pending'
  if (CONFIRMED_STATUSES.has(status)) return 'confirmed'
  if (status === 'paid') return 'paid'
  if (status === 'completed') return 'completed'
  if (status === 'declined') return 'declined'
  if (status === 'cancelled') return 'cancelled'
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
