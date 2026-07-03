export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const schema = z.object({
  gym_id: z.string().uuid(),
  default_daily_capacity: z.number().int().min(0).max(10_000).nullable().optional(),
  default_price: z.number().nonnegative().nullable().optional(),
  booking_advance_min_days: z.number().int().min(0).max(730).nullable().optional(),
  booking_advance_max_days: z.number().int().min(1).max(730).nullable().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Invalid fields', details: parsed.error.flatten() },
        { status: 400 }
      )

    // Ownership check
    const { data: gym, error: gymErr } = await access.supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', parsed.data.gym_id)
      .single()
    if (gymErr || !gym)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if ((gym as any).owner_id !== access.userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (parsed.data.default_daily_capacity !== undefined) {
      patch.default_daily_capacity = parsed.data.default_daily_capacity
    }
    if (parsed.data.default_price !== undefined) {
      patch.price_per_day = parsed.data.default_price
    }
    if (parsed.data.booking_advance_min_days !== undefined) {
      patch.booking_advance_min_days = parsed.data.booking_advance_min_days
    }
    if (parsed.data.booking_advance_max_days !== undefined) {
      patch.booking_advance_max_days = parsed.data.booking_advance_max_days
    }

    const { error } = await access.supabase
      .from('gyms')
      .update(patch)
      .eq('id', parsed.data.gym_id)

    if (error)
      return NextResponse.json({ error: 'Failed to save defaults' }, { status: 500 })

    return NextResponse.json({
      success: true,
      default_daily_capacity: parsed.data.default_daily_capacity ?? null,
      default_price: parsed.data.default_price ?? null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save capacity' },
      { status: 500 }
    )
  }
}
