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

    // Idempotency: if already pending_confirmation or confirmed, don't re-send notifications.
    if (booking.status === 'pending_confirmation' || booking.status === 'confirmed') {
      console.log(`Booking already ${booking.status} - skipping notify`)
      return NextResponse.json({ success: true, already_confirmed: true })
    }

    // If booking doesn't have payment_intent_id yet, update it first
    if (!booking.stripe_payment_intent_id) {
      console.log('Updating booking with payment intent ID...')
      const { error: updateIntentError } = await supabase
        .from('bookings')
        .update({ stripe_payment_intent_id: payment_intent })
        .eq('id', bookingId)

      if (updateIntentError) {
        console.error('Error updating payment intent ID:', updateIntentError)
        return NextResponse.json({ error: 'Failed to update payment intent' }, { status: 500 })
      }
    }

    // Verify payment intent matches
    if (booking.stripe_payment_intent_id && booking.stripe_payment_intent_id !== payment_intent) {
      console.error('Payment intent mismatch:', {
        booking: booking.stripe_payment_intent_id,
        url: payment_intent
      })
      return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 })
    }

    // Update booking status to pending_confirmation
    // Payment is authorized but not captured yet
    console.log('Updating booking status to pending_confirmation...')
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'pending_confirmation',
        stripe_payment_intent_id: payment_intent // Ensure it's set
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    console.log('✅ Booking status updated to pending_confirmation')

    // Send notifications (admin + gym owner)
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
