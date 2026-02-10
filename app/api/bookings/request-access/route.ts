import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendUserConfirmationEmail } from '@/lib/email'

/**
 * Request booking access via email + booking reference
 * Fallback method if user doesn't have magic link
 * Sends a new magic link to their email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, booking_reference } = body

    if (!email || !booking_reference) {
      return NextResponse.json(
        { error: 'Email and booking reference are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find booking by reference and email
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, guest_email, booking_reference')
      .eq('booking_reference', booking_reference.toUpperCase())
      .eq('guest_email', email.toLowerCase())
      .single()

    if (bookingError || !booking) {
      // Don't reveal if booking exists or not (security)
      return NextResponse.json({
        success: true,
        message: 'If a booking exists with that email and reference, a magic link has been sent.',
      })
    }

    // Get full booking details for email
    const { data: fullBooking, error: fullBookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(name),
        package:packages(name),
        variant:package_variants(name)
      `)
      .eq('id', booking.id)
      .single()

    if (fullBookingError || !fullBooking) {
      return NextResponse.json({ error: 'Failed to load booking details' }, { status: 500 })
    }

    const gym = fullBooking.gym as any
    const package_ = fullBooking.package as any
    const variant = fullBooking.variant as any

    // Generate new access token
    const tokenResponse = await fetch(
      `${request.nextUrl.origin}/api/bookings/${booking.id}/access-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: booking.guest_email, expiresInDays: 90 }),
      }
    )

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: 'Failed to generate access token' }, { status: 500 })
    }

    const { token } = await tokenResponse.json()

    // Send magic link email
    const magicLink = `${request.nextUrl.origin}/bookings/access/${token}`
    
    await sendUserConfirmationEmail({
      bookingReference: booking.booking_reference || booking.id,
      guestName: fullBooking.guest_name || 'Guest',
      guestEmail: booking.guest_email || email,
      gymName: gym?.name || 'Your Booking',
      startDate: fullBooking.start_date,
      endDate: fullBooking.end_date,
      packageName: package_?.name,
      variantName: variant?.name,
      magicLink,
    })
    
    return NextResponse.json({
      success: true,
      message: 'If a booking exists with that email and reference, a magic link has been sent.',
    })
  } catch (error: any) {
    console.error('Error requesting booking access:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to request access' },
      { status: 500 }
    )
  }
}
