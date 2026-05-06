import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'

/**
 * Admin-only: mark a booking paid when payment was collected outside Stripe
 * (bank transfer, cash, gym not yet on Stripe Connect, etc.).
 *
 * Allowed from `pending` or from `confirmed` when there is no PaymentIntent on file.
 * Does not replace card capture when a Stripe PaymentIntent exists — use Capture or Sync instead.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const bookingId = params.id
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[record-manual-payment] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      *,
      gym:gyms(name, city, country, currency, owner_id),
      package:packages(name, cancellation_policy_days, includes_meals, meal_plan_details),
      variant:package_variants(name)
    `
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const row = booking as {
    id: string
    status: string
    stripe_payment_intent_id: string | null
    gym_confirmed_at: string | null
    guest_email: string | null
    guest_name: string | null
    booking_reference: string | null
    booking_pin: string | null
    total_price: number
    start_date: string
    end_date: string
    gym: { name: string; city: string; country: string; currency: string }
    package: {
      name: string | null
      meal_plan_details?: unknown
    } | null
    variant: { name: string | null } | null
  }

  if (row.status === 'paid' || row.status === 'completed') {
    return NextResponse.json({ success: true, already_paid: true })
  }
  if (row.status === 'declined' || row.status === 'cancelled') {
    return NextResponse.json(
      { error: `Cannot mark a ${row.status} booking as paid.` },
      { status: 400 }
    )
  }

  if (row.status === 'confirmed' && row.stripe_payment_intent_id) {
    return NextResponse.json(
      {
        error:
          'This booking has a Stripe payment on file. Use Capture payment or Sync with Stripe instead of manual paid.',
      },
      { status: 400 }
    )
  }

  if (row.status !== 'pending' && row.status !== 'confirmed') {
    return NextResponse.json(
      { error: `Unsupported status for manual payment: ${row.status}` },
      { status: 400 }
    )
  }

  if (row.stripe_payment_intent_id && stripe) {
    try {
      await stripe.paymentIntents.cancel(row.stripe_payment_intent_id)
    } catch (cancelErr) {
      console.warn('[record-manual-payment] could not cancel payment intent', cancelErr)
    }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'paid',
      stripe_payment_intent_id: null,
      gym_confirmed_at: row.gym_confirmed_at || now,
      payment_captured_at: now,
      updated_at: now,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error('[record-manual-payment] update', updateError)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }

  const origin = request.nextUrl.origin
  let magicLink: string | undefined
  if (row.guest_email) {
    try {
      const tokenResponse = await fetch(`${origin}/api/bookings/${bookingId}/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: row.guest_email,
          expiresInDays: 90,
        }),
      })
      if (tokenResponse.ok) {
        const body = (await tokenResponse.json()) as { token?: string }
        if (body.token) {
          magicLink = `${origin}/bookings/access/${body.token}`
        }
      }
    } catch (e) {
      console.error('[record-manual-payment] magic link', e)
    }
  }

  let emailSent = false
  if (row.guest_email) {
    try {
      emailSent = await sendBookingConfirmedEmail({
        bookingReference: row.booking_reference || bookingId,
        bookingPin: row.booking_pin || 'N/A',
        guestName: row.guest_name || 'Guest',
        guestEmail: row.guest_email,
        gymName: row.gym.name,
        gymCountry: row.gym.country,
        startDate: row.start_date,
        endDate: row.end_date,
        packageName: row.package?.name ?? undefined,
        variantName: row.variant?.name ?? undefined,
        totalPrice: row.total_price,
        currency: row.gym.currency || 'USD',
        chargeDate: now,
        mealPlanDetails: row.package?.meal_plan_details || null,
        magicLink,
      })
    } catch (emailError) {
      console.error('[record-manual-payment] email', emailError)
    }
  }

  return NextResponse.json({
    success: true,
    status: 'paid',
    email_sent: emailSent,
  })
}
