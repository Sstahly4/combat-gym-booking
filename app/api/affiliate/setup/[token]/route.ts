export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAffiliateIntakeToken, isAffiliateCodeAvailable } from '@/lib/affiliates/intake'
import { encryptPayoutDetailsForStorage } from '@/lib/affiliates/admin'
import { isAffiliateEncryptionConfigured } from '@/lib/affiliates/encryption'
import { formatAffiliatePayoutDetails } from '@/lib/affiliates/intake-token'
import {
  isValidAffiliatePayoutCountry,
  payoutMethodForCountry,
  regionFromCountry,
} from '@/lib/affiliates/payout-region'
import {
  affiliateCodeValidationError,
  normalizeAffiliateCode,
} from '@/lib/affiliates/code'
import { affiliateReferralUrl } from '@/lib/affiliates/urls'
import { tierDisplayName } from '@/lib/affiliates/program-copy'

interface Params {
  params: { token: string }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const plain = (params.token || '').trim()
  if (!plain) {
    return NextResponse.json({ valid: false, reason: 'missing' }, { status: 400 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ valid: false, reason: 'misconfigured' }, { status: 503 })
  }

  const result = await validateAffiliateIntakeToken(admin, plain)
  if (!result.ok) {
    return NextResponse.json({ valid: false, reason: result.reason })
  }

  return NextResponse.json({
    valid: true,
    affiliate_id: result.affiliateId,
    tier: result.tier,
    tier_label: tierDisplayName(result.tier),
    commission_rate: result.commissionRate,
    expires_at: result.expiresAt,
  })
}

export async function POST(request: NextRequest, { params }: Params) {
  const plain = (params.token || '').trim()
  if (!plain) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 })
  }

  if (!isAffiliateEncryptionConfigured()) {
    return NextResponse.json({ error: 'Payout storage is not configured' }, { status: 503 })
  }

  let admin
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const validation = await validateAffiliateIntakeToken(admin, plain)
  if (!validation.ok) {
    const status = validation.reason === 'used' || validation.reason === 'already_setup' ? 410 : 404
    return NextResponse.json({ error: 'This link is no longer valid', reason: validation.reason }, { status })
  }

  const body = await request.json()
  const name = (body.name || '').toString().trim()
  const email = (body.email || '').toString().trim().toLowerCase()
  const code = normalizeAffiliateCode((body.code || '').toString())
  const payoutCountry = (body.payout_country || '').toString().trim()

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }

  const codeError = affiliateCodeValidationError(code)
  if (codeError) return NextResponse.json({ error: codeError }, { status: 400 })

  const codeAvailable = await isAffiliateCodeAvailable(admin, code, validation.affiliateId)
  if (!codeAvailable) {
    return NextResponse.json({ error: 'This referral code is already taken — try another' }, { status: 409 })
  }

  if (!payoutCountry || !isValidAffiliatePayoutCountry(payoutCountry)) {
    return NextResponse.json({ error: 'Please select your country' }, { status: 400 })
  }

  const payoutRegion = regionFromCountry(payoutCountry)
  const payoutMethod = payoutMethodForCountry(payoutCountry)

  if (payoutMethod === 'paypal') {
    const paypalEmail = (body.paypal_email || '').toString().trim().toLowerCase()
    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return NextResponse.json({ error: 'Please enter a valid PayPal email' }, { status: 400 })
    }
  } else {
    const bsb = (body.bsb || '').toString().replace(/\s/g, '')
    const accountNumber = (body.account_number || '').toString().replace(/\s/g, '')
    if (!/^\d{6}$/.test(bsb.replace(/-/g, ''))) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit BSB' }, { status: 400 })
    }
    if (!accountNumber || accountNumber.length < 5) {
      return NextResponse.json({ error: 'Please enter a valid account number' }, { status: 400 })
    }
  }

  let encrypted: string | null
  try {
    encrypted = encryptPayoutDetailsForStorage(
      formatAffiliatePayoutDetails({
        payout_method: payoutMethod,
        name,
        country: payoutCountry,
        bsb: body.bsb,
        account_number: body.account_number,
        paypal_email: body.paypal_email,
      })
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Encryption failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  const now = new Date().toISOString()

  const { error: affiliateErr } = await admin
    .from('affiliates')
    .update({
      name,
      email,
      code,
      payout_country: payoutCountry,
      payout_region: payoutRegion,
      payout_method: payoutMethod,
      payout_details_encrypted: encrypted,
      payout_details_submitted_at: now,
      setup_completed_at: now,
      status: 'active',
    })
    .eq('id', validation.affiliateId)

  if (affiliateErr) {
    return NextResponse.json({ error: 'Failed to save details' }, { status: 500 })
  }

  const { error: tokenErr } = await admin
    .from('affiliate_intake_tokens')
    .update({ completed_at: now })
    .eq('id', validation.tokenId)
    .is('completed_at', null)

  if (tokenErr) {
    return NextResponse.json({ error: 'Failed to finalise submission' }, { status: 500 })
  }

  const referralUrl = affiliateReferralUrl(code)

  return NextResponse.json({ ok: true, referral_url: referralUrl, code })
}
