export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import {
  affiliateCodeValidationError,
  generateAffiliateCodeFromName,
  normalizeAffiliateCode,
} from '@/lib/affiliates/code'
import { AFFILIATE_TIER_COMMISSION } from '@/lib/affiliates/constants'
import {
  encryptPayoutDetailsForStorage,
  fetchAffiliateListStats,
  serializeAffiliate,
} from '@/lib/affiliates/admin'
import { createAffiliateIntakeToken } from '@/lib/affiliates/intake'
import {
  buildAffiliateIntakeUrl,
  isAffiliateIntakePepperConfigured,
} from '@/lib/affiliates/intake-token'
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

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const name = (body.name || '').toString().trim()
  const email = (body.email || '').toString().trim().toLowerCase()
  let code = normalizeAffiliateCode((body.code || '').toString())
  const tier = (body.tier || 'standard') as AffiliateTier
  const payoutDetails = (body.payout_details || '').toString()
  const notes = (body.notes || '').toString().trim() || null
  const status = ['active', 'paused', 'inactive'].includes(body.status) ? body.status : 'active'
  const generateIntakeLink = body.generate_intake_link !== false

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  if (!code) code = generateAffiliateCodeFromName(name)
  const codeError = affiliateCodeValidationError(code)
  if (codeError) return NextResponse.json({ error: codeError }, { status: 400 })

  const commissionRate =
    tier === 'founding' ? AFFILIATE_TIER_COMMISSION.founding : AFFILIATE_TIER_COMMISSION.standard

  const admin = createAdminClient()

  const { data: existing } = await admin.from('affiliates').select('id').eq('code', code).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'This referral code is already taken' }, { status: 409 })
  }

  let encrypted: string | null = null
  try {
    encrypted = encryptPayoutDetailsForStorage(payoutDetails)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Encryption failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const { data: row, error } = await admin
    .from('affiliates')
    .insert({
      name,
      email,
      code,
      tier,
      commission_rate: commissionRate,
      payout_method: 'bank',
      payout_region: 'au',
      payout_details_encrypted: encrypted,
      notes,
      status,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let intakeLink: { url: string; expires_at: string } | null = null
  if (generateIntakeLink && isAffiliateIntakePepperConfigured()) {
    try {
      const { plain, expiresAt } = await createAffiliateIntakeToken({
        admin,
        affiliateId: row.id,
        createdBy: auth.user.id,
      })
      intakeLink = {
        url: buildAffiliateIntakeUrl(appOrigin(request), plain),
        expires_at: expiresAt,
      }
    } catch (e) {
      console.warn('[affiliates/create] intake link generation failed', e)
    }
  }

  return NextResponse.json({
    affiliate: serializeAffiliate(row, affiliateReferralUrl(code)),
    intake_link: intakeLink,
  })
}
