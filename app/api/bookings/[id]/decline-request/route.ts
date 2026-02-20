import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingRequestDeclinedEmail } from '@/lib/email'

/**
 * Decline a booking request (Gym Owner Action)
 * Transitions: pending → declined
 * This cancels the request and notifies the guest
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabaseAuth
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const bookingId = params.id
    const body = await request.json()
    const { reason } = body // Optional decline reason

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Get booking with gym details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(id, name, owner_id)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const gym = booking.gym as any

    // Verify user is gym owner or admin
    if (profile?.role !== 'admin' && gym.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate booking is in pending status
    if (booking.status !== 'pending') {
      return NextResponse.json({
        error: `Cannot decline booking. Current status: ${booking.status}. Only pending bookings can be declined.`,
        current_status: booking.status
      }, { status: 400 })
    }

    // Update booking status to declined
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      )
    }

    // Send email to guest that their request was declined
    if (booking.guest_email) {
      try {
        await sendBookingRequestDeclinedEmail({
          bookingReference: booking.booking_reference || bookingId,
          guestName: booking.guest_name || 'Guest',
          guestEmail: booking.guest_email,
          gymName: gym.name,
          reason: reason || 'Unfortunately, we cannot accommodate your request at this time.',
        })
      } catch (emailError) {
        console.error('Error sending decline email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      status: 'declined',
      message: 'Booking request declined. Guest has been notified.'
    })
  } catch (error: any) {
    console.error('Error declining booking request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline booking request' },
      { status: 500 }
    )
  }
}
