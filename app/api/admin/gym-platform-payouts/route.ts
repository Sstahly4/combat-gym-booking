import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/require-admin'
import { bookingEligibleForPlatformPayout, bookingNetShare } from '@/lib/manage/compute-platform-route-balances'

type Rail = 'wise' | 'manual' | 'other'
const RAILS = new Set<Rail>(['wise', 'manual', 'other'])

/**
 * Record a platform payout batch: creates gym_platform_payouts and marks
 * bookings as paid out. Admin-only; uses service role after requireAdmin().
 *
 * `status: "pending"` + `external_reference` = Wise transfer id → waits for
 * `POST /api/webhooks/wise` (`transfers#state-change`, `outgoing_payment_sent`).
 *
 * Ops: `docs/internal/ops-platform-payouts-runbook.md` · UI: `/admin/platform-payouts`
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[admin/gym-platform-payouts] admin client', e)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    gym_id?: string
    booking_ids?: string[]
    rail?: string
    external_reference?: string | null
    notes?: string | null
    amount?: number
    currency?: string | null
    status?: string
  }

  const gymId = typeof body.gym_id === 'string' ? body.gym_id.trim() : ''
  const bookingIds = Array.isArray(body.booking_ids)
    ? body.booking_ids.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []
  const railRaw = typeof body.rail === 'string' ? body.rail.trim().toLowerCase() : 'wise'
  const rail = (RAILS.has(railRaw as Rail) ? railRaw : 'wise') as Rail
  const externalReference =
    body.external_reference === undefined || body.external_reference === null
      ? null
      : String(body.external_reference).trim() || null
  const notes = body.notes === undefined || body.notes === null ? null : String(body.notes).trim() || null
  const status = body.status === 'pending' ? 'pending' : 'completed'

  if (!gymId || bookingIds.length === 0) {
    return NextResponse.json({ error: 'gym_id and non-empty booking_ids are required.' }, { status: 400 })
  }

  /** Pending row: wait for Wise `transfers#state-change` → `/api/webhooks/wise` to mark bookings paid out. */
  if (status === 'pending' && !externalReference?.trim()) {
    return NextResponse.json(
      {
        error:
          'For status "pending", external_reference must be the Wise transfer id (so the webhook can complete the batch).',
      },
      { status: 400 }
    )
  }

  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('id, currency, payout_rail')
    .eq('id', gymId)
    .maybeSingle()

  if (gymError || !gym) {
    return NextResponse.json({ error: 'Gym not found.' }, { status: 404 })
  }

  if (gym.payout_rail === 'stripe_connect') {
    return NextResponse.json(
      { error: 'This gym uses Stripe Connect; platform payout batches do not apply.' },
      { status: 409 }
    )
  }

  const currency = (body.currency || gym.currency || 'USD').toString().trim().toUpperCase() || 'USD'
  const today = new Date()

  const { data: rows, error: bookError } = await supabase
    .from('bookings')
    .select('id, gym_id, status, total_price, platform_fee, end_date, platform_paid_out_at')
    .eq('gym_id', gymId)
    .in('id', bookingIds)

  if (bookError) {
    console.error('[admin/gym-platform-payouts] bookings', bookError)
    return NextResponse.json({ error: 'Failed to load bookings.' }, { status: 500 })
  }

  const found = rows || []
  if (found.length !== bookingIds.length) {
    return NextResponse.json({ error: 'One or more booking ids were not found for this gym.' }, { status: 400 })
  }

  for (const b of found) {
    if (
      !bookingEligibleForPlatformPayout(
        {
          status: b.status,
          end_date: b.end_date,
          platform_paid_out_at: b.platform_paid_out_at,
        },
        today
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Each booking must be paid/confirmed/completed, stay ended where applicable, and not already marked paid out.',
          booking_id: b.id,
        },
        { status: 400 }
      )
    }
  }

  const sumNet = found.reduce((acc, b) => acc + bookingNetShare(b), 0)

  const amount =
    typeof body.amount === 'number' && Number.isFinite(body.amount) && body.amount >= 0 ? body.amount : sumNet

  if (Math.abs(amount - sumNet) > 0.02) {
    return NextResponse.json(
      { error: `amount (${amount}) must match sum of booking net shares (${sumNet}) unless you align them.` },
      { status: 400 }
    )
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null

  const { data: payout, error: insError } = await supabase
    .from('gym_platform_payouts')
    .insert({
      gym_id: gymId,
      rail,
      status,
      amount,
      currency,
      external_reference: externalReference,
      notes,
      completed_at: completedAt,
      metadata: { booking_ids: bookingIds },
    })
    .select('id')
    .single()

  if (insError || !payout?.id) {
    console.error('[admin/gym-platform-payouts] insert payout', insError)
    return NextResponse.json({ error: 'Failed to create payout record.' }, { status: 500 })
  }

  const payoutId = payout.id as string

  if (status === 'pending') {
    return NextResponse.json({
      ok: true,
      payout_id: payoutId,
      status: 'pending',
      booking_count: bookingIds.length,
      amount,
      currency,
      rail,
      message:
        'Payout row created. Host balances update when Wise sends transfers#state-change to /api/webhooks/wise (outgoing_payment_sent).',
    })
  }

  const paidAt = completedAt || new Date().toISOString()

  const { data: updatedRows, error: updError } = await supabase
    .from('bookings')
    .update({
      platform_payout_id: payoutId,
      platform_paid_out_at: paidAt,
      updated_at: paidAt,
    })
    .eq('gym_id', gymId)
    .in('id', bookingIds)
    .is('platform_paid_out_at', null)
    .select('id')

  if (updError) {
    console.error('[admin/gym-platform-payouts] update bookings', updError)
    return NextResponse.json({ error: 'Payout created but booking update failed.', payout_id: payoutId }, { status: 500 })
  }

  if (!updatedRows || updatedRows.length !== bookingIds.length) {
    return NextResponse.json(
      {
        error: 'Concurrent update: not all bookings were still unpaid. Payout row exists; reconcile manually.',
        payout_id: payoutId,
      },
      { status: 409 }
    )
  }

  return NextResponse.json({
    ok: true,
    payout_id: payoutId,
    booking_count: bookingIds.length,
    amount,
    currency,
    rail,
  })
}
