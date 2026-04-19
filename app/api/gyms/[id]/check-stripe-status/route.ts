import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authClient = await createClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client for data reads after authz is verified.
    const supabase = createAdminClient()

    // Get gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, stripe_account_id')
      .eq('id', params.id)
      .single()

    if (gymError) {
      console.error('Gym query error:', gymError)
      return NextResponse.json({ 
        error: 'Gym not found', 
        details: gymError.message,
        gymId: params.id 
      }, { status: 404 })
    }

    if (!gym) {
      console.error('Gym not found:', params.id)
      return NextResponse.json({ 
        error: 'Gym not found',
        gymId: params.id 
      }, { status: 404 })
    }

    const ownerId = gym.owner_id as string
    const isAdmin = profile.role === 'admin'
    const isOwner = ownerId === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!gym.stripe_account_id) {
      return NextResponse.json({
        verified: false,
        has_account: false,
        details: null,
      })
    }

    // Check Stripe Connect account status
    const account = await stripe.accounts.retrieve(gym.stripe_account_id)

    // Check if account is fully onboarded
    // Requirements: charges_enabled (KYC done) and payouts_enabled (bank account added)
    const verified = account.charges_enabled && account.payouts_enabled

    return NextResponse.json({
      verified,
      has_account: true,
      details: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        email: account.email,
      },
    })
  } catch (error: any) {
    console.error('Stripe status check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check Stripe status' },
      { status: 500 }
    )
  }
}
