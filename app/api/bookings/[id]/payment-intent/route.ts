import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLATFORM_COMMISSION_RATE } from '@/lib/stripe'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const bookingId = params.id

    // Get booking (allow guest bookings - server-side can access all bookings)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(stripe_account_id, currency)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify ownership if user is authenticated (optional check)
    if (user && booking.user_id && booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only allow creating/retrieving a PaymentIntent for bookings that haven't been processed yet.
    // Note: `create` defaults request-to-book to `pending`, but the payment page still needs to work.
    const allowedStatuses = new Set(['pending', 'pending_payment'])
    if (!allowedStatuses.has(booking.status)) {
      return NextResponse.json(
        { error: 'Booking already processed', details: `status=${booking.status}` },
        { status: 400 }
      )
    }

    const gym = booking.gym as any

    // Check if Stripe is configured
    if (!stripe) {
      console.error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.')
      return NextResponse.json(
        { 
          error: 'Payment system is not configured. Please contact support.',
          details: 'Stripe API key is missing or invalid. Please check your environment configuration.'
        },
        { status: 500 }
      )
    }

    // Idempotency: if we already created a PaymentIntent for this booking, reuse it.
    if (booking.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
        if (existing.client_secret && existing.status !== 'canceled') {
          return NextResponse.json({ client_secret: existing.client_secret })
        }
      } catch (e) {
        console.warn('Failed to retrieve existing payment intent, will create a new one:', e)
      }
    }

    // MVP: Payment goes to platform account, not gym's account
    // No requirement for gym.stripe_account_id
    // Manual settlement with gym happens later

    // Create PaymentIntent with manual capture (authorize now, charge after gym confirms)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.total_price * 100), // Convert to cents
      currency: gym.currency.toLowerCase(),
      capture_method: 'manual', // Authorize now, capture later
      payment_method_types: ['card'],
      // No transfer_data - payment goes to platform account
      // Platform keeps 15%, pays gym manually later
      metadata: {
        booking_id: bookingId,
        gym_id: booking.gym_id,
        booking_reference: booking.booking_reference || '',
      },
    })

    // Update booking with payment intent ID.
    // Ensure status is `pending_payment` so subsequent loads don't get blocked.
    await supabase
      .from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id, status: 'pending_payment' })
      .eq('id', bookingId)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
