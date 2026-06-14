import type { SupabaseClient } from '@supabase/supabase-js'
import type { Affiliate, AffiliatePayoutRun } from '@/lib/types/database'
import { AFFILIATE_MIN_PAYOUT_AUD } from '@/lib/affiliates/constants'
import {
  decryptAffiliatePayoutDetails,
  encryptAffiliatePayoutDetails,
} from '@/lib/affiliates/encryption'
import { payoutRailLabel } from '@/lib/affiliates/payout-region'
import { isAffiliateSetupPending } from '@/lib/affiliates/program-copy'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'

import { revokeActiveAffiliateIntakeTokens } from '@/lib/affiliates/intake'

export type AffiliatePublic = Omit<Affiliate, 'payout_details_encrypted'> & {
  payout_details: string
  referral_url: string
}

export function serializeAffiliate(row: Affiliate, referralUrl: string): AffiliatePublic {
  const { payout_details_encrypted, ...rest } = row
  return {
    ...rest,
    name: row.name || '',
    email: row.email || '',
    code: row.code || '',
    payout_details: decryptAffiliatePayoutDetails(payout_details_encrypted),
    referral_url: row.code ? referralUrl || affiliateReferralUrl(row.code) : '',
  }
}

/** Live or retired referral codes used to join clicks/bookings to this affiliate. */
export function affiliateTrackingCodes(row: {
  code?: string | null
  retired_code?: string | null
}): string[] {
  const codes = [row.code, row.retired_code].filter((c): c is string => Boolean(c))
  return [...new Set(codes)]
}

export type AffiliateDetailStats = {
  total_clicks: number
  total_bookings: number
  conversion_rate: number | null
  lifetime_gross_value: number
  lifetime_commission: number
  pending_commission: number
  approved_commission: number
  total_paid_out: number
  last_click_at: string | null
}

export async function fetchAffiliateDetailStats(
  admin: SupabaseClient,
  row: Pick<Affiliate, 'code' | 'retired_code'>
): Promise<AffiliateDetailStats> {
  const codes = affiliateTrackingCodes(row)
  if (codes.length === 0) {
    return {
      total_clicks: 0,
      total_bookings: 0,
      conversion_rate: null,
      lifetime_gross_value: 0,
      lifetime_commission: 0,
      pending_commission: 0,
      approved_commission: 0,
      total_paid_out: 0,
      last_click_at: null,
    }
  }

  const [
    { count: clickCount },
    { count: bookingCount },
    { data: lastClick },
    { data: bookingRows },
  ] = await Promise.all([
    admin
      .from('affiliate_clicks')
      .select('id', { count: 'exact', head: true })
      .in('affiliate_code', codes),
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('affiliate_code', codes),
    admin
      .from('affiliate_clicks')
      .select('clicked_at')
      .in('affiliate_code', codes)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('bookings')
      .select('total_price, affiliate_payout_aud, affiliate_payout_status')
      .in('affiliate_code', codes),
  ])

  const clicks = clickCount ?? 0
  const bookings = bookingCount ?? 0
  let lifetime_gross_value = 0
  let lifetime_commission = 0
  let pending_commission = 0
  let approved_commission = 0
  let total_paid_out = 0

  for (const b of bookingRows || []) {
    lifetime_gross_value += Number(b.total_price || 0)
    const payout = Number(b.affiliate_payout_aud || 0)
    lifetime_commission += payout
    if (b.affiliate_payout_status === 'pending') pending_commission += payout
    if (b.affiliate_payout_status === 'approved') approved_commission += payout
    if (b.affiliate_payout_status === 'paid') total_paid_out += payout
  }

  const conversion_rate = clicks > 0 ? Number(((bookings / clicks) * 100).toFixed(1)) : null

  return {
    total_clicks: clicks,
    total_bookings: bookings,
    conversion_rate,
    lifetime_gross_value: Number(lifetime_gross_value.toFixed(2)),
    lifetime_commission: Number(lifetime_commission.toFixed(2)),
    pending_commission: Number(pending_commission.toFixed(2)),
    approved_commission: Number(approved_commission.toFixed(2)),
    total_paid_out: Number(total_paid_out.toFixed(2)),
    last_click_at: (lastClick?.clicked_at as string | undefined) ?? null,
  }
}

/** Soft-delete: retire code, deactivate link, keep history. */
export async function retireAffiliate(
  admin: SupabaseClient,
  affiliateId: string
): Promise<{ ok: true; retired_code: string | null; unpaid_balance: number } | { ok: false; error: string }> {
  const { data: row, error: fetchErr } = await admin
    .from('affiliates')
    .select('*')
    .eq('id', affiliateId)
    .maybeSingle()

  if (fetchErr || !row) return { ok: false, error: 'Affiliate not found' }
  if (row.deleted_at) return { ok: false, error: 'Affiliate already removed' }

  const stats = await fetchAffiliateDetailStats(admin, row)
  const unpaid_balance = stats.pending_commission + stats.approved_commission

  const now = new Date().toISOString()
  const retiredCode = row.code as string | null

  await revokeActiveAffiliateIntakeTokens(admin, affiliateId)

  const { error: updateErr } = await admin
    .from('affiliates')
    .update({
      status: 'inactive',
      deleted_at: now,
      retired_code: retiredCode || row.retired_code || null,
      code: null,
      updated_at: now,
    })
    .eq('id', affiliateId)
    .is('deleted_at', null)

  if (updateErr) return { ok: false, error: updateErr.message }

  return { ok: true, retired_code: retiredCode, unpaid_balance }
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
  setup_pending: boolean
}

export async function fetchAffiliateListStats(
  admin: SupabaseClient,
  affiliates: Affiliate[],
  referralUrlFn: (code: string) => string
): Promise<AffiliateListRow[]> {
  if (affiliates.length === 0) return []

  const codes = [
    ...new Set(
      affiliates.flatMap((a) => affiliateTrackingCodes(a))
    ),
  ]

  const { data: bookings } =
    codes.length > 0
      ? await admin
          .from('bookings')
          .select('affiliate_code, affiliate_payout_aud, affiliate_payout_status, created_at')
          .in('affiliate_code', codes)
          .not('affiliate_code', 'is', null)
      : { data: [] as Array<{
          affiliate_code: string
          affiliate_payout_aud: number | null
          affiliate_payout_status: string | null
          created_at: string
        }> }

  const { data: clicks } =
    codes.length > 0
      ? await admin.from('affiliate_clicks').select('affiliate_code').in('affiliate_code', codes)
      : { data: [] as Array<{ affiliate_code: string }> }

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
    const codes = affiliateTrackingCodes(row)
    const stats = codes.length
      ? codes.reduce(
          (acc, code) => {
            const s = agg.get(code) || { paid: 0, pending: 0, lastAt: null }
            acc.paid += s.paid
            acc.pending += s.pending
            if (s.lastAt && (!acc.lastAt || s.lastAt > acc.lastAt)) acc.lastAt = s.lastAt
            return acc
          },
          { paid: 0, pending: 0, lastAt: null as string | null }
        )
      : { paid: 0, pending: 0, lastAt: null }
    const clickTotal = codes.reduce((n, code) => n + (clickCounts.get(code) || 0), 0)
    const url = row.code ? referralUrlFn(row.code) : ''
    return {
      ...serializeAffiliate(row, url),
      total_earnings: Number(stats.paid.toFixed(2)),
      pending_balance: Number(stats.pending.toFixed(2)),
      last_booking_at: stats.lastAt,
      total_clicks: clickTotal,
      setup_pending: isAffiliateSetupPending(row),
    }
  })
}

export type PayoutReportRow = {
  affiliate_id: string
  affiliate_name: string
  affiliate_code: string
  payout_country: string | null
  payout_region: Affiliate['payout_region']
  payout_method: Affiliate['payout_method']
  payout_rail: string
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
    .or(`code.in.(${codes.join(',')}),retired_code.in.(${codes.join(',')})`)

  const affiliateByCode = new Map<string, Affiliate>()
  for (const a of affiliates || []) {
    const row = a as Affiliate
    if (row.code) affiliateByCode.set(row.code, row)
    if (row.retired_code) affiliateByCode.set(row.retired_code, row)
  }

  const rows: PayoutReportRow[] = []
  for (const [code, stats] of byCode) {
    const affiliate = affiliateByCode.get(code)
    if (!affiliate) continue
    const payout = Number(stats.payout.toFixed(2))
    rows.push({
      affiliate_id: affiliate.id,
      affiliate_name: affiliate.name || 'Unknown',
      affiliate_code: code,
      payout_country: affiliate.payout_country,
      payout_region: affiliate.payout_region,
      payout_method: affiliate.payout_method,
      payout_rail: payoutRailLabel(affiliate.payout_region),
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
    .select('code, retired_code')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) throw new Error('Affiliate not found')

  const codes = affiliateTrackingCodes(affiliate)
  if (codes.length === 0) throw new Error('Affiliate has no referral code')

  const { data: bookings, error: bErr } = await admin
    .from('bookings')
    .select('id, total_price, platform_fee, affiliate_payout_aud, affiliate_approved_at')
    .in('affiliate_code', codes)
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
    'Country',
    'Payout rail',
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
        csvEscape(r.payout_country || '—'),
        csvEscape(r.payout_rail),
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
