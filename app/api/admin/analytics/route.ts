import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAdminAnalytics, parseAnalyticsRange } from '@/lib/admin/fetch-admin-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const range = parseAnalyticsRange(request.nextUrl.searchParams.get('range'))

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[admin/analytics] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const payload = await fetchAdminAnalytics(supabase, range)
    return NextResponse.json(payload)
  } catch (e) {
    console.error('[admin/analytics] fetch failed', e)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
