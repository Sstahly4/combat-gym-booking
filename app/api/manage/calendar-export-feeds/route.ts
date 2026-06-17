export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const bodySchema = z.object({
  gym_id: z.string().uuid(),
  package_variant_id: z.string().uuid().nullable().optional(),
  regenerate: z.boolean().optional(),
})

function newPlaintextToken(): string {
  // 32 bytes => 64 hex chars (URL-safe, long enough to avoid guessing).
  return crypto.randomBytes(32).toString('hex')
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const gymId = parsed.data.gym_id
    const variantId = parsed.data.package_variant_id ?? null
    const regenerate = Boolean(parsed.data.regenerate)

    // Ownership check (do not rely only on RLS).
    const { data: gym, error: gymErr } = await access.supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', gymId)
      .single()
    if (gymErr || !gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    if ((gym as any).owner_id !== access.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (variantId) {
      const { data: variant, error: vErr } = await access.supabase
        .from('package_variants')
        .select('id, package:packages(id, gym_id)')
        .eq('id', variantId)
        .single()
      if (vErr || !variant) {
        return NextResponse.json({ error: 'Package variant not found' }, { status: 404 })
      }
      const variantGymId = (variant as any)?.package?.gym_id as string | undefined
      if (!variantGymId || variantGymId !== gymId) {
        return NextResponse.json({ error: 'Variant does not belong to gym' }, { status: 400 })
      }
    }

    // Find existing feed for (gym_id, package_variant_id) to regenerate in-place.
    const { data: existing, error: existingErr } = await access.supabase
      .from('calendar_export_feeds')
      .select('id')
      .eq('gym_id', gymId)
      .eq('package_variant_id', variantId)
      .maybeSingle()

    if (existingErr) {
      return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
    }

    const plain = newPlaintextToken()
    const hashed = sha256Hex(plain)

    let feedId: string | null = null
    if (existing?.id && (regenerate || existing?.id)) {
      const { data: updated, error: upErr } = await access.supabase
        .from('calendar_export_feeds')
        .update({ token: hashed })
        .eq('id', existing.id)
        .select('id')
        .single()
      if (upErr || !updated) {
        return NextResponse.json({ error: 'Failed to regenerate feed' }, { status: 500 })
      }
      feedId = (updated as any).id as string
    } else {
      const { data: created, error: insErr } = await access.supabase
        .from('calendar_export_feeds')
        .insert({ token: hashed, gym_id: gymId, package_variant_id: variantId })
        .select('id')
        .single()
      if (insErr || !created) {
        return NextResponse.json({ error: 'Failed to create feed' }, { status: 500 })
      }
      feedId = (created as any).id as string
    }

    const origin = new URL(request.url).origin
    const publicUrl = `${origin}/api/calendar/export/${plain}.ics`
    return NextResponse.json({
      id: feedId,
      url: publicUrl,
      gym_id: gymId,
      package_variant_id: variantId,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create feed' },
      { status: 500 }
    )
  }
}

