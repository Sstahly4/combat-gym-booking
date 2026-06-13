export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPayoutReport, markAffiliatePayoutPaid, payoutReportToCsv } from '@/lib/affiliates/admin'

function parsePeriod(request: NextRequest): { periodStart: string; periodEnd: string } | null {
  const periodStart = request.nextUrl.searchParams.get('period_start')
  const periodEnd = request.nextUrl.searchParams.get('period_end')
  if (!periodStart || !periodEnd) return null
  return { periodStart, periodEnd }
}

function defaultPreviousMonth(): { periodStart: string; periodEnd: string } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { periodStart: fmt(start), periodEnd: fmt(end) }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const period = parsePeriod(request) || defaultPreviousMonth()
  const format = request.nextUrl.searchParams.get('format')

  const admin = createAdminClient()
  const rows = await buildPayoutReport(admin, period.periodStart, period.periodEnd)

  if (format === 'csv') {
    const csv = payoutReportToCsv(rows, period.periodStart, period.periodEnd)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="affiliate-payouts-${period.periodStart}-${period.periodEnd}.csv"`,
      },
    })
  }

  return NextResponse.json({
    period_start: period.periodStart,
    period_end: period.periodEnd,
    rows,
    payable: rows.filter((r) => r.meets_minimum),
    below_minimum: rows.filter((r) => !r.meets_minimum),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const affiliateId = body.affiliate_id?.toString()
  const periodStart = body.period_start?.toString()
  const periodEnd = body.period_end?.toString()
  const paymentReference = body.payment_reference?.toString().trim()
  const notes = body.notes?.toString() || null

  if (!affiliateId || !periodStart || !periodEnd || !paymentReference) {
    return NextResponse.json(
      { error: 'affiliate_id, period_start, period_end, and payment_reference are required' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  try {
    const run = await markAffiliatePayoutPaid({
      admin,
      affiliateId,
      periodStart,
      periodEnd,
      paymentReference,
      notes,
    })
    return NextResponse.json({ payout: run })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Payout failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
