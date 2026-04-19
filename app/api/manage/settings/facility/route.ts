export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const facilityUpdateSchema = z.object({
  gym_id: z.string().uuid(),
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().max(64).optional().nullable(),
  public_contact_phone: z.string().trim().max(32).optional().nullable(),
})

async function assertOwnsGym(access: Awaited<ReturnType<typeof getOwnerAccessContext>>, gymId: string) {
  const { data, error } = await access.supabase
    .from('gyms')
    .select('id, owner_id')
    .eq('id', gymId)
    .single()
  if (error || !data) return { ok: false as const, code: 404 }
  if (data.owner_id !== access.userId) return { ok: false as const, code: 403 }
  return { ok: true as const }
}

export async function GET(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const gymId = request.nextUrl.searchParams.get('gym_id')
    if (!gymId) return NextResponse.json({ error: 'gym_id required' }, { status: 400 })

    const owns = await assertOwnsGym(access, gymId)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const { data, error } = await access.supabase
      .from('gyms')
      .select('id, name, timezone, public_contact_phone, city, country')
      .eq('id', gymId)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Failed to load facility' }, { status: 500 })

    return NextResponse.json({
      facility: {
        id: data.id,
        name: data.name ?? '',
        timezone: data.timezone ?? '',
        public_contact_phone: data.public_contact_phone ?? '',
        city: data.city ?? '',
        country: data.country ?? '',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load facility' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = facilityUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid facility fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const patch: Record<string, string | null> = {}
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.timezone !== undefined)
      patch.timezone = (parsed.data.timezone ?? '').trim() || null
    if (parsed.data.public_contact_phone !== undefined)
      patch.public_contact_phone = (parsed.data.public_contact_phone ?? '').trim() || null

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ success: true })
    }

    const { error } = await access.supabase
      .from('gyms')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.gym_id)

    if (error) return NextResponse.json({ error: 'Failed to save facility' }, { status: 500 })

    return NextResponse.json({ success: true, facility: patch })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save facility' },
      { status: 500 }
    )
  }
}
