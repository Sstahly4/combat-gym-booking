export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { markOutreachSent } from '@/lib/integrations/fetch-outreach-status'
import { requireOutreachSyncAuth } from '@/lib/integrations/outreach-sync-auth'

/**
 * POST /api/integrations/outreach/mark-sent
 *
 * Body: { gym_id: string, sent_at?: ISO string, channel?: "whatsapp" }
 *
 * Sets outreach_sent_at on the latest active claim token for the gym.
 * Authorization: Bearer OUTREACH_SYNC_SECRET
 */
export async function POST(request: NextRequest) {
  const authErr = requireOutreachSyncAuth(request)
  if (authErr) return authErr

  let body: { gym_id?: string; sent_at?: string; channel?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const gymId = (body.gym_id ?? '').trim()
  if (!gymId) {
    return NextResponse.json({ error: 'gym_id is required' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error('[outreach/mark-sent] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const result = await markOutreachSent(admin, {
      gym_id: gymId,
      sent_at: body.sent_at,
      channel: body.channel,
    })
    return NextResponse.json({
      gym_id: gymId,
      ...result,
      platform_stage_hint: result.updated ? 'link_sent' : undefined,
    })
  } catch (e) {
    console.error('[outreach/mark-sent] failed', e)
    return NextResponse.json({ error: 'Failed to mark outreach sent' }, { status: 500 })
  }
}
