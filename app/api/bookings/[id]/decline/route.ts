import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import {
  BOOKING_STATUS_CANCELLED_BY_GYM,
  buildBookingStatusUpdate,
} from '@/lib/bookings/booking-lifecycle'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { supabase } = access

    const bookingId = params.id

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(owner_id)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const gym = booking.gym as any

    if (gym.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
    }

    // Cancel the payment intent if it exists
    if (booking.stripe_payment_intent_id && stripe) {
      await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id)
    }

    await supabase
      .from('bookings')
      .update(buildBookingStatusUpdate(BOOKING_STATUS_CANCELLED_BY_GYM))
      .eq('id', bookingId)

    return NextResponse.json({ success: true, status: BOOKING_STATUS_CANCELLED_BY_GYM })
  } catch (error: any) {
    console.error('Booking decline error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline booking' },
      { status: 500 }
    )
  }
}
