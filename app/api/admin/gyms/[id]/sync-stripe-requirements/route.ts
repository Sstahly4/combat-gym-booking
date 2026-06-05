/**
 * Admin: force-sync a gym's Stripe Connect requirements from Stripe's API.
 *
 * Equivalent to the partner-facing update-stripe-status but:
 *  - authenticated via requireAdmin (no partner session needed)
 *  - uses the service-role client to bypass RLS
 *  - intentionally scoped to /api/admin/ to make the auth boundary explicit
 *
 * Typical use: Seth clicks "Sync Stripe" next to a gym in /admin/gyms when a
 * partner reports that their Stripe status looks stale or their requirements
 * aren't showing in the P3 recovery card.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

interface Params {
  params: { id: string }
}

export async function POST(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const gymId = params.id
  if (!gymId) {
    return NextResponse.json({ error: 'Gym id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: gym, error: gymError } = await admin
    .from('gyms')
    .select('id, name, stripe_account_id')
    .eq('id', gymId)
    .maybeSingle()

  if (gymError || !gym) {
    return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  }

  if (!gym.stripe_account_id) {
    return NextResponse.json(
      { error: 'This gym has no Stripe account — nothing to sync.' },
      { status: 422 },
    )
  }

  try {
    // Same fields as update-stripe-status and the account.updated webhook.
    // All three code paths must stay in sync.
    const account = await stripe.accounts.retrieve(gym.stripe_account_id)

    const verified = Boolean(account.charges_enabled && account.payouts_enabled)
    const chargesEnabled = Boolean(account.charges_enabled)
    const payoutsEnabled = Boolean(account.payouts_enabled)
    const detailsSubmitted = Boolean(account.details_submitted)
    const req = account.requirements
    const currentlyDue = Array.isArray(req?.currently_due) ? req.currently_due : []
    const pendingVerification = Array.isArray(req?.pending_verification)
      ? req.pending_verification
      : []
    const disabledReason =
      typeof req?.disabled_reason === 'string' ? req.disabled_reason : null
    const nowIso = new Date().toISOString()

    const { error: updateError } = await admin
      .from('gyms')
      .update({
        stripe_connect_verified: verified,
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_details_submitted: detailsSubmitted,
        stripe_requirements_currently_due: currentlyDue,
        stripe_requirements_pending_verification: pendingVerification,
        stripe_disabled_reason: disabledReason,
        last_stripe_account_sync_at: nowIso,
      })
      .eq('id', gymId)

    if (updateError) {
      console.error('[admin sync-stripe-requirements] db update failed', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(
      `[admin sync-stripe-requirements] synced gym=${gymId} verified=${verified} ` +
        `currently_due=${currentlyDue.length} triggered_by=${auth.user.id}`,
    )

    return NextResponse.json({
      ok: true,
      gym_id: gymId,
      gym_name: gym.name,
      verified,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      currently_due: currentlyDue,
      pending_verification: pendingVerification,
      disabled_reason: disabledReason,
      synced_at: nowIso,
    })
  } catch (err: any) {
    console.error('[admin sync-stripe-requirements] stripe error', err)
    return NextResponse.json(
      { error: err?.message || 'Stripe API call failed' },
      { status: 502 },
    )
  }
}
