/**
 * Webhook endpoint for **thin** V2 Account events (Connect sample).
 *
 * Configure in Stripe Dashboard:
 * - Developers → Webhooks → Add destination → Connected accounts
 * - Payload style: **Thin**
 * - Events: e.g. v2.core.account.* requirement / capability updates (see Stripe docs for exact names)
 *
 * Local testing:
 *   stripe listen --thin-events '...' --forward-thin-to localhost:3000/api/samples/connect/webhooks
 *
 * Set `STRIPE_CONNECT_SAMPLE_WEBHOOK_SECRET` to the signing secret for **this** endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeClient, StripeConfigError } from '@/lib/stripe/stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_CONNECT_SAMPLE_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    console.error(
      '[samples/connect/webhooks] STRIPE_CONNECT_SAMPLE_WEBHOOK_SECRET is not set. Add it from the Stripe Dashboard → Webhooks → this endpoint → Signing secret.'
    )
    return NextResponse.json(
      {
        error:
          'STRIPE_CONNECT_SAMPLE_WEBHOOK_SECRET is not configured. Create a thin-event destination in the Dashboard and paste the signing secret.',
      },
      { status: 500 }
    )
  }

  try {
    const stripe = getStripeClient()
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // -------------------------------------------------------------------------
    // STEP 1: Parse & verify the **thin** event notification (not a full v1 Event).
    // https://docs.stripe.com/webhooks#thin-events
    // -------------------------------------------------------------------------
    const notification = stripe.parseEventNotification(body, signature, webhookSecret)

    // -------------------------------------------------------------------------
    // STEP 2: Hydrate the full V2 Event object (contains `type`, `related_object`, etc.).
    // -------------------------------------------------------------------------
    const event = await notification.fetchEvent()

    // -------------------------------------------------------------------------
    // STEP 3: Branch on event type — requirements and capabilities can change over time.
    // -------------------------------------------------------------------------
    const type = event.type

    if (type.includes('RequirementsUpdated') || type.includes('requirements')) {
      console.log('[sample webhook] Account requirements changed:', event.id, type)
      // Production: queue a job to re-fetch the account and notify the seller.
    }

    if (type.includes('CapabilityStatusUpdated') || type.includes('capability')) {
      console.log('[sample webhook] Capability status changed:', event.id, type)
      // Production: update payout eligibility UI, send email, etc.
    }

    return NextResponse.json({ received: true, event_type: type })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    console.error('[samples/connect/webhooks]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
