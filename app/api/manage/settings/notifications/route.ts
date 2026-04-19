export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { normalizeOwnerNotificationPrefs, ownerNotificationPrefsSchema } from '@/lib/manage/owner-notification-prefs'

export async function GET() {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profile, error } = await access.supabase
      .from('profiles')
      .select('owner_notification_prefs')
      .eq('id', access.userId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 })
    }

    const prefs = normalizeOwnerNotificationPrefs(
      (profile as { owner_notification_prefs?: unknown })?.owner_notification_prefs
    )

    return NextResponse.json({ prefs })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load notification preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = ownerNotificationPrefsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { error } = await access.supabase
      .from('profiles')
      .update({ owner_notification_prefs: parsed.data, updated_at: new Date().toISOString() })
      .eq('id', access.userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true, prefs: parsed.data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save notification preferences' },
      { status: 500 }
    )
  }
}
