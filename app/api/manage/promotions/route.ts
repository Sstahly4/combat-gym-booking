export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

const kindSchema = z.enum(['early_bird', 'last_minute', 'long_stay', 'custom'])

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  gym_id: z.string().uuid(),
  kind: kindSchema,
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(280).nullable().optional(),
  discount_percent: z.number().int().min(0).max(90),
  starts_at: z.string().regex(DATE_RX).nullable().optional(),
  ends_at: z.string().regex(DATE_RX).nullable().optional(),
  min_nights: z.number().int().min(1).max(365).nullable().optional(),
  is_active: z.boolean().optional(),
})

const listSchema = z.object({
  gym_id: z.string().uuid(),
})

const deleteSchema = z.object({
  id: z.string().uuid(),
  gym_id: z.string().uuid(),
})

async function assertOwnsGym(
  access: Awaited<ReturnType<typeof getOwnerAccessContext>>,
  gymId: string
) {
  const { data, error } = await access.supabase
    .from('gyms')
    .select('id, owner_id, currency')
    .eq('id', gymId)
    .single()
  if (error || !data) return { ok: false as const, code: 404 }
  if (data.owner_id !== access.userId) return { ok: false as const, code: 403 }
  return { ok: true as const, gym: data }
}

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const parsed = listSchema.safeParse({
      gym_id: request.nextUrl.searchParams.get('gym_id'),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'gym_id required' }, { status: 400 })
    }

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const { data, error } = await access.supabase
      .from('gym_promotions')
      .select('id, gym_id, kind, title, description, discount_percent, starts_at, ends_at, min_nights, is_active, created_at, updated_at')
      .eq('gym_id', parsed.data.gym_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load promotions' }, { status: 500 })

    return NextResponse.json({ gym: { id: owns.gym.id, currency: owns.gym.currency }, promotions: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load promotions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid promotion', details: parsed.error.flatten() }, { status: 400 })
    }

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const insert = {
      gym_id: parsed.data.gym_id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      discount_percent: parsed.data.discount_percent,
      starts_at: parsed.data.starts_at ?? null,
      ends_at: parsed.data.ends_at ?? null,
      min_nights: parsed.data.min_nights ?? null,
      is_active: parsed.data.is_active ?? true,
    }

    const { data, error } = await access.supabase
      .from('gym_promotions')
      .insert(insert)
      .select('id, gym_id, kind, title, description, discount_percent, starts_at, ends_at, min_nights, is_active, created_at, updated_at')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 })
    return NextResponse.json({ success: true, promotion: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create promotion' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = upsertSchema.extend({ id: z.string().uuid() }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid promotion', details: parsed.error.flatten() }, { status: 400 })
    }

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const patch: Record<string, any> = {
      kind: parsed.data.kind,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      discount_percent: parsed.data.discount_percent,
      starts_at: parsed.data.starts_at ?? null,
      ends_at: parsed.data.ends_at ?? null,
      min_nights: parsed.data.min_nights ?? null,
      is_active: parsed.data.is_active ?? true,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await access.supabase
      .from('gym_promotions')
      .update(patch)
      .eq('id', parsed.data.id)
      .eq('gym_id', parsed.data.gym_id)
      .select('id, gym_id, kind, title, description, discount_percent, starts_at, ends_at, min_nights, is_active, created_at, updated_at')
      .single()

    if (error || !data) return NextResponse.json({ error: 'Failed to update promotion' }, { status: 500 })
    return NextResponse.json({ success: true, promotion: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update promotion' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const parsed = deleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'id and gym_id required' }, { status: 400 })
    }

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const { error } = await access.supabase
      .from('gym_promotions')
      .delete()
      .eq('id', parsed.data.id)
      .eq('gym_id', parsed.data.gym_id)

    if (error) return NextResponse.json({ error: 'Failed to delete promotion' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete promotion' }, { status: 500 })
  }
}

