/**
 * Connect sample: create a **V2 Account Link** for hosted onboarding (recipient configuration).
 *
 * Returns a one-time `url` that redirects the user to Stripe to complete requirements.
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

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const base = normalizeStripeRedirectBaseUrl(getPublicBaseUrl())

    const body = (await request.json()) as { account_id?: string }
    const accountId = body.account_id?.trim()
    if (!accountId) {
      return NextResponse.json({ error: 'account_id is required' }, { status: 400 })
    }

    const refreshUrl = `${base}/samples/connect/seller?refresh=1`
    const returnUrl = `${base}/samples/connect/seller?onboarding=return&accountId=${encodeURIComponent(accountId)}`

    // -------------------------------------------------------------------------
    // STEP: v2.core.accountLinks.create — hosted onboarding for the recipient
    // configuration (collect bank / KYC as needed).
    // -------------------------------------------------------------------------
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    })

    // V2 AccountLink objects expose `url` + `expires_at` (see Stripe types; id may be omitted in typings).
    return NextResponse.json({
      url: accountLink.url,
      expires_at: accountLink.expires_at,
      account: accountLink.account,
    })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to create account link'
    console.error('[samples/connect/account-links]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
