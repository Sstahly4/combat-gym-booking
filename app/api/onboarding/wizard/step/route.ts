export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { OWNER_WIZARD_STEPS } from '@/lib/onboarding/owner-wizard'
import { buildStepMetadata, validateWizardStepKey } from '@/lib/onboarding/wizard-api-logic'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { supabase } = access

    const body = await request.json()
    const sessionId = String(body?.session_id || '')
    const stepKey = String(body?.step_key || '')
    const gymId = body?.gym_id ? String(body.gym_id) : null
    const completed = Boolean(body?.completed)
    const metadata = typeof body?.metadata === 'object' && body?.metadata !== null ? body.metadata : {}

    if (!sessionId || !stepKey) {
      return NextResponse.json({ error: 'session_id and step_key are required' }, { status: 400 })
    }

    if (!validateWizardStepKey(stepKey, OWNER_WIZARD_STEPS.map((step) => step.key))) {
      return NextResponse.json({ error: 'Invalid step_key' }, { status: 400 })
    }

    const { data: session } = await supabase
      .from('owner_onboarding_sessions')
      .select('id, owner_id, gym_id')
      .eq('id', sessionId)
      .single()

    if (!session || session.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (gymId && session.gym_id !== gymId) {
      const { error: sessionUpdateError } = await supabase
        .from('owner_onboarding_sessions')
        .update({ gym_id: gymId })
        .eq('id', sessionId)

      if (sessionUpdateError) {
        return NextResponse.json({ error: 'Failed to bind session gym context' }, { status: 500 })
      }
    }

    const { error: upsertError } = await supabase
      .from('owner_onboarding_steps')
      .upsert(
        {
          session_id: sessionId,
          step_key: stepKey,
          completed_at: completed ? new Date().toISOString() : null,
          metadata: buildStepMetadata(metadata, {
            gym_id: gymId,
          }),
        },
        { onConflict: 'session_id,step_key' }
      )

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save step completion' }, { status: 500 })
    }

    await recordOwnerEvent(supabase as never, {
      event_type: completed ? 'wizard_step_completed' : 'wizard_step_started',
      user_id: access.userId,
      gym_id: gymId ?? session.gym_id ?? null,
      metadata: { step_key: stepKey, session_id: sessionId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update step status' },
      { status: 500 }
    )
  }
}
