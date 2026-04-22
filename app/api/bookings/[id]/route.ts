import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetch a single booking with its related gym/package/variant.
 *
 * Auth is delegated to Row Level Security on `public.bookings`, which allows:
 *   - The booking's owner (auth.uid() = bookings.user_id)
 *   - Guest bookings where user_id IS NULL (security enforced at app layer via
 *     magic-link tokens and PIN/reference codes)
 *   - The gym owner of the booking
 *   - Admin users
 *
 * Anything RLS hides shows up as a "not found" here, which is intentional.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const bookingId = params.id

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        gym:gyms(*),
        package:packages(*),
        variant:package_variants(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      if (bookingError && bookingError.code !== 'PGRST116') {
        console.error('Booking query error:', bookingError)
      }
      return NextResponse.json(
        { error: 'Booking not found', details: bookingError?.message },
        { status: 404 }
      )
    }

    return NextResponse.json(booking, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
