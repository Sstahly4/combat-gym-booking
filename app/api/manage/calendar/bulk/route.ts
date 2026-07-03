export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

const bulkSchema = z.object({
  gym_id: z.string().uuid(),
  dates: z.array(z.string().regex(DATE_RX)).min(1).max(62),
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

export async function PUT(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bulkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid fields', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { gym_id, dates, clear, ...fields } = parsed.data

    const { data: gym, error: gymErr } = await access.supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', gym_id)
      .single()
    if (gymErr || !gym) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if ((gym as { owner_id: string }).owner_id !== access.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (clear) {
      const { error } = await access.supabase
        .from('gym_daily_availability')
        .delete()
        .eq('gym_id', gym_id)
        .in('date', dates)
      if (error) {
        return NextResponse.json({ error: 'Failed to clear overrides' }, { status: 500 })
      }
      return NextResponse.json({ success: true, cleared: dates.length })
    }

    const hasField =
      fields.price_override !== undefined ||
      fields.capacity_override !== undefined ||
      fields.is_closed !== undefined ||
      fields.min_stay_override !== undefined ||
      fields.max_stay_override !== undefined ||
      fields.closed_to_arrival !== undefined ||
      fields.closed_to_departure !== undefined ||
      fields.note !== undefined

    if (!hasField) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const rows = dates.map((date) => {
      const row: Record<string, unknown> = { gym_id, date }
      if (fields.price_override !== undefined) row.price_override = fields.price_override
      if (fields.capacity_override !== undefined) row.capacity_override = fields.capacity_override
      if (fields.is_closed !== undefined) row.is_closed = fields.is_closed
      if (fields.min_stay_override !== undefined) row.min_stay_override = fields.min_stay_override
      if (fields.max_stay_override !== undefined) row.max_stay_override = fields.max_stay_override
      if (fields.closed_to_arrival !== undefined) row.closed_to_arrival = fields.closed_to_arrival
      if (fields.closed_to_departure !== undefined) row.closed_to_departure = fields.closed_to_departure
      if (fields.note !== undefined) row.note = fields.note
      return row
    })

    const { error } = await access.supabase
      .from('gym_daily_availability')
      .upsert(rows, { onConflict: 'gym_id,date' })

    if (error) {
      return NextResponse.json({ error: 'Failed to save overrides' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: dates.length })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to bulk update'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
