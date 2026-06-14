export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import { tierCommissionPercent } from '@/lib/affiliates/program-copy'
import { payoutRailLabel } from '@/lib/affiliates/payout-region'
import {
  affiliateTrackingCodes,
  fetchAffiliateDetailStats,
  serializeAffiliate,
} from '@/lib/affiliates/admin'

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

  const trackingCodes = affiliateTrackingCodes(row)
  const hasTracking = trackingCodes.length > 0

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
    .order('created_at', { ascending: false })
    .limit(hasTracking ? 1000 : 0)

  if (hasTracking) {
    bookingsQuery = bookingsQuery.in('affiliate_code', trackingCodes)
  }

  if (statusFilter && ['pending', 'approved', 'paid'].includes(statusFilter)) {
    bookingsQuery = bookingsQuery.eq('affiliate_payout_status', statusFilter)
  }
  if (from) bookingsQuery = bookingsQuery.gte('created_at', `${from}T00:00:00.000Z`)
  if (to) bookingsQuery = bookingsQuery.lte('created_at', `${to}T23:59:59.999Z`)

  const [stats, { data: bookings }, { data: payouts }] = await Promise.all([
    fetchAffiliateDetailStats(admin, row),
    bookingsQuery,
    admin
      .from('affiliate_payouts')
      .select('*')
      .eq('affiliate_id', params.id)
      .order('period_end', { ascending: false }),
  ])

  const displayCode = row.code || row.retired_code || ''
  const referralUrl = row.code ? affiliateReferralUrl(row.code) : displayCode ? affiliateReferralUrl(displayCode) : ''

  return NextResponse.json({
    affiliate: {
      ...serializeAffiliate(row, referralUrl),
      commission_rate_percent: tierCommissionPercent(row.tier === 'standard' ? 'standard' : 'founding'),
      payout_rail: payoutRailLabel(row.payout_region === 'international' ? 'international' : 'au'),
      retired_code: row.retired_code || null,
      deleted_at: row.deleted_at || null,
    },
    setup_pending: !row.setup_completed_at || !row.code,
    stats,
    bookings: bookings || [],
    payouts: (payouts || []).map((p) => ({
      ...p,
      payout_method: row.payout_method,
      payout_rail: payoutRailLabel(row.payout_region === 'international' ? 'international' : 'au'),
    })),
  })
}
