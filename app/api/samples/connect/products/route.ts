/**
 * Connect sample: **platform-level** Products (not created on connected accounts).
 *
 * We store the mapping to a connected account in **product metadata**:
 *   `connect_demo_destination` = V2 connected account id
 *
 * That lets Checkout use `transfer_data.destination` + `application_fee_amount` safely
 * (server reads destination from Stripe, not from the client).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, StripeConfigError } from '@/lib/stripe/stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stripe = getStripeClient()

    // List products and expand default_price for the storefront.
    const list = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ['data.default_price'],
    })

    const items = list.data
      .filter((p) => p.metadata?.connect_demo === 'true')
      .map((p) => {
        const price = p.default_price
        const priceObj =
          typeof price === 'object' && price !== null && !('deleted' in price && price.deleted)
            ? price
            : null
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          metadata: p.metadata,
          default_price:
            priceObj && 'id' in priceObj
              ? {
                  id: priceObj.id,
                  unit_amount: priceObj.unit_amount,
                  currency: priceObj.currency,
                }
              : null,
        }
      })

    return NextResponse.json({ products: items })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to list products'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const body = (await request.json()) as {
      name?: string
      description?: string
      unit_amount_cents?: number
      currency?: string
      /** V2 connected account id that should receive the net of each charge */
      connect_demo_destination?: string
      seller_label?: string
    }

    const name = body.name?.trim()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const destination = body.connect_demo_destination?.trim()
    if (!destination) {
      return NextResponse.json(
        { error: 'connect_demo_destination is required (V2 connected account id from seller onboarding)' },
        { status: 400 }
      )
    }

    const unit = body.unit_amount_cents
    if (unit === undefined || unit < 50) {
      return NextResponse.json(
        { error: 'unit_amount_cents is required (integer, minimum 50 for most currencies)' },
        { status: 400 }
      )
    }

    const currency = (body.currency || 'usd').toLowerCase()

    // -------------------------------------------------------------------------
    // STEP: Create a Product on the **platform** account with a default Price.
    // Metadata links this product to the connected account that will receive funds.
    // -------------------------------------------------------------------------
    const product = await stripe.products.create({
      name,
      description: body.description?.trim() || undefined,
      metadata: {
        connect_demo: 'true',
        connect_demo_destination: destination,
        connect_demo_seller_label: body.seller_label?.trim() || 'Seller',
      },
      default_price_data: {
        unit_amount: unit,
        currency,
      },
    })

    return NextResponse.json({
      id: product.id,
      name: product.name,
      default_price: product.default_price,
    })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to create product'
    console.error('[samples/connect/products POST]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
