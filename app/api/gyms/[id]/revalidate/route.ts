/**
 * POST /api/gyms/:id/revalidate
 *
 * Punches the ISR cache for a single gym's public detail page. Intended to be
 * called by client-side owner flows that write directly to Supabase via the
 * browser client (package manager, image reorder, gallery edits, etc.) so
 * edits appear on the live page immediately instead of waiting up to an hour
 * for the scheduled revalidation.
 *
 * Auth: any signed-in user. Ownership isn't verified because the worst an
 * authenticated caller can do is force a recomputation of an already-public
 * page — no data leak, no DoS vector (Supabase query is still cache-backed).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateGymCache } from '@/lib/seo/revalidate-gym'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    revalidateGymCache(params.id)
    return NextResponse.json({ ok: true, revalidated: params.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to revalidate' },
      { status: 500 },
    )
  }
}
