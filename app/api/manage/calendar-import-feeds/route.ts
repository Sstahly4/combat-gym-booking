export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { syncCalendarImportFeed } from '@/lib/calendar/sync-calendar-import-feed'

const createSchema = z.object({
  gym_id: z.string().uuid(),
  feed_url: z.string().url().max(2000),
  label: z.string().min(1).max(80).optional(),
  package_variant_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gymId = request.nextUrl.searchParams.get('gym_id')
    if (!gymId) {
      return NextResponse.json({ error: 'gym_id is required' }, { status: 400 })
    }

    const { data: gym } = await access.supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', gymId)
      .single()
    if (!gym || gym.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: feeds, error } = await access.supabase
      .from('calendar_import_feeds')
      .select('id, label, feed_url, enabled, last_synced_at, last_error, package_variant_id')
      .eq('gym_id', gymId)
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: 'Failed to load feeds' }, { status: 500 })
    }

    const feedIds = (feeds ?? []).map((f: { id: string }) => f.id)
    const counts = new Map<string, number>()
    if (feedIds.length > 0) {
      const { data: blocks } = await access.supabase
        .from('calendar_import_blocks')
        .select('feed_id')
        .in('feed_id', feedIds)
      for (const b of blocks ?? []) {
        counts.set(b.feed_id, (counts.get(b.feed_id) ?? 0) + 1)
      }
    }

    return NextResponse.json({
      feeds: (feeds ?? []).map((f: { id: string }) => ({
        ...f,
        block_count: counts.get(f.id) ?? 0,
      })),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load import feeds'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = createSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { gym_id, feed_url, label, package_variant_id } = parsed.data

    const { data: gym } = await access.supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', gym_id)
      .single()
    if (!gym || gym.owner_id !== access.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: feed, error } = await access.supabase
      .from('calendar_import_feeds')
      .insert({
        gym_id,
        feed_url,
        label: label?.trim() || 'External calendar',
        package_variant_id: package_variant_id ?? null,
      })
      .select('id')
      .single()

    if (error || !feed) {
      return NextResponse.json({ error: 'Failed to create import feed' }, { status: 500 })
    }

    const sync = await syncCalendarImportFeed(access.supabase, feed.id)
    if (!sync.ok) {
      return NextResponse.json({ feed_id: feed.id, synced: false, error: sync.error }, { status: 201 })
    }

    return NextResponse.json({ feed_id: feed.id, synced: true, block_count: sync.blockCount })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add import feed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
