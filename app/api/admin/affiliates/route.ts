export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import {
  fetchAffiliateListStats,
  serializeAffiliate,
} from '@/lib/affiliates/admin'
import { createAffiliateIntakeToken } from '@/lib/affiliates/intake'
import {
  buildAffiliateIntakeUrl,
  isAffiliateIntakePepperConfigured,
} from '@/lib/affiliates/intake-token'
import { AFFILIATE_TIER_COMMISSION } from '@/lib/affiliates/constants'
import type { AffiliateTier } from '@/lib/types/database'

function appOrigin(request: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  return request.nextUrl.origin
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data, error } = await admin.from('affiliates').select('*').order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = await fetchAffiliateListStats(admin, data || [], affiliateReferralUrl)
  return NextResponse.json({ affiliates: rows })
}

/** Create a pending affiliate (tier only) and return a reusable invite link. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  if (!isAffiliateIntakePepperConfigured()) {
    return NextResponse.json(
      { error: 'Affiliate invite links are not configured on this server.' },
      { status: 503 }
    )
  }

  const body = await request.json()
  const tier = (body.tier === 'standard' ? 'standard' : 'founding') as AffiliateTier
  const commissionRate =
    tier === 'founding' ? AFFILIATE_TIER_COMMISSION.founding : AFFILIATE_TIER_COMMISSION.standard

  const admin = createAdminClient()

  const { data: row, error } = await admin
    .from('affiliates')
    .insert({
      tier,
      commission_rate: commissionRate,
      payout_method: 'bank',
      payout_region: 'au',
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    const { plain, expiresAt } = await createAffiliateIntakeToken({
      admin,
      affiliateId: row.id,
      createdBy: auth.user.id,
    })

    return NextResponse.json({
      affiliate: serializeAffiliate(row, ''),
      invite_link: {
        url: buildAffiliateIntakeUrl(appOrigin(request), plain),
        expires_at: expiresAt,
      },
    })
  } catch (e) {
    await admin.from('affiliates').delete().eq('id', row.id)
    const message = e instanceof Error ? e.message : 'Failed to generate invite'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
