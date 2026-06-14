export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import { AFFILIATE_TIER_COMMISSION } from '@/lib/affiliates/constants'
import {
  encryptPayoutDetailsForStorage,
  serializeAffiliate,
} from '@/lib/affiliates/admin'
import type { AffiliateTier } from '@/lib/types/database'

interface Params {
  params: { id: string }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: row, error } = await admin.from('affiliates').select('*').eq('id', params.id).single()

  if (error || !row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  return NextResponse.json({
    affiliate: serializeAffiliate(row, affiliateReferralUrl(row.code)),
  })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const body = await request.json()
  const admin = createAdminClient()

  const { data: existing, error: fetchErr } = await admin
    .from('affiliates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) updates.name = body.name.toString().trim()
  if (body.email !== undefined) updates.email = body.email.toString().trim().toLowerCase()
  if (body.notes !== undefined) updates.notes = body.notes?.toString().trim() || null
  if (['active', 'paused', 'inactive'].includes(body.status)) updates.status = body.status

  if (body.tier === 'founding' || body.tier === 'standard') {
    const tier = body.tier as AffiliateTier
    updates.tier = tier
    updates.commission_rate =
      tier === 'founding' ? AFFILIATE_TIER_COMMISSION.founding : AFFILIATE_TIER_COMMISSION.standard
  }

  if (body.payout_details !== undefined) {
    try {
      updates.payout_details_encrypted = encryptPayoutDetailsForStorage(body.payout_details?.toString())
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Encryption failed'
      return NextResponse.json({ error: message }, { status: 503 })
    }
  }

  // Referral codes are permanent — never allow changing code via API.

  const { data: row, error } = await admin
    .from('affiliates')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    affiliate: serializeAffiliate(row, affiliateReferralUrl(row.code)),
  })
}
