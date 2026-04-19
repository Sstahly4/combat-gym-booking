export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limit = Math.min(
      50,
      Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 25)
    )

    const { data, error } = await access.supabase
      .from('security_events')
      .select('id, event_type, metadata, created_at')
      .eq('user_id', access.userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: 'Failed to load security activity' }, { status: 500 })
    }

    return NextResponse.json({ events: data ?? [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load security activity' },
      { status: 500 }
    )
  }
}
