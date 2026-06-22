/** Booking statuses that occupy a spot on the calendar / capacity counts. */
export const OCCUPYING_BOOKING_STATUSES = [
  'pending',
  'gym_confirmed',
  'confirmed',
  'paid',
  'completed',
  // legacy
  'pending_payment',
  'pending_confirmation',
  'awaiting_approval',
] as const

export type OccupyingBookingStatus = (typeof OCCUPYING_BOOKING_STATUSES)[number]
