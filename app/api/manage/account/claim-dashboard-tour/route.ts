/**
 * POST /api/manage/account/claim-dashboard-tour
 *
 * Clears claim_dashboard_tour_pending after the owner finishes or skips the
 * first-run dashboard tour (claim-link handoff only).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

type Body = { outcome?: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, role, claim_dashboard_tour_pending')
      .eq('id', user.id)
      .single()

    if (profErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!profile.claim_dashboard_tour_pending) {
      return NextResponse.json({ ok: true, already_cleared: true })
    }

    const body = (await request.json().catch(() => ({}))) as Body
    const outcome = body.outcome === 'skipped' ? 'skipped' : 'finished'

    const now = new Date().toISOString()
    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        claim_dashboard_tour_pending: false,
        claim_dashboard_tour_completed_at: now,
        updated_at: now,
      })
      .eq('id', user.id)

    if (updErr) {
      return NextResponse.json({ error: updErr.message || 'Update failed' }, { status: 500 })
    }

    const admin = createAdminClient()
    await recordOwnerEvent(admin as never, {
      event_type: outcome === 'skipped' ? 'claim_dashboard_tour_skipped' : 'claim_dashboard_tour_finished',
      user_id: user.id,
      metadata: { outcome },
    })

    return NextResponse.json({ ok: true, outcome })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
