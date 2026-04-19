import type { SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'
import {
  isCaptureDue,
  resolveCancellationPolicy,
  type CancellationPolicySnapshotV1,
} from '@/lib/booking/cancellation-policy'
import type { GymCancellationPolicyTone } from '@/lib/booking/cancellation-policy'

type BookingRow = {
  id: string
  status: string
  stripe_payment_intent_id: string | null
  start_date: string
  cancellation_policy_snapshot: CancellationPolicySnapshotV1 | null
  guest_email: string | null
  guest_name: string | null
  booking_reference: string | null
  booking_pin: string | null
  total_price: number
  gym_id: string
}

export type CaptureBookingResult =
  | { ok: true; alreadyCaptured?: boolean }
  | { ok: false; error: string; code?: string }

/**
 * Shared capture implementation for the owner dashboard route and the post-deadline cron job.
 */
export async function runBookingPaymentCapture(params: {
  supabase: SupabaseClient
  bookingId: string
  requestOrigin: string
  /** When true, skips the cancellation-window guard (admin only). */
  force: boolean
  isAdmin: boolean
}): Promise<CaptureBookingResult> {
  const { supabase, bookingId, requestOrigin, force, isAdmin } = params

  if (!stripe) {
    return { ok: false, error: 'Payment system is not configured' }
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
        *,
        gym:gyms(name, city, country, currency, owner_id, cancellation_policy_tone),
        package:packages(name, cancellation_policy_days, includes_meals, meal_plan_details),
        variant:package_variants(name)
      `
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return { ok: false, error: 'Booking not found' }
  }

  const b = booking as BookingRow & {
    end_date: string
    gym: {
      name: string
      city: string
      country: string
      currency: string
      owner_id: string
      cancellation_policy_tone?: string | null
    }
    package: {
      name: string
      cancellation_policy_days: number | null
      includes_meals?: boolean
      meal_plan_details?: unknown
    } | null
    variant: { name: string } | null
  }

  if (b.status === 'paid' || b.status === 'completed') {
    return { ok: true, alreadyCaptured: true }
  }
  if (b.status !== 'confirmed') {
    return { ok: false, error: 'Invalid booking status' }
  }
  if (!b.stripe_payment_intent_id) {
    return { ok: false, error: 'Payment intent not found' }
  }

  const snapshot = b.cancellation_policy_snapshot as CancellationPolicySnapshotV1 | null
  const computed = resolveCancellationPolicy({
    startDate: b.start_date,
    packageCancellationPolicyDays: b.package?.cancellation_policy_days ?? null,
    gymPolicyTone: (b.gym.cancellation_policy_tone as GymCancellationPolicyTone | null) ?? null,
  })

  const now = new Date()
  if (!force && !isCaptureDue(snapshot, computed, now)) {
    return {
      ok: false,
      code: 'CAPTURE_TOO_EARLY',
      error:
        'Cancellation window has not closed yet. Capture runs automatically after the deadline, or use force with admin access.',
    }
  }
  if (force && !isAdmin) {
    return { ok: false, error: 'Forced capture requires admin privileges' }
  }

  let paymentAlreadyCaptured = false
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(b.stripe_payment_intent_id)
    if (paymentIntent.status === 'succeeded') {
      paymentAlreadyCaptured = true
    }
  } catch (stripeError) {
    console.error('Error checking payment intent status:', stripeError)
  }

  if (!paymentAlreadyCaptured) {
    try {
      await stripe.paymentIntents.capture(b.stripe_payment_intent_id)
    } catch (captureError: unknown) {
      const code = (captureError as { code?: string }).code
      if (code === 'payment_intent_already_captured') {
        paymentAlreadyCaptured = true
      } else {
        throw captureError
      }
    }
  }

  await supabase
    .from('bookings')
    .update({ status: 'paid', payment_captured_at: new Date().toISOString() })
    .eq('id', bookingId)

  let cardLast4: string | undefined
  let cardBrand: string | undefined
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(b.stripe_payment_intent_id)
    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
      cardLast4 = paymentMethod.card?.last4
      cardBrand = paymentMethod.card?.brand
    }
  } catch (stripeError) {
    console.error('Error fetching payment method details:', stripeError)
  }

  let magicLink: string | undefined
  if (b.guest_email) {
    try {
      const tokenResponse = await fetch(`${requestOrigin}/api/bookings/${bookingId}/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: b.guest_email,
          expiresInDays: 90,
        }),
      })
      if (tokenResponse.ok) {
        const { token } = await tokenResponse.json()
        magicLink = `${requestOrigin}/bookings/access/${token}`
      }
    } catch (tokenError) {
      console.error('Error generating magic link:', tokenError)
    }
  }

  if (b.guest_email) {
    const gym = b.gym
    const package_ = b.package
    const variant = b.variant
    try {
      await sendBookingConfirmedEmail({
        bookingReference: b.booking_reference || bookingId,
        bookingPin: b.booking_pin || 'N/A',
        guestName: b.guest_name || 'Guest',
        guestEmail: b.guest_email,
        gymName: gym.name,
        gymCountry: gym.country,
        startDate: b.start_date,
        endDate: (b as { end_date: string }).end_date,
        packageName: package_?.name,
        variantName: variant?.name,
        totalPrice: b.total_price,
        currency: gym.currency || 'USD',
        cardLast4,
        cardBrand: cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : undefined,
        chargeDate: new Date().toISOString(),
        mealPlanDetails: package_?.meal_plan_details || null,
        magicLink,
      })
    } catch (emailError) {
      console.error('Error sending booking confirmed email:', emailError)
    }
  }

  return { ok: true }
}
