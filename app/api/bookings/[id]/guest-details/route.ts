import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { joinGuestName } from '@/lib/booking/guest-name'

/**
 * Update guest contact details on a pending booking during checkout.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const body = await request.json().catch(() => ({}))
    const first_name = typeof body.first_name === 'string' ? body.first_name.trim() : ''
    const last_name = typeof body.last_name === 'string' ? body.last_name.trim() : ''
    const guest_email =
      typeof body.guest_email === 'string' ? body.guest_email.trim().toLowerCase() : ''
    const guest_phone = typeof body.guest_phone === 'string' ? body.guest_phone.trim() : ''

    if (!first_name || !last_name || !guest_email || !guest_phone) {
      return NextResponse.json(
        { error: 'First name, last name, email, and phone are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const guest_name = joinGuestName(first_name, last_name)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, user_id, status, guest_name, guest_email, guest_phone')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.user_id && (!user || booking.user_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending bookings can be updated during checkout' },
        { status: 400 }
      )
    }

    const unchanged =
      booking.guest_name === guest_name &&
      booking.guest_email === guest_email &&
      booking.guest_phone === guest_phone

    if (unchanged) {
      return NextResponse.json({
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
      })
    }

    const db = booking.user_id && user ? supabase : createAdminClient()

    const { data: updated, error: updateError } = await db
      .from('bookings')
      .update({ guest_name, guest_email, guest_phone })
      .eq('id', bookingId)
      .eq('status', 'pending')
      .select('guest_name, guest_email, guest_phone')
      .single()

    if (updateError || !updated) {
      console.error('Guest details update error:', updateError)
      return NextResponse.json({ error: 'Failed to update your details' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update your details'
    console.error('PATCH guest-details error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
