import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's gym
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, stripe_account_id')
      .eq('owner_id', user.id)
      .single()

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    let accountId = gym.stripe_account_id

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Default, can be made dynamic
        email: user.email,
      })

      accountId = account.id

      // Save account ID to database
      await supabase
        .from('gyms')
        .update({ stripe_account_id: accountId })
        .eq('id', gym.id)

    // Check if account is now fully verified and update status
    try {
      const account = await stripe.accounts.retrieve(accountId)
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase
          .from('gyms')
          .update({ stripe_connect_verified: true })
          .eq('id', gym.id)
      }
    } catch (error) {
      console.error('Error checking Stripe verification status:', error)
    }
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/manage/stripe-connect?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/manage/stripe-connect?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Stripe account creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
}
