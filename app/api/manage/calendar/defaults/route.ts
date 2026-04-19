export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const schema = z.object({
  gym_id: z.string().uuid(),
  default_daily_capacity: z.number().int().min(0).max(10_000).nullable(),
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

    const { error } = await access.supabase
      .from('gyms')
      .update({
        default_daily_capacity: parsed.data.default_daily_capacity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.gym_id)

    if (error)
      return NextResponse.json({ error: 'Failed to save capacity' }, { status: 500 })

    return NextResponse.json({
      success: true,
      default_daily_capacity: parsed.data.default_daily_capacity,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save capacity' },
      { status: 500 }
    )
  }
}
