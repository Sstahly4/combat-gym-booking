export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchOutreachStatusByGymIds } from '@/lib/integrations/fetch-outreach-status'
import {
  parseGymIdsParam,
  requireOutreachSyncAuth,
} from '@/lib/integrations/outreach-sync-auth'

/**
 * GET /api/integrations/outreach/status?gym_ids=uuid1,uuid2,...
 *
 * Pull-only sync for Google Sheets / WhatsApp outreach bot (Dev B).
 * Authorization: Bearer OUTREACH_SYNC_SECRET
 */
export async function GET(request: NextRequest) {
  const authErr = requireOutreachSyncAuth(request)
  if (authErr) return authErr

  const gymIds = parseGymIdsParam(request.nextUrl.searchParams.get('gym_ids'))
  if (gymIds.length === 0) {
    return NextResponse.json(
      { error: 'gym_ids query param required (comma-separated UUIDs, max 100)' },
      { status: 400 },
    )
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error('[outreach/status] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const payload = await fetchOutreachStatusByGymIds(admin, gymIds)
    return NextResponse.json(payload)
  } catch (e) {
    console.error('[outreach/status] fetch failed', e)
    return NextResponse.json({ error: 'Failed to load outreach status' }, { status: 500 })
  }
}
