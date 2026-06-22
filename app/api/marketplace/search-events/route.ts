import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordSearchEvent, recordSearchEventClick } from '@/lib/marketplace/record-marketplace-events'
import { buildFighterProfileSnapshot } from '@/lib/marketplace/marketplace-analytics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const postBodySchema = z.object({
  search_session_id: z.string().uuid(),
  destination_input: z.string().max(255).optional().nullable(),
  resolved_latitude: z.number().finite().optional().nullable(),
  resolved_longitude: z.number().finite().optional().nullable(),
  disciplines: z.array(z.string().max(64)).max(12).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  results_count: z.number().int().min(0).max(10_000),
  primary_results_count: z.number().int().min(0).max(10_000).optional(),
  nearby_results_count: z.number().int().min(0).max(10_000).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const patchBodySchema = z.object({
  event_id: z.string().uuid(),
  gym_id: z.string().uuid(),
  clicked_from_nearby: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'marketplace:search-events', {
    maxRequests: 120,
    window: '15 m',
  })
  if (!rateLimit.allowed) return rateLimit.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = postBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let fighterProfile = null
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'home_country, home_location, country_of_residence, combat_skill_level, combat_primary_discipline, combat_disciplines',
      )
      .eq('id', user.id)
      .maybeSingle()
    fighterProfile = buildFighterProfileSnapshot(profile)
  }

  const eventId = await recordSearchEvent({
    ...parsed.data,
    user_id: user?.id ?? null,
    fighter_profile: fighterProfile,
  })

  return NextResponse.json({ event_id: eventId })
}

export async function PATCH(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'marketplace:search-click', {
    maxRequests: 120,
    window: '15 m',
  })
  if (!rateLimit.allowed) return rateLimit.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }

  await recordSearchEventClick({
    event_id: parsed.data.event_id,
    gym_id: parsed.data.gym_id,
    clicked_from_nearby: parsed.data.clicked_from_nearby ?? false,
  })

  return NextResponse.json({ ok: true })
}
