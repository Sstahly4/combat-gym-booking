export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getGymReadiness } from '@/lib/onboarding/readiness'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gymId = request.nextUrl.searchParams.get('gym_id')
    if (!gymId) {
      return NextResponse.json({ error: 'gym_id is required' }, { status: 400 })
    }

    const readiness = await getGymReadiness({
      supabase: access.supabase,
      gymId,
      ownerId: access.userId,
    })

    await recordOwnerEvent(access.supabase as never, {
      event_type: 'readiness_checked',
      user_id: access.userId,
      gym_id: gymId,
      metadata: { can_go_live: readiness.canGoLive },
    })

    return NextResponse.json(readiness)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to compute readiness' },
      { status: 500 }
    )
  }
}
