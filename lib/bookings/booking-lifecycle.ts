/** Granular booking lifecycle statuses (migration 069+). */
export const BOOKING_STATUS_PAYMENT_FAILED = 'payment_failed' as const
export const BOOKING_STATUS_CANCELLED_BY_GYM = 'cancelled_by_gym' as const
export const BOOKING_STATUS_CANCELLED_BY_TRAVELLER = 'cancelled_by_traveller' as const

/** Statuses where a card decline at checkout should be recorded. */
const PAYMENT_FAILED_ELIGIBLE = new Set([
  'pending',
  'checkout_initiated',
  'payment_failed',
  'abandoned',
  'pending_confirmation',
  'pending_payment',
  'awaiting_approval',
])

/** Gym-side cancellation outcomes (includes legacy `declined`). */
export function isGymCancelledStatus(status: string): boolean {
  return status === 'declined' || status === BOOKING_STATUS_CANCELLED_BY_GYM
}

export function shouldApplyPaymentFailedStatus(currentStatus: string): boolean {
  if (['paid', 'completed', 'confirmed'].includes(currentStatus)) return false
  return PAYMENT_FAILED_ELIGIBLE.has(currentStatus)
}

export function buildBookingStatusUpdate(status: string): {
  status: string
  status_updated_at: string
  updated_at: string
} {
  const now = new Date().toISOString()
  return {
    status,
    status_updated_at: now,
    updated_at: now,
  }
}

const LIFECYCLE_LABELS: Record<string, string> = {
  payment_failed: 'Payment failed',
  checkout_initiated: 'Checkout started',
  abandoned: 'Abandoned',
  pending_confirmation: 'Awaiting gym',
  cancelled_by_gym: 'Cancelled by gym',
  cancelled_by_traveller: 'Cancelled by traveller',
  no_show: 'No show',
  refunded: 'Refunded',
  disputed: 'Disputed',
  declined: 'Declined',
}

export function bookingStatusDisplayLabel(status: string): string {
  return LIFECYCLE_LABELS[status] ?? status.replace(/_/g, ' ')
}
