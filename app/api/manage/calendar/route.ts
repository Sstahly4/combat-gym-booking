export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { loadGymAvailabilityRange } from '@/lib/booking/gym-availability'

/**
 * Owner calendar API.
 *
 *   GET  /api/manage/calendar?gym_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD&package_variant_id=...
 *   PUT  /api/manage/calendar  — single-day upsert
 */

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

const upsertSchema = z
  .object({
    gym_id: z.string().uuid(),
    date: z.string().regex(DATE_RX),
    price_override: z.number().nonnegative().nullable().optional(),
    capacity_override: z.number().int().nonnegative().nullable().optional(),
    is_closed: z.boolean().optional(),
    min_stay_override: z.number().int().min(1).nullable().optional(),
    max_stay_override: z.number().int().min(1).nullable().optional(),
    closed_to_arrival: z.boolean().optional(),
    closed_to_departure: z.boolean().optional(),
    note: z.string().max(200).nullable().optional(),
    clear: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.clear === true ||
      v.price_override !== undefined ||
      v.capacity_override !== undefined ||
      v.is_closed !== undefined ||
      v.min_stay_override !== undefined ||
      v.max_stay_override !== undefined ||
      v.closed_to_arrival !== undefined ||
      v.closed_to_departure !== undefined ||
      v.note !== undefined,
    { message: 'At least one field to update (or clear: true) is required' }
  )

async function assertOwnsGym(
  access: Awaited<ReturnType<typeof getOwnerAccessContext>>,
  gymId: string
) {
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
    if (access.status === 'no_user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const params = request.nextUrl.searchParams
    const gymId = params.get('gym_id')
    const from = params.get('from')
    const to = params.get('to')
    const packageVariantId = params.get('package_variant_id')

    if (!gymId || !from || !to)
      return NextResponse.json(
        { error: 'gym_id, from, to (YYYY-MM-DD) are required' },
        { status: 400 }
      )

    const owns = await assertOwnsGym(access, gymId)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    const result = await loadGymAvailabilityRange(access.supabase, {
      gymId,
      from,
      to,
      packageVariantId: packageVariantId || null,
      includeVariants: true,
      includeImportFeeds: true,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      gym: result.gym,
      range: { from, to },
      days: result.days,
      variants: result.variants,
      import_feeds: result.import_feeds,
      package_variant_id: packageVariantId || null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load calendar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (access.status !== 'ok')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Invalid fields', details: parsed.error.flatten() },
        { status: 400 }
      )

    const owns = await assertOwnsGym(access, parsed.data.gym_id)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })

    if (parsed.data.clear) {
      const { error } = await access.supabase
        .from('gym_daily_availability')
        .delete()
        .eq('gym_id', parsed.data.gym_id)
        .eq('date', parsed.data.date)
      if (error)
        return NextResponse.json({ error: 'Failed to clear override' }, { status: 500 })
      return NextResponse.json({ success: true, cleared: true })
    }

    const patch: Record<string, unknown> = {
      gym_id: parsed.data.gym_id,
      date: parsed.data.date,
    }
    if (parsed.data.price_override !== undefined)
      patch.price_override = parsed.data.price_override
    if (parsed.data.capacity_override !== undefined)
      patch.capacity_override = parsed.data.capacity_override
    if (parsed.data.is_closed !== undefined) patch.is_closed = parsed.data.is_closed
    if (parsed.data.min_stay_override !== undefined)
      patch.min_stay_override = parsed.data.min_stay_override
    if (parsed.data.max_stay_override !== undefined)
      patch.max_stay_override = parsed.data.max_stay_override
    if (parsed.data.closed_to_arrival !== undefined)
      patch.closed_to_arrival = parsed.data.closed_to_arrival
    if (parsed.data.closed_to_departure !== undefined)
      patch.closed_to_departure = parsed.data.closed_to_departure
    if (parsed.data.note !== undefined) patch.note = parsed.data.note

    const { data, error } = await access.supabase
      .from('gym_daily_availability')
      .upsert(patch, { onConflict: 'gym_id,date' })
      .select(
        'date, capacity_override, price_override, is_closed, closed_to_arrival, closed_to_departure, min_stay_override, max_stay_override, note'
      )
      .single()

    if (error)
      return NextResponse.json({ error: 'Failed to save override' }, { status: 500 })

    return NextResponse.json({ success: true, day: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save override'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
