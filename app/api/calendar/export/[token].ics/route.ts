export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import ical from 'ical-generator'
import { createClient } from '@/lib/supabase/server'

const DATE_RX = /^\d{4}-\d{2}-\d{2}$/

/** Booking statuses that occupy a spot on a given date. Keep aligned with owner calendar. */
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

function parseIsoUtcDate(iso: string): Date | null {
  if (!DATE_RX.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const rawToken = (params.token || '').trim()
    if (!rawToken || rawToken.length < 32) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const supabase = await createClient()

    const { data: feed, error: feedErr } = await supabase
      .from('calendar_export_feeds')
      .select('id, gym_id, package_variant_id')
      .eq('token', tokenHash)
      .single()

    if (feedErr || !feed) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    // Best-effort: record access time (non-sensitive).
    void supabase
      .from('calendar_export_feeds')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', feed.id)

    let q = supabase
      .from('bookings')
      .select('id, start_date, end_date, status')
      .eq('gym_id', feed.gym_id)
      .in('status', OCCUPYING_STATUSES as unknown as string[])

    // If scoped to a variant, only export those bookings.
    if (feed.package_variant_id) {
      q = q.eq('package_variant_id', feed.package_variant_id)
    }

    const { data: bookings, error: bkErr } = await q
      .order('start_date', { ascending: true })

    if (bkErr) {
      return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 })
    }

    const cal = ical({
      name: 'CombatStay: Guest Bookings',
      prodId: { company: 'CombatStay', product: 'CombatStay Partner Hub', language: 'EN' },
    })

    for (const b of bookings ?? []) {
      const startIso = (b as any).start_date as string
      const endIso = (b as any).end_date as string
      const start = parseIsoUtcDate(startIso)
      const end = parseIsoUtcDate(endIso)
      if (!start || !end) continue

      const id = String((b as any).id || '')
      if (!id) continue

      const ev = cal.createEvent({
        id,
        summary: `CombatStay: Guest Booking - ${id.slice(0, 4)}`,
        start,
        end,
        allDay: true,
      })
      // ical-generator v11 types don't expose `uid` in event data; set via method if available.
      ;(ev as any)?.uid?.(`${id}@combatstay`)
    }

    const ics = cal.toString()
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Content-Disposition': 'inline; filename="combatstay-bookings.ics"',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}

