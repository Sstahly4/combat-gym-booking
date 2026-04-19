export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getGymReadiness } from '@/lib/onboarding/readiness'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const gymId = String(body?.gym_id || '')
    if (!gymId) {
      return NextResponse.json({ error: 'gym_id is required' }, { status: 400 })
    }

    await recordOwnerEvent(access.supabase as never, {
      event_type: 'go_live_attempted',
      user_id: access.userId,
      gym_id: gymId,
    })

    const readiness = await getGymReadiness({
      supabase: access.supabase,
      gymId,
      ownerId: access.userId,
    })
    if (!readiness.canGoLive) {
      await recordOwnerEvent(access.supabase as never, {
        event_type: 'readiness_failed',
        user_id: access.userId,
        gym_id: gymId,
        metadata: { required: readiness.required ?? null },
      })
      await recordOwnerEvent(access.supabase as never, {
        event_type: 'go_live_failed',
        user_id: access.userId,
        gym_id: gymId,
        metadata: { reason: 'readiness' },
      })
      return NextResponse.json(
        { error: 'Readiness requirements not met', readiness },
        { status: 400 }
      )
    }

    const { data: gym } = await access.supabase
      .from('gyms')
      .select('is_live')
      .eq('id', gymId)
      .eq('owner_id', access.userId)
      .maybeSingle()

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    if (gym.is_live) {
      return NextResponse.json({ success: true, already_live: true })
    }

    const { error: updateError } = await access.supabase
      .from('gyms')
      .update({ is_live: true })
      .eq('id', gymId)
      .eq('owner_id', access.userId)

    if (updateError) {
      await recordOwnerEvent(access.supabase as never, {
        event_type: 'go_live_failed',
        user_id: access.userId,
        gym_id: gymId,
        metadata: { reason: 'db_update' },
      })
      return NextResponse.json({ error: 'Failed to go live' }, { status: 500 })
    }

    await recordOwnerEvent(access.supabase as never, {
      event_type: 'go_live_succeeded',
      user_id: access.userId,
      gym_id: gymId,
    })

    return NextResponse.json({ success: true, already_live: false })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to go live' },
      { status: 500 }
    )
  }
}
