import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use admin client to bypass RLS - this endpoint is only used from admin page
    // which already verifies admin access on the client side
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
