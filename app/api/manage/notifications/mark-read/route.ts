/**
 * POST /api/manage/notifications/mark-read
 *
 * Marks one or all of the current owner's notifications as read.
 *
 * Body:
 *   { id?: string }   → mark a single notification (must belong to the user)
 *   { all?: true }    → mark every unread notification for this user
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : null
  const all = body?.all === true

  if (!id && !all) {
    return NextResponse.json({ error: 'Provide an id or all: true' }, { status: 400 })
  }

  const nowIso = new Date().toISOString()
  const base = supabase
    .from('owner_notifications')
    .update({ read_at: nowIso }, { count: 'exact' })
    .eq('user_id', user.id)
    .is('read_at', null)
  const query = id ? base.eq('id', id) : base

  const { error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, updated: count ?? 0 })
}
