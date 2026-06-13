export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateAffiliateIntakeToken } from '@/lib/affiliates/intake'
import { encryptPayoutDetailsForStorage } from '@/lib/affiliates/admin'
import { isAffiliateEncryptionConfigured } from '@/lib/affiliates/encryption'
import { formatAffiliatePayoutDetails } from '@/lib/affiliates/intake-token'

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
    affiliate_name: result.affiliateName,
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
    const status = validation.reason === 'used' ? 410 : 404
    return NextResponse.json({ error: 'This link is no longer valid', reason: validation.reason }, { status })
  }

  const body = await request.json()
  const name = (body.name || '').toString().trim()
  const payoutMethod = body.payout_method === 'paypal' ? 'paypal' : 'bank'

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
  }

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
      payout_method: payoutMethod,
      payout_details_encrypted: encrypted,
      payout_details_submitted_at: now,
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

  return NextResponse.json({ ok: true })
}
