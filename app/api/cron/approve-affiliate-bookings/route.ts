import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveEligibleAffiliateBookings } from '@/lib/affiliates/approve-bookings'

export const dynamic = 'force-dynamic'

/**
 * Daily job: approve affiliate-attributed bookings after the 14-day window.
 * Schedule via Vercel Cron (see vercel.json) with Authorization: Bearer CRON_SECRET.
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

  try {
    const result = await approveEligibleAffiliateBookings(admin)
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    console.error('[cron/approve-affiliate-bookings]', e)
    const message = e instanceof Error ? e.message : 'Job failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
