import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordDestinationSubstitution } from '@/lib/marketplace/record-marketplace-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  search_session_id: z.string().uuid(),
  kind: z.enum(['city_switch', 'nearby_gym_click', 'search_gym_click']),
  from_destination: z.string().max(255).optional().nullable(),
  to_destination: z.string().max(255).optional().nullable(),
  from_gym_id: z.string().uuid().optional().nullable(),
  to_gym_id: z.string().uuid().optional().nullable(),
  search_event_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'marketplace:substitutions', {
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

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid fields', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await recordDestinationSubstitution({
    ...parsed.data,
    user_id: user?.id ?? null,
  })

  return NextResponse.json({ ok: true })
}
