import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import {
  BOOKING_STATUS_PAYMENT_FAILED,
  buildBookingStatusUpdate,
  shouldApplyPaymentFailedStatus,
} from '@/lib/bookings/booking-lifecycle'

export type PaymentFailedBookingResult =
  | { ok: true; booking_id: string; already_recorded: boolean }
  | { ok: false; reason: 'not_found' | 'ineligible_status' | 'update_failed'; detail?: string }

/**
 * Record a Stripe card decline against the pending checkout booking.
 * Idempotent when status is already `payment_failed`.
 */
export async function recordPaymentFailedForIntent(
  supabase: SupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<PaymentFailedBookingResult> {
  const paymentIntentId = paymentIntent.id

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, booking_reference')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (bookingError) {
    return { ok: false, reason: 'update_failed', detail: bookingError.message }
  }

  if (!booking) {
    return { ok: false, reason: 'not_found' }
  }

  if (booking.status === BOOKING_STATUS_PAYMENT_FAILED) {
    return { ok: true, booking_id: booking.id, already_recorded: true }
  }

  if (!shouldApplyPaymentFailedStatus(booking.status)) {
    return {
      ok: false,
      reason: 'ineligible_status',
      detail: `status=${booking.status}`,
    }
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update(buildBookingStatusUpdate(BOOKING_STATUS_PAYMENT_FAILED))
    .eq('id', booking.id)

  if (updateError) {
    return { ok: false, reason: 'update_failed', detail: updateError.message }
  }

  return { ok: true, booking_id: booking.id, already_recorded: false }
}
