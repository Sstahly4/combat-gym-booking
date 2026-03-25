import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Guest booking access via reference + PIN
 * Server-side endpoint to bypass RLS and verify PIN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_reference, booking_pin } = body

    if (!booking_reference || !booking_pin) {
      return NextResponse.json(
        { error: 'Booking reference and PIN are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find booking by reference (server-side bypasses RLS)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*),
        package:packages(*),
        variant:package_variants(*)
      `)
      .eq('booking_reference', booking_reference.toUpperCase())
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found. Please check your booking reference.' },
        { status: 404 }
      )
    }

    // Verify PIN
    if (!booking.booking_pin || booking.booking_pin !== booking_pin) {
      return NextResponse.json(
        { error: 'Invalid PIN. Please check your booking confirmation email.' },
        { status: 401 }
      )
    }

    // Return booking data (without sensitive info like PIN)
    const { booking_pin: _, ...bookingWithoutPin } = booking

    return NextResponse.json({
      success: true,
      booking: bookingWithoutPin,
    })
  } catch (error: any) {
    console.error('Error accessing guest booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to access booking' },
      { status: 500 }
    )
  }
}
