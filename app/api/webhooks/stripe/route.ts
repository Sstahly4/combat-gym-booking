import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail } from '@/lib/email'

// Disable body parsing, we need the raw body for webhook signature verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      console.error('Available headers:', Object.fromEntries(headersList.entries()))
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    if (!stripe) {
      console.error('❌ Stripe not configured')
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured')
      console.error('⚠️  Make sure to set STRIPE_WEBHOOK_SECRET in your .env.local')
      console.error('   If using Stripe CLI, use the secret from: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    console.log('📥 Webhook received:')
    console.log('   Body length:', body.length)
    console.log('   Signature present:', !!signature)
    console.log('   Webhook secret configured:', !!webhookSecret)

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified')
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message)
      console.error('   Make sure you are using the correct webhook secret:')
      console.error('   - If using Stripe CLI: Use the secret from "stripe listen" output (starts with whsec_)')
      console.error('   - If using Stripe Dashboard: Use the signing secret from the webhook endpoint settings')
      console.error('   - Current secret starts with:', webhookSecret.substring(0, 10) + '...')
      return NextResponse.json(
        { 
          error: `Webhook signature verification failed: ${err.message}`,
          hint: 'Make sure STRIPE_WEBHOOK_SECRET matches the secret from Stripe CLI or Dashboard'
        },
        { status: 400 }
      )
    }

    console.log(`✅ Webhook received: ${event.type}`)

    // Handle payment_intent.succeeded event (payment captured)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const paymentIntentId = paymentIntent.id

      console.log(`📦 Processing payment_intent.succeeded for: ${paymentIntentId}`)

      try {
      const supabase = await createClient()

      // Find booking by payment intent ID
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          gym:gyms(name, city, country, currency, owner_id),
          package:packages(name, includes_meals, meal_plan_details),
          variant:package_variants(name)
        `)
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (bookingError || !booking) {
        console.error('❌ Booking not found for payment intent:', paymentIntentId, bookingError)
        // Don't fail the webhook - payment succeeded, just no booking found
        return NextResponse.json({ received: true, booking_not_found: true })
      }

      console.log(`✅ Found booking: ${booking.id} (${booking.booking_reference || booking.id})`)

      // Only update if not already confirmed (idempotency)
      if (booking.status === 'confirmed') {
        console.log('ℹ️  Booking already confirmed, skipping update')
        return NextResponse.json({ received: true, already_confirmed: true })
      }

      // Update booking status to confirmed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)

      if (updateError) {
        console.error('❌ Error updating booking status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update booking status' },
          { status: 500 }
        )
      }

      console.log(`✅ Booking status updated to confirmed: ${booking.id}`)

      // Get payment method details for email
      let cardLast4: string | undefined
      let cardBrand: string | undefined
      let chargeDate = new Date().toISOString()

      try {
        // Get charge date from payment intent
        if (paymentIntent.charges?.data?.[0]?.created) {
          chargeDate = new Date(paymentIntent.charges.data[0].created * 1000).toISOString()
        }

        // Get payment method details if available
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          cardLast4 = paymentMethod.card?.last4
          cardBrand = paymentMethod.card?.brand
        }
      } catch (stripeError) {
        console.error('Error fetching payment method details:', stripeError)
        // Continue without card details
      }

      // Generate magic link for booking access
      let magicLink: string | undefined
      if (booking.guest_email) {
        try {
          const tokenResponse = await fetch(
            `${request.nextUrl.origin}/api/bookings/${booking.id}/access-token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: booking.guest_email,
                expiresInDays: 90 
              }),
            }
          )

          if (tokenResponse.ok) {
            const { token } = await tokenResponse.json()
            magicLink = `${request.nextUrl.origin}/bookings/access/${token}`
          }
        } catch (tokenError) {
          console.error('Error generating magic link:', tokenError)
          // Continue without magic link
        }
      }

      // Send confirmation email to guest
      if (booking.guest_email) {
        console.log(`📧 Sending confirmation email to: ${booking.guest_email}`)
        const gym = booking.gym as any
        const package_ = booking.package as any
        const variant = booking.variant as any

        try {
          const emailResult = await sendBookingConfirmedEmail({
            bookingReference: booking.booking_reference || booking.id,
            bookingPin: booking.booking_pin || 'N/A',
            guestName: booking.guest_name || 'Guest',
            guestEmail: booking.guest_email,
            gymName: gym.name,
            gymCountry: gym.country,
            startDate: booking.start_date,
            endDate: booking.end_date,
            packageName: package_?.name,
            variantName: variant?.name,
            totalPrice: booking.total_price,
            currency: gym.currency || 'USD',
            cardLast4,
            cardBrand: cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : undefined,
            chargeDate,
            mealPlanDetails: package_?.meal_plan_details || null,
            magicLink,
          })
          if (emailResult) {
            console.log('✅ Confirmation email sent successfully')
          } else {
            console.warn('⚠️  Email function returned false - check logs above for details')
          }
        } catch (emailError: any) {
          console.error('❌ Error sending confirmation email:', emailError)
          console.error('   Error details:', emailError.message, emailError.stack)
          // Don't fail the webhook if email fails
        }
      } else {
        console.warn('⚠️  No guest email found for booking, skipping email')
      }

      return NextResponse.json({ 
        received: true, 
        booking_id: booking.id,
        status_updated: true,
        email_sent: !!booking.guest_email
      })
    } catch (error: any) {
      console.error('❌ Error processing payment_intent.succeeded:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process webhook' },
        { status: 500 }
      )
    }
    }

    // Handle other event types (optional)
    console.log(`ℹ️  Unhandled event type: ${event.type}`)
    return NextResponse.json({ received: true, event_type: event.type })
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
