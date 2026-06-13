export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import { serializeAffiliate } from '@/lib/affiliates/admin'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: row, error } = await admin.from('affiliates').select('*').eq('id', params.id).single()

  if (error || !row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  const statusFilter = request.nextUrl.searchParams.get('status')
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  let bookingsQuery = admin
    .from('bookings')
    .select(
      `
        id,
        created_at,
        start_date,
        end_date,
        total_price,
        platform_fee,
        affiliate_payout_aud,
        affiliate_payout_status,
        affiliate_approved_at,
        affiliate_paid_at,
        status,
        booking_reference,
        gym:gyms(name),
        package:packages(name)
      `
    )
    .eq('affiliate_code', row.code)
    .order('created_at', { ascending: false })

  if (statusFilter && ['pending', 'approved', 'paid'].includes(statusFilter)) {
    bookingsQuery = bookingsQuery.eq('affiliate_payout_status', statusFilter)
  }
  if (from) bookingsQuery = bookingsQuery.gte('created_at', `${from}T00:00:00.000Z`)
  if (to) bookingsQuery = bookingsQuery.lte('created_at', `${to}T23:59:59.999Z`)

  const [
    { count: clickCount },
    { count: bookingCount },
    { data: bookings },
    { data: payouts },
    paidAgg,
    pendingAgg,
  ] = await Promise.all([
    admin
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_code', row.code),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_code', row.code),
    bookingsQuery,
    admin
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', params.id)
      .order('period_end', { ascending: false }),
    admin
      .from('bookings')
      .select('affiliate_payout_aud')
      .eq('affiliate_code', row.code)
      .eq('affiliate_payout_status', 'paid'),
    admin
      .from('bookings')
      .select('affiliate_payout_aud')
      .eq('affiliate_code', row.code)
      .eq('affiliate_payout_status', 'approved'),
  ])

  const totalPaidOut = (paidAgg.data || []).reduce(
    (s, b) => s + Number(b.affiliate_payout_aud || 0),
    0
  )
  const pendingBalance = (pendingAgg.data || []).reduce(
    (s, b) => s + Number(b.affiliate_payout_aud || 0),
    0
  )

  return NextResponse.json({
    affiliate: serializeAffiliate(row, affiliateReferralUrl(row.code)),
    stats: {
      total_clicks: clickCount ?? 0,
      total_bookings: bookingCount ?? 0,
      total_paid_out: Number(totalPaidOut.toFixed(2)),
      pending_balance: Number(pendingBalance.toFixed(2)),
    },
    bookings: bookings || [],
    payouts: payouts || [],
  })
}
