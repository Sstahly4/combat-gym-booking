import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runBookingPaymentCapture } from '@/lib/bookings/run-capture'

export const dynamic = 'force-dynamic'

function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }
  return 'http://localhost:3000'
}

/**
 * Post–cancellation-window capture for manual PaymentIntents.
 * Schedule via Vercel Cron (see vercel.json) or any job runner with Authorization: Bearer CRON_SECRET.
 *
 * Milestone 3: reuse the same eligibility timestamp for Connect transfer delays.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 501 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 })
  }

  const { data: rows, error: qErr } = await admin
    .from('bookings')
    .select('id')
    .eq('status', 'confirmed')
    .not('stripe_payment_intent_id', 'is', null)
    .is('payment_captured_at', null)

  if (qErr) {
    console.error(qErr)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const origin = appOrigin()
  const processed: {
    id: string
    status: 'captured' | 'skipped' | 'error'
    detail?: string
  }[] = []

  for (const row of rows || []) {
    const result = await runBookingPaymentCapture({
      supabase: admin,
      bookingId: row.id,
      requestOrigin: origin,
      force: false,
      isAdmin: true,
    })

    if (result.ok) {
      processed.push({ id: row.id, status: result.alreadyCaptured ? 'skipped' : 'captured' })
      continue
    }
    if (result.code === 'CAPTURE_TOO_EARLY') {
      processed.push({ id: row.id, status: 'skipped' })
      continue
    }
    processed.push({ id: row.id, status: 'error', detail: result.error })
  }

  return NextResponse.json({
    ok: true,
    count: processed.length,
    results: processed,
  })
}
