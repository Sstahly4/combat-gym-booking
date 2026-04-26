/**
 * Admin: Enrich gym(s) with real nearby POI data from OpenStreetMap Overpass API.
 *
 * POST /api/admin/gyms/enrich-things-to-do
 *   body: { gym_id?: string, overwrite?: boolean }
 *
 * - If gym_id is provided, enriches just that one gym.
 * - If gym_id is omitted, enriches ALL verified gyms with lat/lon that don't
 *   yet have things_to_do populated (unless overwrite=true).
 *
 * Overpass API is free (OpenStreetMap data) — no API key needed.
 * Each call sleeps 1.2s between gyms to respect Overpass rate limits.
 *
 * Run this from the Admin Hub or curl after adding a new gym:
 *   curl -X POST /api/admin/gyms/enrich-things-to-do \
 *     -H "Content-Type: application/json" \
 *     -b "your-session-cookie" \
 *     -d '{"gym_id": "abc123"}'
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchThingsToDo } from '@/lib/utils/overpass-things-to-do'
import { revalidateGymCache } from '@/lib/seo/revalidate-gym'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let body: { gym_id?: string; overwrite?: boolean } = {}
  try {
    body = await request.json()
  } catch {
    // body is optional — empty body means bulk-run all
  }

  const supabase = createAdminClient()

  // ── Single gym mode ────────────────────────────────────────────────────────
  if (body.gym_id) {
    const { data: gym, error } = await supabase
      .from('gyms')
      .select('id, name, city, latitude, longitude, things_to_do')
      .eq('id', body.gym_id)
      .single()

    if (error || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }
    if (!gym.latitude || !gym.longitude) {
      return NextResponse.json(
        { error: 'Gym has no lat/lon — add coordinates first' },
        { status: 422 }
      )
    }
    if (gym.things_to_do && !body.overwrite) {
      return NextResponse.json({
        message: 'Already enriched. Pass overwrite:true to re-fetch.',
        things_to_do: gym.things_to_do,
      })
    }

    const items = await fetchThingsToDo(gym.latitude, gym.longitude)

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ things_to_do: items })
      .eq('id', gym.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save things_to_do', details: updateError.message },
        { status: 500 }
      )
    }

    await revalidateGymCache(gym.id)

    return NextResponse.json({
      gym_id: gym.id,
      gym_name: gym.name,
      things_to_do: items,
      count: items.length,
    })
  }

  // ── Bulk mode — all eligible gyms ─────────────────────────────────────────
  const query = supabase
    .from('gyms')
    .select('id, name, city, latitude, longitude, things_to_do')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .in('verification_status', ['verified', 'trusted'])

  if (!body.overwrite) {
    query.is('things_to_do', null)
  }

  const { data: gyms, error: listError } = await query

  if (listError) {
    return NextResponse.json(
      { error: 'Failed to list gyms', details: listError.message },
      { status: 500 }
    )
  }

  const gymsToProcess = gyms ?? []
  if (gymsToProcess.length === 0) {
    return NextResponse.json({
      message: 'No gyms to enrich. All verified gyms with coordinates already have things_to_do, or none have coordinates.',
      processed: 0,
    })
  }

  const results: Array<{ gym_id: string; name: string; count: number; error?: string }> = []

  for (const gym of gymsToProcess) {
    if (!gym.latitude || !gym.longitude) continue

    try {
      const items = await fetchThingsToDo(gym.latitude, gym.longitude)

      const { error: updateError } = await supabase
        .from('gyms')
        .update({ things_to_do: items })
        .eq('id', gym.id)

      if (updateError) {
        results.push({ gym_id: gym.id, name: gym.name, count: 0, error: updateError.message })
      } else {
        await revalidateGymCache(gym.id)
        results.push({ gym_id: gym.id, name: gym.name, count: items.length })
      }
    } catch (err: any) {
      results.push({ gym_id: gym.id, name: gym.name, count: 0, error: err?.message ?? 'Unknown error' })
    }

    // Overpass rate limit: 1 request per second recommended
    await sleep(1200)
  }

  const succeeded = results.filter((r) => !r.error).length
  const failed = results.filter((r) => r.error).length

  return NextResponse.json({
    processed: results.length,
    succeeded,
    failed,
    results,
  })
}
