import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

// Webhook or manual trigger to update Stripe Connect verification status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Check ownership or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (gym.owner_id !== user.id && profile?.role !== 'admin') {
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
