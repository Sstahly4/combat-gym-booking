import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendBookingRequestAcceptedEmail } from '@/lib/email'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

/**
 * Accept a booking request (Gym Owner Action)
 * Transitions: pending → confirmed
 * This means the gym has accepted the request and is ready to capture payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerAccess = await getOwnerAccessContext()
    if (ownerAccess.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let userId = ownerAccess.userId
    let isAdmin = false
    if (ownerAccess.status !== 'ok') {
      const authClient = await createClient()
      const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', ownerAccess.userId)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      isAdmin = true
      userId = ownerAccess.userId
    }

    const bookingId = params.id

    // Use admin client to bypass RLS for updates
    const supabase = createAdminClient()

    // Get booking with gym details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(id, name, owner_id, currency)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const gym = booking.gym as any

    // Verify user is gym owner or admin
    if (!isAdmin && gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate booking is in pending status
    if (booking.status !== 'pending') {
      return NextResponse.json({
        error: `Cannot accept booking. Current status: ${booking.status}. Only pending bookings can be accepted.`,
        current_status: booking.status
      }, { status: 400 })
    }

    // Update booking status to confirmed
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        gym_confirmed_at: new Date().toISOString(),
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

    // Send email to guest that their request was accepted
    if (booking.guest_email) {
      try {
        await sendBookingRequestAcceptedEmail({
          bookingReference: booking.booking_reference || bookingId,
          guestName: booking.guest_name || 'Guest',
          guestEmail: booking.guest_email,
          gymName: gym.name,
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalPrice: booking.total_price,
          currency: gym.currency || 'USD',
          paymentLink: `${request.nextUrl.origin}/bookings/${bookingId}/payment`,
        })
      } catch (emailError) {
        console.error('Error sending acceptance email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      status: 'confirmed',
      message: 'Booking request accepted. Guest will be notified to complete payment.'
    })
  } catch (error: any) {
    console.error('Error accepting booking request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept booking request' },
      { status: 500 }
    )
  }
}
