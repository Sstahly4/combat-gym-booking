import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { runBookingPaymentCapture } from '@/lib/bookings/run-capture'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerAccess = await getOwnerAccessContext()
    if (ownerAccess.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    let supabase: Awaited<ReturnType<typeof createClient>>
    let userId = ownerAccess.userId
    let isAdmin = false

    if (ownerAccess.status === 'ok') {
      supabase = ownerAccess.supabase
    } else {
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
      supabase = authClient
    }

    const bookingId = params.id
    const force = request.nextUrl.searchParams.get('force') === '1'

    const { data: bookingRow, error: bookingError } = await supabase
      .from('bookings')
      .select(`id, gym:gyms(owner_id)`)
      .eq('id', bookingId)
      .single()

    if (bookingError || !bookingRow) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const gymRow = bookingRow.gym as { owner_id: string } | { owner_id: string }[] | null
    const gym = Array.isArray(gymRow) ? gymRow[0] : gymRow
    if (!gym) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    if (!isAdmin && gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await runBookingPaymentCapture({
      supabase,
      bookingId,
      requestOrigin: request.nextUrl.origin,
      force,
      isAdmin,
    })

    if (!result.ok) {
      const status =
        result.code === 'CAPTURE_TOO_EARLY' ? 400 : result.error.includes('not found') ? 404 : 400
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: result.error.includes('not configured') ? 500 : status }
      )
    }

    return NextResponse.json({ success: true, already_captured: result.alreadyCaptured })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to capture payment'
    console.error('Payment capture error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
