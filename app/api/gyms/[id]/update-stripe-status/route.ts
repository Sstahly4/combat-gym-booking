import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { recordOwnerEvent } from '@/lib/telemetry/owner-events'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Webhook or manual trigger to update Stripe Connect verification status
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownerAccess = await getOwnerAccessContext()
    let supabase: any
    let userId = ''
    let isAdmin = false

    if (ownerAccess.status === 'ok') {
      supabase = ownerAccess.supabase
      userId = ownerAccess.userId
    } else if (ownerAccess.status === 'not_owner' && ownerAccess.userId) {
      // Allow admins to trigger status refresh for support flows.
      const authClient = await createClient()
      const { data: profile } = await authClient
        .from('profiles')
        .select('role')
        .eq('id', ownerAccess.userId)
        .single()
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      supabase = authClient
      userId = ownerAccess.userId
      isAdmin = true
    } else if (ownerAccess.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, stripe_account_id')
      .eq('id', params.id)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    if (!isAdmin && gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!gym.stripe_account_id) {
      return NextResponse.json({ verified: false })
    }

    // Retrieve full account so we can sync requirements alongside verified state
    const account = await stripe.accounts.retrieve(gym.stripe_account_id)
    const verified = Boolean(account.charges_enabled && account.payouts_enabled)
    const chargesEnabled = Boolean(account.charges_enabled)
    const payoutsEnabled = Boolean(account.payouts_enabled)
    const detailsSubmitted = Boolean(account.details_submitted)
    const req = account.requirements
    const currentlyDue = Array.isArray(req?.currently_due) ? req.currently_due : []
    const pendingVerification = Array.isArray(req?.pending_verification) ? req.pending_verification : []
    const disabledReason = typeof req?.disabled_reason === 'string' ? req.disabled_reason : null
    const nowIso = new Date().toISOString()

    // Mirror what account.updated webhook writes so the DB stays consistent
    // whether sync comes from a webhook event or a manual/onExit trigger.
    await supabase
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
      .eq('id', params.id)

    if (verified) {
      await recordOwnerEvent(supabase as never, {
        event_type: 'payouts_details_set',
        user_id: gym.owner_id,
        gym_id: params.id,
        metadata: { rail: 'stripe_connect', source: 'update_stripe_status' },
      })
    }

    return NextResponse.json({
      verified,
      currently_due: currentlyDue,
      pending_verification: pendingVerification,
      disabled_reason: disabledReason,
      synced_at: nowIso,
    })
  } catch (error: any) {
    console.error('Stripe status update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Stripe status' },
      { status: 500 }
    )
  }
}
