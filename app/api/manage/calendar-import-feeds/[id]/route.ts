export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { syncCalendarImportFeed } from '@/lib/calendar/sync-calendar-import-feed'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedId = params.id
    const { data: feed } = await access.supabase
      .from('calendar_import_feeds')
      .select('id, gym_id')
      .eq('id', feedId)
      .single()
    if (!feed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: gym } = await access.supabase
      .from('gyms')
      .select('owner_id')
      .eq('id', feed.gym_id)
      .single()
    if (!gym || gym.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await syncCalendarImportFeed(access.supabase, feedId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ success: true, block_count: result.blockCount })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedId = params.id
    const { data: feed } = await access.supabase
      .from('calendar_import_feeds')
      .select('id, gym_id')
      .eq('id', feedId)
      .single()
    if (!feed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: gym } = await access.supabase
      .from('gyms')
      .select('owner_id')
      .eq('id', feed.gym_id)
      .single()
    if (!gym || gym.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await access.supabase.from('calendar_import_feeds').delete().eq('id', feedId)
    if (error) {
      return NextResponse.json({ error: 'Failed to delete feed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
