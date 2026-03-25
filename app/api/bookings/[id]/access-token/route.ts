import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Generate a magic link access token for a booking
 * Called when sending confirmation emails
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const bookingId = params.id
    const body = await request.json()
    const { email, expiresInDays = 90 } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Get booking to verify it exists and email matches
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, guest_email, booking_reference')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify email matches (security: prevent token generation for wrong email)
    if (booking.guest_email && booking.guest_email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match booking' }, { status: 403 })
    }

    // Generate secure random token (UUID v4 style, but longer for extra security)
    const rawToken = crypto.randomBytes(32).toString('hex') // 64 character hex string
    
    // Hash the token (SHA-256) before storing
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    // Calculate expiry (default 90 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Store hashed token in database
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('booking_access_tokens')
      .insert({
        booking_id: bookingId,
        token_hash: tokenHash,
        email: email.toLowerCase(),
        expires_at: expiresAt.toISOString(),
        is_single_use: false, // Long-lived tokens (can be changed to true for single-use)
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Error creating access token:', tokenError)
      return NextResponse.json({ error: 'Failed to create access token' }, { status: 500 })
    }

    // Return the plaintext token (only time it's exposed - must be sent via email)
    return NextResponse.json({
      token: rawToken,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating access token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate access token' },
      { status: 500 }
    )
  }
}
