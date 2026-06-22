import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { recordSearchDateEvent } from '@/lib/marketplace/record-marketplace-events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  search_session_id: z.string().uuid(),
  source: z.enum(['search_bar', 'search_page']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, 'marketplace:search-dates', {
    maxRequests: 200,
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

  await recordSearchDateEvent({
    ...parsed.data,
    user_id: user?.id ?? null,
  })

  return NextResponse.json({ ok: true })
}
