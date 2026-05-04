import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Called after payment is authorized (not captured yet)
 * Updates booking status and sends notifications
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const bookingId = params.id
    const body = await request.json()
    const { payment_intent } = body

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    console.log('Confirming payment for booking:', bookingId)
    console.log('Payment intent from URL:', payment_intent)
    console.log('Payment intent in booking:', booking.stripe_payment_intent_id)

    // Idempotency: if already confirmed/paid, don't re-send notifications.
    if (booking.status === 'confirmed' || booking.status === 'paid') {
      console.log(`Booking already ${booking.status} - skipping notify`)
      return NextResponse.json({ success: true, already_confirmed: true })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json({ error: 'Booking is not in a payable state' }, { status: 400 })
    }

    // Verify payment intent matches before we touch status
    if (booking.stripe_payment_intent_id && booking.stripe_payment_intent_id !== payment_intent) {
      console.error('Payment intent mismatch:', {
        booking: booking.stripe_payment_intent_id,
        url: payment_intent
      })
      return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 })
    }

    // Atomically transition pending → confirmed so only ONE request wins when
    // both the payment page and the success page call confirm-payment in parallel
    // (each would otherwise pass the stale "pending" check above and fire /notify twice).
    console.log('Updating booking status to confirmed (atomic pending → confirmed)...')
    const { data: transitioned, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: payment_intent,
      })
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    if (!transitioned) {
      const { data: fresh } = await supabase
        .from('bookings')
        .select('status, stripe_payment_intent_id')
        .eq('id', bookingId)
        .maybeSingle()

      const piOk =
        !fresh?.stripe_payment_intent_id || fresh.stripe_payment_intent_id === payment_intent
      if ((fresh?.status === 'confirmed' || fresh?.status === 'paid') && piOk) {
        console.log('Booking already confirmed by concurrent request — skipping notify')
        return NextResponse.json({ success: true, already_confirmed: true })
      }

      console.warn('Atomic confirm had no row; unexpected state', fresh)
      return NextResponse.json({ error: 'Could not confirm booking' }, { status: 409 })
    }

    console.log('✅ Booking status updated to confirmed')

    // Send notifications exactly once per successful transition
    console.log('Sending notifications...')
    try {
      const notifyResponse = await fetch(`${request.nextUrl.origin}/api/bookings/${bookingId}/notify`, {
        method: 'POST',
      })
      
      if (notifyResponse.ok) {
        console.log('✅ Notifications sent successfully')
      } else {
        const notifyError = await notifyResponse.json()
        console.error('Notification endpoint returned error:', notifyError)
      }
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
