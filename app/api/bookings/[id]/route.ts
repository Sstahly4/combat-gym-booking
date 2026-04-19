import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS - this endpoint is for admin use
    const supabase = createAdminClient()
    const bookingId = params.id

    // Get booking with all related data
    // Force fresh data by not using cache
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
      console.error('Booking query error:', bookingError)
      return NextResponse.json({ 
        error: 'Booking not found',
        details: bookingError?.message 
      }, { status: 404 })
    }

    // Return with no-cache headers to ensure fresh data
    return NextResponse.json(booking, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}
