export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadGymAvailabilityRange, toGuestDayList } from '@/lib/booking/gym-availability'

/**
 * Public gym availability for guest date pickers.
 * GET /api/gyms/[id]/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gymId = params.id?.trim()
    if (!gymId) {
      return NextResponse.json({ error: 'Gym id required' }, { status: 400 })
    }

    const from = request.nextUrl.searchParams.get('from')
    const to = request.nextUrl.searchParams.get('to')
    if (!from || !to) {
      return NextResponse.json(
        { error: 'from and to (YYYY-MM-DD) are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const result = await loadGymAvailabilityRange(supabase, {
      gymId,
      from,
      to,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const days = toGuestDayList(result.days, result.gym)

    return NextResponse.json({
      gym_id: gymId,
      range: { from, to },
      booking_advance_min_days: result.gym.booking_advance_min_days,
      booking_advance_max_days: result.gym.booking_advance_max_days,
      days,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load availability'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
