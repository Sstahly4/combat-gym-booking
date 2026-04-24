import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Strip ILIKE wildcards so user input cannot broaden the pattern. */
function sanitizeIlikeToken(raw: string): string {
  return raw.replace(/%/g, '').replace(/_/g, '').trim().slice(0, 80)
}

type RpcGymSuggestRow = {
  id: string
  name: string
  city: string
  country: string
  match_kind: string
  match_score: number
}

type GymSuggestPublic = { id: string; name: string; city: string; country: string }

async function suggestFallbackIlike(supabase: ReturnType<typeof createPublicClient>, q: string) {
  const pattern = `%${q}%`
  const { data, error } = await supabase
    .from('gyms')
    .select('id, name, city, country')
    .eq('verification_status', 'verified')
    .eq('status', 'approved')
    .ilike('name', pattern)
    .order('name', { ascending: true })
    .limit(12)

  if (error) {
    console.error('[api/gyms/suggest] fallback', error.message)
    return { gyms: [] as GymSuggestPublic[], did_you_mean: false }
  }
  return {
    gyms: (data ?? []) as GymSuggestPublic[],
    did_you_mean: false,
  }
}

/**
 * GET /api/gyms/suggest?q=…
 * Typeahead for “Where”: pg_trgm + optional search_aliases via public.gym_suggest(),
 * with ILIKE fallback if the RPC is not deployed yet.
 */
export async function GET(req: NextRequest) {
  const q = sanitizeIlikeToken(req.nextUrl.searchParams.get('q') || '')
  if (q.length < 2) {
    return NextResponse.json(
      { gyms: [], did_you_mean: false },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } },
    )
  }

  const supabase = createPublicClient()

  const { data: rpcData, error: rpcError } = await supabase.rpc('gym_suggest', {
    p_query: q,
    p_limit: 12,
  })

  if (!rpcError && Array.isArray(rpcData)) {
    const rows = rpcData as RpcGymSuggestRow[]
    const gyms: GymSuggestPublic[] = rows.map(({ id, name, city, country }) => ({
      id,
      name,
      city,
      country,
    }))
    const did_you_mean =
      rows.length > 0 &&
      rows.every((r) => r.match_kind === 'fuzzy_name' || r.match_kind === 'fuzzy_alias')
    return NextResponse.json(
      { gyms, did_you_mean },
      { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } },
    )
  }

  if (rpcError) {
    console.warn('[api/gyms/suggest] rpc unavailable, using ilike fallback:', rpcError.message)
  }

  const fallback = await suggestFallbackIlike(supabase, q)
  return NextResponse.json(fallback, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
  })
}
