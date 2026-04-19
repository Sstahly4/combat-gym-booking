/**
 * GET /api/manage/notifications
 *
 * Returns the most recent owner notifications + unread count for the current
 * gym owner. Used by the navbar bell on /manage/*.
 *
 *   - limit (optional, default 20, max 50): how many recent rows to return
 *   - unread_only (optional, default false): only rows with read_at IS NULL
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') ?? 20) || 20))
  const unreadOnly = url.searchParams.get('unread_only') === '1'

  let query = supabase
    .from('owner_notifications')
    .select('id, gym_id, type, title, body, link_href, metadata, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (unreadOnly) query = query.is('read_at', null)

  const { data: rows, error: rowsErr } = await query
  if (rowsErr) {
    return NextResponse.json({ error: rowsErr.message }, { status: 500 })
  }

  const { count: unread, error: countErr } = await supabase
    .from('owner_notifications')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', user.id)
    .is('read_at', null)
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }

  return NextResponse.json({
    notifications: rows ?? [],
    unread_count: unread ?? 0,
  })
}
