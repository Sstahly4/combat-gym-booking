import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendBookingConfirmedEmail, sendOwnerPayoutDisabledEmail } from '@/lib/email'
import { normalizeOwnerNotificationPrefs } from '@/lib/manage/owner-notification-prefs'

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

      // Canonical model: payment_intent.succeeded means funds captured -> `paid`.
      const newStatus = 'paid'
      if (booking.status === 'paid' || booking.status === 'completed') {
        console.log('ℹ️  Booking already paid/completed, skipping update')
        return NextResponse.json({ received: true, already_confirmed: true })
      }

      // Update booking status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }
      
      // Set payment_captured_at for Request-to-Book flow
      if (newStatus === 'paid') {
        updateData.payment_captured_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id)

      if (updateError) {
        console.error('❌ Error updating booking status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update booking status' },
          { status: 500 }
        )
      }

      console.log(`✅ Booking status updated to paid: ${booking.id}`)

      // Get payment method details for email
      let cardLast4: string | undefined
      let cardBrand: string | undefined
      let chargeDate = new Date().toISOString()

      try {
        // Get charge date from payment intent
        if (paymentIntent.latest_charge) {
          const chargeId = typeof paymentIntent.latest_charge === 'string' 
            ? paymentIntent.latest_charge 
            : paymentIntent.latest_charge.id
          
          try {
            const charge = await stripe.charges.retrieve(chargeId)
            if (charge.created) {
              chargeDate = new Date(charge.created * 1000).toISOString()
            }
          } catch (chargeError) {
            // If charge retrieval fails, use payment intent created date
            if (paymentIntent.created) {
              chargeDate = new Date(paymentIntent.created * 1000).toISOString()
            }
          }
        } else if (paymentIntent.created) {
          // Fallback to payment intent created date
          chargeDate = new Date(paymentIntent.created * 1000).toISOString()
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

    // Stripe Connect source-of-truth: sync payout capability from account updates.
    if (event.type === 'account.updated') {
      try {
        const account = event.data.object as Stripe.Account
        let supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>
        let admin: ReturnType<typeof createAdminClient> | null = null
        try {
          admin = createAdminClient()
          supabase = admin
        } catch {
          supabase = await createClient()
        }

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

        const { data: gyms, error: gymLookupError } = await supabase
          .from('gyms')
          .select('id, name, owner_id, stripe_payouts_enabled')
          .eq('stripe_account_id', account.id)

        if (gymLookupError) {
          return NextResponse.json(
            { error: 'Failed to lookup gym for Stripe account update' },
            { status: 500 }
          )
        }

        if (!gyms || gyms.length === 0) {
          return NextResponse.json({ received: true, account_not_linked: true })
        }

        const nowIso = new Date().toISOString()

        for (const gym of gyms as Array<{
          id: string
          name: string
          owner_id: string
          stripe_payouts_enabled: boolean | null
        }>) {
          const prevPayouts = gym.stripe_payouts_enabled
          const transitionToPayoutsOff = prevPayouts === true && payoutsEnabled === false

          let emailSent = false
          if (transitionToPayoutsOff && admin) {
            const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(gym.owner_id)
            const ownerEmail = authErr ? null : authUser.user?.email ?? null

            const { data: profile } = await supabase
              .from('profiles')
              .select('owner_notification_prefs')
              .eq('id', gym.owner_id)
              .single()

            const prefs = normalizeOwnerNotificationPrefs(
              (profile as { owner_notification_prefs?: unknown } | null)?.owner_notification_prefs
            )

            if (ownerEmail && prefs.email_payouts) {
              await sendOwnerPayoutDisabledEmail({
                ownerEmail,
                gymName: gym.name,
                stripeAccountId: account.id,
                disabledReason,
                requirementsDue: currentlyDue,
              })
              emailSent = true
            }
          }

          const updatePayload: Record<string, unknown> = {
            stripe_connect_verified: verified,
            stripe_charges_enabled: chargesEnabled,
            stripe_payouts_enabled: payoutsEnabled,
            stripe_details_submitted: detailsSubmitted,
            stripe_requirements_currently_due: currentlyDue,
            stripe_requirements_pending_verification: pendingVerification,
            stripe_disabled_reason: disabledReason,
            last_stripe_account_sync_at: nowIso,
            updated_at: nowIso,
          }

          if (payoutsEnabled === true) {
            updatePayload.payout_disabled_notified_at = null
            // Stripe re-verified payouts → clear any active payout-change hold.
            updatePayload.payouts_hold_active = false
            updatePayload.payouts_hold_cleared_at = nowIso
          } else if (transitionToPayoutsOff && emailSent) {
            updatePayload.payout_disabled_notified_at = nowIso
          }

          const { error: updateError } = await supabase
            .from('gyms')
            .update(updatePayload)
            .eq('id', gym.id)

          if (updateError) {
            return NextResponse.json(
              { error: 'Failed to update Stripe verification state' },
              { status: 500 }
            )
          }
        }

        return NextResponse.json({
          received: true,
          event_type: event.type,
          stripe_account_id: account.id,
          stripe_connect_verified: verified,
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error?.message || 'Failed to process account.updated webhook' },
          { status: 500 }
        )
      }
    }

    // Payout-change hold: when external bank account changes, set a hold flag
    // so we can surface a banner in the owner portal and re-prompt verification.
    if (
      event.type === 'account.external_account.created' ||
      event.type === 'account.external_account.updated' ||
      event.type === 'account.external_account.deleted'
    ) {
      try {
        const account = event.account
        if (!account) {
          return NextResponse.json({ received: true, event_type: event.type, skipped: true })
        }
        let supabase: ReturnType<typeof createAdminClient> | Awaited<ReturnType<typeof createClient>>
        let admin: ReturnType<typeof createAdminClient> | null = null
        try {
          admin = createAdminClient()
          supabase = admin
        } catch {
          supabase = await createClient()
        }

        const nowIso = new Date().toISOString()
        const reason =
          event.type === 'account.external_account.deleted'
            ? 'Bank account removed'
            : 'Bank account changed'

        const { data: gyms, error: lookupError } = await supabase
          .from('gyms')
          .select('id, name, owner_id')
          .eq('stripe_account_id', account)

        if (lookupError) {
          return NextResponse.json(
            { error: 'Failed to lookup gym for external_account event' },
            { status: 500 }
          )
        }
        if (!gyms || gyms.length === 0) {
          return NextResponse.json({ received: true, account_not_linked: true })
        }

        for (const gym of gyms as Array<{ id: string; name: string; owner_id: string }>) {
          await supabase
            .from('gyms')
            .update({
              payouts_hold_active: true,
              payouts_hold_reason: reason,
              payouts_hold_set_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', gym.id)

          if (admin) {
            await admin.from('owner_telemetry_events').insert({
              event_type: 'payouts_hold_activated',
              user_id: gym.owner_id,
              gym_id: gym.id,
              metadata: { reason, stripe_event: event.type },
            })

            // Best-effort owner email reusing the existing payout-disabled template.
            try {
              const { data: authUser } = await admin.auth.admin.getUserById(gym.owner_id)
              const ownerEmail = authUser.user?.email ?? null
              const { data: profile } = await admin
                .from('profiles')
                .select('owner_notification_prefs')
                .eq('id', gym.owner_id)
                .single()
              const prefs = normalizeOwnerNotificationPrefs(
                (profile as { owner_notification_prefs?: unknown } | null)?.owner_notification_prefs
              )
              if (ownerEmail && prefs.email_payouts) {
                await sendOwnerPayoutDisabledEmail({
                  ownerEmail,
                  gymName: gym.name,
                  stripeAccountId: account,
                  disabledReason: reason,
                  requirementsDue: [],
                })
              }
            } catch (emailErr) {
              console.warn('[stripe-webhook] payout-hold email failed:', emailErr)
            }
          }
        }

        return NextResponse.json({
          received: true,
          event_type: event.type,
          payouts_hold_active: true,
        })
      } catch (error: any) {
        return NextResponse.json(
          { error: error?.message || 'Failed to process external_account event' },
          { status: 500 }
        )
      }
    }

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
