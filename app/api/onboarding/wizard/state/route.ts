export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { resolveActiveGymId } from '@/lib/onboarding/wizard-api-logic'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'

const SESSION_SELECT =
  'id, owner_id, gym_id, state, started_at, completed_at, created_at, updated_at'

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { supabase } = access

    const requestedGymId = request.nextUrl.searchParams.get('gym_id')
    const createNew = request.nextUrl.searchParams.get('create_new') === '1'

    const { data: ownerGyms } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('owner_id', access.userId)
      .order('created_at', { ascending: false })

    let session: {
      id: string
      owner_id: string
      gym_id: string | null
      state: string
      started_at: string | null
      completed_at: string | null
      created_at: string
      updated_at: string
    } | null = null

    if (requestedGymId) {
      const { data: sessions, error: sessionError } = await supabase
        .from('owner_onboarding_sessions')
        .select(SESSION_SELECT)
        .eq('owner_id', access.userId)
        .eq('gym_id', requestedGymId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (sessionError) {
        return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 })
      }
      session = sessions?.[0] || null

      if (!session) {
        const activeGymId = resolveActiveGymId({
          requestedGymId,
          sessionGymId: null,
          latestOwnerGymId: ownerGyms?.[0]?.id || null,
        })

        const { data: createdSession, error: createError } = await supabase
          .from('owner_onboarding_sessions')
          .insert({
            owner_id: access.userId,
            gym_id: activeGymId,
            state: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select(SESSION_SELECT)
          .single()

        if (createError || !createdSession) {
          return NextResponse.json({ error: 'Failed to initialize onboarding session' }, { status: 500 })
        }
        session = createdSession
      }
    } else if (createNew) {
      const { data: draftSessions, error: draftError } = await supabase
        .from('owner_onboarding_sessions')
        .select(SESSION_SELECT)
        .eq('owner_id', access.userId)
        .is('gym_id', null)
        .eq('state', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)

      if (draftError) {
        return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 })
      }
      session = draftSessions?.[0] || null

      if (!session) {
        const { data: createdSession, error: createError } = await supabase
          .from('owner_onboarding_sessions')
          .insert({
            owner_id: access.userId,
            gym_id: null,
            state: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select(SESSION_SELECT)
          .single()

        if (createError || !createdSession) {
          return NextResponse.json({ error: 'Failed to initialize onboarding session' }, { status: 500 })
        }
        session = createdSession
      }
    } else {
      const { data: sessions, error: sessionError } = await supabase
        .from('owner_onboarding_sessions')
        .select(SESSION_SELECT)
        .eq('owner_id', access.userId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (sessionError) {
        return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 })
      }
      session = sessions?.[0] || null

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
          .select(SESSION_SELECT)
          .single()

        if (createError || !createdSession) {
          return NextResponse.json({ error: 'Failed to initialize onboarding session' }, { status: 500 })
        }
        session = createdSession
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Failed to load onboarding session' }, { status: 500 })
    }

    const { data: steps, error: stepsError } = await supabase
      .from('owner_onboarding_steps')
      .select('step_key, completed_at, metadata')
      .eq('session_id', session.id)

    if (stepsError) {
      return NextResponse.json({ error: 'Failed to load onboarding steps' }, { status: 500 })
    }

    const omitLatest = Boolean(createNew && !requestedGymId)
    const activeGymId = resolveActiveGymId({
      requestedGymId,
      sessionGymId: session.gym_id || null,
      latestOwnerGymId: ownerGyms?.[0]?.id || null,
      omitLatestGymFallback: omitLatest,
    })

    // Explicitly bind session to active gym context when known.
    if (activeGymId && session.gym_id !== activeGymId) {
      await supabase
        .from('owner_onboarding_sessions')
        .update({ gym_id: activeGymId })
        .eq('id', session.id)
      session = { ...session, gym_id: activeGymId as string | null }
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
