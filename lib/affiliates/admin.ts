import type { SupabaseClient } from '@supabase/supabase-js'
import type { Affiliate, AffiliatePayoutRun } from '@/lib/types/database'
import { AFFILIATE_MIN_PAYOUT_AUD } from '@/lib/affiliates/constants'
import {
  decryptAffiliatePayoutDetails,
  encryptAffiliatePayoutDetails,
} from '@/lib/affiliates/encryption'

export type AffiliatePublic = Omit<Affiliate, 'payout_details_encrypted'> & {
  payout_details: string
  referral_url: string
}

export function serializeAffiliate(row: Affiliate, referralUrl: string): AffiliatePublic {
  const { payout_details_encrypted, ...rest } = row
  return {
    ...rest,
    payout_details: decryptAffiliatePayoutDetails(payout_details_encrypted),
    referral_url: referralUrl,
  }
}

export function encryptPayoutDetailsForStorage(details: string | null | undefined): string | null {
  const trimmed = (details || '').trim()
  if (!trimmed) return null
  return encryptAffiliatePayoutDetails(trimmed)
}

export type AffiliateListRow = AffiliatePublic & {
  total_earnings: number
  pending_balance: number
  last_booking_at: string | null
  total_clicks: number
}

export async function fetchAffiliateListStats(
  admin: SupabaseClient,
  affiliates: Affiliate[],
  referralUrlFn: (code: string) => string
): Promise<AffiliateListRow[]> {
  const codes = affiliates.map((a) => a.code)
  if (codes.length === 0) return []

  const { data: bookings } = await admin
    .from('bookings')
    .select('affiliate_code, affiliate_payout_aud, affiliate_payout_status, created_at')
    .in('affiliate_code', codes)
    .not('affiliate_code', 'is', null)

  const { data: clicks } = await admin
    .from('affiliate_clicks')
    .select('affiliate_code')
    .in('affiliate_code', codes)

  const clickCounts = new Map<string, number>()
  for (const c of clicks || []) {
    clickCounts.set(c.affiliate_code, (clickCounts.get(c.affiliate_code) || 0) + 1)
  }

  type BookingAgg = { paid: number; pending: number; lastAt: string | null }
  const agg = new Map<string, BookingAgg>()

  for (const b of bookings || []) {
    const code = b.affiliate_code as string
    const cur = agg.get(code) || { paid: 0, pending: 0, lastAt: null }
    const amount = Number(b.affiliate_payout_aud || 0)
    if (b.affiliate_payout_status === 'paid') cur.paid += amount
    if (b.affiliate_payout_status === 'approved') cur.pending += amount
    if (!cur.lastAt || b.created_at > cur.lastAt) cur.lastAt = b.created_at
    agg.set(code, cur)
  }

  return affiliates.map((row) => {
    const stats = agg.get(row.code) || { paid: 0, pending: 0, lastAt: null }
    return {
      ...serializeAffiliate(row, referralUrlFn(row.code)),
      total_earnings: Number(stats.paid.toFixed(2)),
      pending_balance: Number(stats.pending.toFixed(2)),
      last_booking_at: stats.lastAt,
      total_clicks: clickCounts.get(row.code) || 0,
    }
  })
}

export type PayoutReportRow = {
  affiliate_id: string
  affiliate_name: string
  affiliate_code: string
  payout_method: Affiliate['payout_method']
  payout_details: string
  bookings_count: number
  gross_booking_value: number
  combatstay_commission: number
  affiliate_payout: number
  meets_minimum: boolean
  booking_ids: string[]
}

export async function buildPayoutReport(
  admin: SupabaseClient,
  periodStart: string,
  periodEnd: string
): Promise<PayoutReportRow[]> {
  const startIso = `${periodStart}T00:00:00.000Z`
  const endIso = `${periodEnd}T23:59:59.999Z`

  const { data: allApproved, error: allErr } = await admin
    .from('bookings')
    .select('id, affiliate_code, total_price, platform_fee, affiliate_payout_aud, affiliate_approved_at')
    .eq('affiliate_payout_status', 'approved')
    .not('affiliate_code', 'is', null)

  if (allErr) throw new Error(allErr.message)

  const { data: inPeriod, error: periodErr } = await admin
    .from('bookings')
    .select('id, affiliate_code')
    .eq('affiliate_payout_status', 'approved')
    .not('affiliate_code', 'is', null)
    .gte('affiliate_approved_at', startIso)
    .lte('affiliate_approved_at', endIso)

  if (periodErr) throw new Error(periodErr.message)

  const codesInPeriod = new Set((inPeriod || []).map((b) => b.affiliate_code as string))
  if (codesInPeriod.size === 0) return []

  const byCode = new Map<
    string,
    {
      all_booking_ids: string[]
      period_booking_ids: string[]
      gross: number
      commission: number
      payout: number
    }
  >()

  for (const b of allApproved || []) {
    const code = b.affiliate_code as string
    if (!codesInPeriod.has(code)) continue

    const cur = byCode.get(code) || {
      all_booking_ids: [],
      period_booking_ids: [],
      gross: 0,
      commission: 0,
      payout: 0,
    }
    cur.all_booking_ids.push(b.id)
    cur.payout += Number(b.affiliate_payout_aud || 0)

    const approvedAt = b.affiliate_approved_at as string | null
    if (approvedAt && approvedAt >= startIso && approvedAt <= endIso) {
      cur.period_booking_ids.push(b.id)
      cur.gross += Number(b.total_price || 0)
      cur.commission += Number(b.platform_fee || 0)
    }
    byCode.set(code, cur)
  }

  const codes = Array.from(byCode.keys())
  if (codes.length === 0) return []

  const { data: affiliates } = await admin
    .from('affiliates')
    .select('*')
    .in('code', codes)

  const affiliateByCode = new Map((affiliates || []).map((a) => [a.code, a as Affiliate]))

  const rows: PayoutReportRow[] = []
  for (const [code, stats] of byCode) {
    const affiliate = affiliateByCode.get(code)
    if (!affiliate) continue
    const payout = Number(stats.payout.toFixed(2))
    rows.push({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.name,
      affiliate_code: code,
      payout_method: affiliate.payout_method,
      payout_details: decryptAffiliatePayoutDetails(affiliate.payout_details_encrypted),
      bookings_count: stats.period_booking_ids.length,
      gross_booking_value: Number(stats.gross.toFixed(2)),
      combatstay_commission: Number(stats.commission.toFixed(2)),
      affiliate_payout: payout,
      meets_minimum: payout >= AFFILIATE_MIN_PAYOUT_AUD,
      booking_ids: stats.all_booking_ids,
    })
  }

  return rows.sort((a, b) => b.affiliate_payout - a.affiliate_payout)
}

export async function markAffiliatePayoutPaid(params: {
  admin: SupabaseClient
  affiliateId: string
  periodStart: string
  periodEnd: string
  paymentReference: string
  notes?: string | null
}): Promise<AffiliatePayoutRun> {
  const { admin, affiliateId, periodStart, periodEnd, paymentReference, notes } = params
  const now = new Date().toISOString()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('code')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) throw new Error('Affiliate not found')

  const { data: bookings, error: bErr } = await admin
    .from('bookings')
    .select('id, total_price, platform_fee, affiliate_payout_aud, affiliate_approved_at')
    .eq('affiliate_code', affiliate.code)
    .eq('affiliate_payout_status', 'approved')

  if (bErr) throw new Error(bErr.message)
  if (!bookings?.length) throw new Error('No approved bookings awaiting payout for this affiliate')

  const startIso = `${periodStart}T00:00:00.000Z`
  const endIso = `${periodEnd}T23:59:59.999Z`
  const hasPeriodActivity = bookings.some((b) => {
    const at = b.affiliate_approved_at as string | null
    return at && at >= startIso && at <= endIso
  })
  if (!hasPeriodActivity) {
    throw new Error('This affiliate has no approved bookings in the selected period')
  }

  const gross = bookings.reduce((s, b) => s + Number(b.total_price || 0), 0)
  const commission = bookings.reduce((s, b) => s + Number(b.platform_fee || 0), 0)
  const payout = bookings.reduce((s, b) => s + Number(b.affiliate_payout_aud || 0), 0)
  const payoutRounded = Number(payout.toFixed(2))

  if (payoutRounded < AFFILIATE_MIN_PAYOUT_AUD) {
    throw new Error(`Payout $${payoutRounded} AUD is below the $${AFFILIATE_MIN_PAYOUT_AUD} minimum`)
  }

  const periodGross = bookings
    .filter((b) => {
      const at = b.affiliate_approved_at as string | null
      return at && at >= startIso && at <= endIso
    })
    .reduce((s, b) => s + Number(b.total_price || 0), 0)
  const periodCommission = bookings
    .filter((b) => {
      const at = b.affiliate_approved_at as string | null
      return at && at >= startIso && at <= endIso
    })
    .reduce((s, b) => s + Number(b.platform_fee || 0), 0)
  const periodBookings = bookings.filter((b) => {
    const at = b.affiliate_approved_at as string | null
    return at && at >= startIso && at <= endIso
  }).length

  const { data: run, error: runErr } = await admin
    .from('affiliate_payouts')
    .insert({
      affiliate_id: affiliateId,
      period_start: periodStart,
      period_end: periodEnd,
      total_bookings: periodBookings,
      gross_booking_value: Number(periodGross.toFixed(2)),
      combatstay_commission: Number(periodCommission.toFixed(2)),
      affiliate_payout: payoutRounded,
      status: 'paid',
      paid_at: now,
      payment_reference: paymentReference.trim(),
      notes: notes?.trim() || null,
    })
    .select()
    .single()

  if (runErr || !run) throw new Error(runErr?.message || 'Failed to create payout record')

  const bookingIds = bookings.map((b) => b.id)
  const { error: updateErr } = await admin
    .from('bookings')
    .update({
      affiliate_payout_status: 'paid',
      affiliate_paid_at: now,
    })
    .in('id', bookingIds)
    .eq('affiliate_payout_status', 'approved')

  if (updateErr) throw new Error(updateErr.message)

  return run as AffiliatePayoutRun
}

export function payoutReportToCsv(
  rows: PayoutReportRow[],
  periodStart: string,
  periodEnd: string
): string {
  const header = [
    'Affiliate',
    'Code',
    'Bookings',
    'Gross booking value (AUD)',
    'CombatStay commission (AUD)',
    'Affiliate payout (AUD)',
    'Meets minimum',
    'Payout method',
    'Payout details',
  ]
  const lines = [header.join(',')]
  for (const r of rows.filter((x) => x.meets_minimum)) {
    lines.push(
      [
        csvEscape(r.affiliate_name),
        csvEscape(r.affiliate_code),
        r.bookings_count,
        r.gross_booking_value.toFixed(2),
        r.combatstay_commission.toFixed(2),
        r.affiliate_payout.toFixed(2),
        'yes',
        csvEscape(r.payout_method),
        csvEscape(r.payout_details),
      ].join(',')
    )
  }
  lines.push('')
  lines.push(`Period,${periodStart},${periodEnd}`)
  return lines.join('\n')
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}
