import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * Validate magic link token and return booking access
 * This is the endpoint that validates tokens from magic links
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient()
    const token = params.token

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find token record
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('booking_access_tokens')
      .select('*, booking:bookings(*)')
      .eq('token_hash', tokenHash)
      .single()

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenRecord.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 410 })
    }

    // Check if single-use token was already used
    if (tokenRecord.is_single_use && tokenRecord.used_at) {
      return NextResponse.json({ error: 'Token has already been used' }, { status: 410 })
    }

    // Mark token as used if it's single-use
    if (tokenRecord.is_single_use && !tokenRecord.used_at) {
      await supabase
        .from('booking_access_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', tokenRecord.id)
    }

    // Return booking access info (booking will be fetched on the page)
    return NextResponse.json({
      booking_id: tokenRecord.booking_id,
      email: tokenRecord.email,
      expires_at: tokenRecord.expires_at,
    })
  } catch (error: any) {
    console.error('Error validating access token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate token' },
      { status: 500 }
    )
  }
}
