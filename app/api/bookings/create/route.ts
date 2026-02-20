import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

// Generate booking reference (e.g., "BK-ABC123")
function generateBookingReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  const random = randomBytes(3)
  let ref = 'BK-'
  for (let i = 0; i < 3; i++) {
    ref += chars[random[i] % chars.length]
  }
  return ref
}

// Generate 6-digit PIN
function generateBookingPin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { 
      gym_id, 
      package_id, 
      package_variant_id, 
      start_date, 
      end_date, 
      discipline, 
      experience_level, 
      notes, 
      total_price, 
      platform_fee,
      guest_email,
      guest_phone,
      guest_name
    } = body

    // Validate required fields
    if (!gym_id || !start_date || !end_date || !discipline || !experience_level || !total_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For guest bookings, require email, phone, and name
    if (!user && (!guest_email || !guest_phone || !guest_name)) {
      return NextResponse.json({ error: 'Guest bookings require email, phone, and name' }, { status: 400 })
    }

    // Verify gym exists and is verified (not draft)
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, verification_status, status')
      .eq('id', gym_id)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    // Block bookings for draft gyms
    if (gym.verification_status === 'draft') {
      return NextResponse.json({ error: 'This gym is not yet verified and cannot accept bookings' }, { status: 400 })
    }

    // Keep legacy status check for compatibility
    if (gym.status !== 'approved') {
      return NextResponse.json({ error: 'Gym is not approved for bookings' }, { status: 400 })
    }

    // Check package booking_mode if package_id is provided
    let bookingMode: 'request_to_book' | 'instant' = 'request_to_book' // Default to request-to-book
    if (package_id) {
      const { data: packageData } = await supabase
        .from('packages')
        .select('booking_mode')
        .eq('id', package_id)
        .single()
      
      if (packageData?.booking_mode) {
        bookingMode = packageData.booking_mode as 'request_to_book' | 'instant'
      }
    }

    // Generate booking reference and PIN
    let bookingReference = generateBookingReference()
    let bookingPin = generateBookingPin()
    
    // Ensure unique reference (retry if collision)
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('bookings')
        .select('id')
        .eq('booking_reference', bookingReference)
        .single()
      
      if (!existing) break
      bookingReference = generateBookingReference()
      attempts++
    }

    // Determine initial status based on booking mode
    // Request-to-Book: Start as 'pending' (no payment intent yet)
    // Instant: Start as 'pending_payment' (create payment intent immediately)
    const initialStatus = bookingMode === 'request_to_book' ? 'pending' : 'pending_payment'
    const requestSubmittedAt = bookingMode === 'request_to_book' ? new Date().toISOString() : null

    // Create booking (guest or authenticated)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user?.id || null,  // Null for guest bookings
        gym_id,
        package_id: package_id || null,
        package_variant_id: package_variant_id || null,
        start_date,
        end_date,
        discipline,
        experience_level,
        notes: notes || null,
        total_price,
        platform_fee,
        status: initialStatus,
        request_submitted_at: requestSubmittedAt,
        guest_email: guest_email || null,
        guest_phone: guest_phone || null,
        guest_name: guest_name || null,
        booking_reference: bookingReference,
        booking_pin: bookingPin,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({ 
      booking_id: booking.id,
      booking_reference: bookingReference,
      booking_pin: bookingPin
    })
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
