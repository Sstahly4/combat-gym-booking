/**
 * Connect sample: **hosted Checkout** with a **destination charge** + **application fee**.
 *
 * - Customer pays the **platform**.
 * - `transfer_data.destination` sends the net to the connected account.
 * - `application_fee_amount` keeps a platform cut (demo: 10% of the line total).
 *
 * The connected account id is taken from the **Product metadata** on the server — never trust the client.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  getPublicBaseUrl,
  getStripeClient,
  normalizeStripeRedirectBaseUrl,
  StripeConfigError,
} from '@/lib/stripe/stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Demo platform fee: 10% of the charge (integer cents). */
const APPLICATION_FEE_BPS = 1000

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const base = normalizeStripeRedirectBaseUrl(getPublicBaseUrl())

    const body = (await request.json()) as {
      price_id?: string
      quantity?: number
    }

    const priceId = body.price_id?.trim()
    if (!priceId) {
      return NextResponse.json({ error: 'price_id is required' }, { status: 400 })
    }
    const quantity = Math.max(1, Math.min(99, body.quantity ?? 1))

    // -------------------------------------------------------------------------
    // STEP 1: Load the Price + Product and read `connect_demo_destination` from metadata.
    // -------------------------------------------------------------------------
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    })

    const product = price.product
    if (typeof product === 'string' || !('metadata' in product)) {
      return NextResponse.json({ error: 'Price must belong to a Product' }, { status: 400 })
    }

    const destination = product.metadata?.connect_demo_destination
    if (!destination) {
      return NextResponse.json(
        {
          error:
            'This price is not linked to a Connect demo product (missing metadata connect_demo_destination).',
        },
        { status: 400 }
      )
    }

    const unitAmount = price.unit_amount ?? 0
    const lineTotal = unitAmount * quantity
    const applicationFeeAmount = Math.max(1, Math.floor((lineTotal * APPLICATION_FEE_BPS) / 10000))

    // -------------------------------------------------------------------------
    // STEP 2: Create a Checkout Session — payment mode, destination transfer, app fee.
    // https://stripe.com/docs/connect/destination-charges
    // -------------------------------------------------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination,
        },
      },
      success_url: `${base}/samples/connect/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/samples/connect/store`,
    })

    return NextResponse.json({
      url: session.url,
      id: session.id,
      application_fee_amount: applicationFeeAmount,
      destination,
    })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to create Checkout session'
    console.error('[samples/connect/checkout]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
