import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use admin client with service role key - bypasses RLS
    // Security: This endpoint should only be accessible from the admin page
    // which already verifies the user is an admin on the client side
    let supabase
    try {
      supabase = createAdminClient()
    } catch (error: any) {
      console.error('Failed to create admin client:', error)
      return NextResponse.json({ 
        error: 'Server configuration error', 
        details: error.message 
      }, { status: 500 })
    }

    // Get gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', params.id)
      .single()

    if (gymError) {
      console.error('Gym query error:', gymError)
      console.error('Gym ID:', params.id)
      return NextResponse.json({ 
        error: 'Gym not found', 
        details: gymError.message,
        gymId: params.id,
        code: gymError.code 
      }, { status: 404 })
    }

    if (!gym) {
      console.error('Gym not found (no data returned):', params.id)
      return NextResponse.json({ 
        error: 'Gym not found',
        gymId: params.id 
      }, { status: 404 })
    }

    // Check all verification requirements
    const requirements = {
      hasGoogleMaps: !!gym.google_maps_link,
      hasSocialMedia: !!(gym.instagram_link || gym.facebook_link),
      hasStripeConnect: false,
      stripeVerified: false,
    }

    // Check Stripe Connect status
    if (gym.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(gym.stripe_account_id)
        requirements.hasStripeConnect = true
        requirements.stripeVerified = account.charges_enabled && account.payouts_enabled
      } catch (error) {
        console.error('Stripe account check error:', error)
      }
    }

    // Check requirements (for info only - admin can override)
    const allRequirementsMet = requirements.hasGoogleMaps && requirements.hasSocialMedia && requirements.stripeVerified
    
    // Admin can verify even if requirements aren't met (manual override)
    // This allows admins to verify gyms in special cases or if requirements need to be added later
    if (!allRequirementsMet) {
      // Log warning but allow admin to proceed
      console.warn(`Admin verifying gym ${params.id} with missing requirements:`, {
        hasGoogleMaps: requirements.hasGoogleMaps,
        hasSocialMedia: requirements.hasSocialMedia,
        stripeVerified: requirements.stripeVerified
      })
    }

    // Update gym to verified status
    const { error: updateError } = await supabase
      .from('gyms')
      .update({
        verification_status: 'verified',
        admin_approved: true,
        verified_at: new Date().toISOString(),
        status: 'approved', // Keep legacy status for compatibility
      })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: allRequirementsMet 
        ? 'Gym verified successfully' 
        : 'Gym verified successfully (admin override - some requirements missing)',
      requirements,
      admin_override: !allRequirementsMet
    })
  } catch (error: any) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify gym' },
      { status: 500 }
    )
  }
}
