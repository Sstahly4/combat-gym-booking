import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

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

    // Check Stripe Connect account status
    const account = await stripe.accounts.retrieve(gym.stripe_account_id)
    const verified = account.charges_enabled && account.payouts_enabled

    // Update database
    await supabase
      .from('gyms')
      .update({ stripe_connect_verified: verified })
      .eq('id', params.id)

    return NextResponse.json({ verified })
  } catch (error: any) {
    console.error('Stripe status update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Stripe status' },
      { status: 500 }
    )
  }
}
