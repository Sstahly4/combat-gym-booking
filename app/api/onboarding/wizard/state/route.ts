export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { resolveActiveGymId } from '@/lib/onboarding/wizard-api-logic'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { supabase } = access

    const requestedGymId = request.nextUrl.searchParams.get('gym_id')

    const { data: ownerGyms } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('owner_id', access.userId)
      .order('created_at', { ascending: false })

    let sessionQuery = supabase
      .from('owner_onboarding_sessions')
      .select('id, owner_id, gym_id, state, started_at, completed_at, created_at, updated_at')
      .eq('owner_id', access.userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (requestedGymId) {
      sessionQuery = sessionQuery.eq('gym_id', requestedGymId)
    }

    const { data: sessions, error: sessionError } = await sessionQuery
    if (sessionError) {
      return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 })
    }

    let session = sessions?.[0] || null

    if (!session) {
      const ownerGym = ownerGyms?.[0] || null
      const activeGymId = resolveActiveGymId({
        requestedGymId,
        sessionGymId: null,
        latestOwnerGymId: ownerGym?.id || null,
      })

      const { data: createdSession, error: createError } = await supabase
        .from('owner_onboarding_sessions')
        .insert({
          owner_id: access.userId,
          gym_id: activeGymId,
          state: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('id, owner_id, gym_id, state, started_at, completed_at, created_at, updated_at')
        .single()

      if (createError || !createdSession) {
        return NextResponse.json({ error: 'Failed to initialize onboarding session' }, { status: 500 })
      }
      session = createdSession
    }

    const { data: steps, error: stepsError } = await supabase
      .from('owner_onboarding_steps')
      .select('step_key, completed_at, metadata')
      .eq('session_id', session.id)

    if (stepsError) {
      return NextResponse.json({ error: 'Failed to load onboarding steps' }, { status: 500 })
    }

    const activeGymId = resolveActiveGymId({
      requestedGymId,
      sessionGymId: session.gym_id || null,
      latestOwnerGymId: ownerGyms?.[0]?.id || null,
    })

    // Explicitly bind session to active gym context when known.
    if (activeGymId && session.gym_id !== activeGymId) {
      await supabase
        .from('owner_onboarding_sessions')
        .update({ gym_id: activeGymId })
        .eq('id', session.id)
      session = { ...session, gym_id: activeGymId }
    }

    return NextResponse.json({
      session,
      steps: steps || [],
      active_gym_id: activeGymId,
      gyms: ownerGyms || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load wizard state' },
      { status: 500 }
    )
  }
}
