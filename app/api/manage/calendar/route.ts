export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

/**
 * Owner calendar API.
 *
 *   GET  /api/manage/calendar?gym_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 *     Returns per-day state in [from, to]: capacity, price, booked count, is_closed, status.
 *
 *   PUT  /api/manage/calendar
 *     Body: { gym_id, date, price_override?, capacity_override?, is_closed?, min_stay_override?, clear? }
 *     Upserts a per-day override. `clear: true` removes the override row entirely.
 *
 * Booked counts are computed from `bookings` at read time to avoid drift.
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
      v.note !== undefined,
    { message: 'At least one field to update (or clear: true) is required' }
  )

/** Booking statuses that occupy a spot on a given date. */
const OCCUPYING_STATUSES = [
  'pending',
  'gym_confirmed',
  'confirmed',
  'paid',
  'completed',
  // legacy
  'pending_payment',
  'pending_confirmation',
  'awaiting_approval',
] as const

async function assertOwnsGym(
  access: Awaited<ReturnType<typeof getOwnerAccessContext>>,
  gymId: string
) {
  const { data, error } = await access.supabase
    .from('gyms')
    .select('id, owner_id, currency, price_per_day, default_daily_capacity, timezone')
    .eq('id', gymId)
    .single()
  if (error || !data) return { ok: false as const, code: 404 }
  if (data.owner_id !== access.userId) return { ok: false as const, code: 403 }
  return { ok: true as const, gym: data }
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function diffDays(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number)
  const [ty, tm, td] = toIso.split('-').map(Number)
  const a = Date.UTC(fy, fm - 1, fd)
  const b = Date.UTC(ty, tm - 1, td)
  return Math.round((b - a) / 86_400_000)
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
    if (!gymId || !from || !to)
      return NextResponse.json(
        { error: 'gym_id, from, to (YYYY-MM-DD) are required' },
        { status: 400 }
      )
    if (!DATE_RX.test(from) || !DATE_RX.test(to))
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    const totalDays = diffDays(from, to)
    if (totalDays < 0 || totalDays > 366)
      return NextResponse.json({ error: 'Range must be 0–366 days' }, { status: 400 })

    const owns = await assertOwnsGym(access, gymId)
    if (!owns.ok) return NextResponse.json({ error: 'Not found' }, { status: owns.code })
    const gym = owns.gym

    const [{ data: overrides, error: ovErr }, { data: bookingsInRange, error: bkErr }] =
      await Promise.all([
        access.supabase
          .from('gym_daily_availability')
          .select(
            'date, capacity_override, price_override, is_closed, min_stay_override, note'
          )
          .eq('gym_id', gymId)
          .gte('date', from)
          .lte('date', to),
        access.supabase
          .from('bookings')
          .select('start_date, end_date, status')
          .eq('gym_id', gymId)
          .in('status', OCCUPYING_STATUSES as unknown as string[])
          // Any booking that intersects the window: start_date <= to AND end_date > from
          .lte('start_date', to)
          .gt('end_date', from),
      ])

    if (ovErr)
      return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 })
    if (bkErr)
      return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })

    // Build booked counts per date. A booking occupies every date in [start_date, end_date).
    const bookedByDate = new Map<string, number>()
    for (const b of bookingsInRange ?? []) {
      const bStart = (b as any).start_date as string
      const bEnd = (b as any).end_date as string
      if (!bStart || !bEnd) continue
      // Clamp to requested window
      const lo = bStart < from ? from : bStart
      const hi = bEnd > addDaysISO(to, 1) ? addDaysISO(to, 1) : bEnd
      const len = diffDays(lo, hi)
      for (let i = 0; i < len; i++) {
        const d = addDaysISO(lo, i)
        bookedByDate.set(d, (bookedByDate.get(d) ?? 0) + 1)
      }
    }

    const overrideByDate = new Map<string, any>()
    for (const row of overrides ?? []) {
      overrideByDate.set((row as any).date as string, row)
    }

    const defaultCapacity: number | null = (gym as any).default_daily_capacity ?? null
    const defaultPrice: number = Number((gym as any).price_per_day ?? 0)

    const days: Array<{
      date: string
      price: number
      price_override: number | null
      capacity: number | null
      capacity_override: number | null
      is_closed: boolean
      min_stay_override: number | null
      note: string | null
      booked: number
      spots_left: number | null
      status: 'open' | 'partial' | 'sold_out' | 'closed' | 'unconfigured'
    }> = []

    for (let i = 0; i <= totalDays; i++) {
      const date = addDaysISO(from, i)
      const ov = overrideByDate.get(date)
      const capacity: number | null =
        ov?.capacity_override ?? defaultCapacity ?? null
      const price: number = Number(ov?.price_override ?? defaultPrice)
      const booked: number = bookedByDate.get(date) ?? 0
      const isClosed = Boolean(ov?.is_closed)
      const hasRestriction = ov?.min_stay_override != null
      let status: 'open' | 'partial' | 'sold_out' | 'closed' | 'unconfigured' = 'open'
      if (isClosed) status = 'closed'
      else if (capacity == null) status = 'unconfigured'
      else if (capacity === 0 || booked >= capacity) status = 'sold_out'
      else if (booked > 0 || hasRestriction) status = 'partial'
      days.push({
        date,
        price,
        price_override: ov?.price_override ?? null,
        capacity,
        capacity_override: ov?.capacity_override ?? null,
        is_closed: isClosed,
        min_stay_override: ov?.min_stay_override ?? null,
        note: ov?.note ?? null,
        booked,
        spots_left: capacity == null ? null : Math.max(0, capacity - booked),
        status,
      })
    }

    return NextResponse.json({
      gym: {
        id: gym.id,
        currency: (gym as any).currency as string,
        default_price: defaultPrice,
        default_daily_capacity: defaultCapacity,
        timezone: (gym as any).timezone ?? null,
      },
      range: { from, to },
      days,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load calendar' },
      { status: 500 }
    )
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

    const patch: Record<string, any> = {
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
    if (parsed.data.note !== undefined) patch.note = parsed.data.note

    const { data, error } = await access.supabase
      .from('gym_daily_availability')
      .upsert(patch, { onConflict: 'gym_id,date' })
      .select(
        'date, capacity_override, price_override, is_closed, min_stay_override, note'
      )
      .single()

    if (error)
      return NextResponse.json({ error: 'Failed to save override' }, { status: 500 })

    return NextResponse.json({ success: true, day: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save override' },
      { status: 500 }
    )
  }
}
