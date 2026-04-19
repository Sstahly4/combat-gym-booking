/**
 * Connect sample: create and inspect **V2 Core Accounts** (recipient / platform-fee model).
 *
 * POST — create a connected account (no top-level `type`; uses `v2.core.accounts.create`).
 * GET  — retrieve live onboarding + capability status from Stripe (not from our DB), per sample spec.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, StripeConfigError } from '@/lib/stripe/stripe-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const body = (await request.json()) as {
      display_name?: string
      contact_email?: string
      /** ISO 3166-1 alpha-2, e.g. `us` */
      country?: string
    }

    const display_name = body.display_name?.trim() || 'Demo seller'
    const contact_email = body.contact_email?.trim()
    if (!contact_email) {
      return NextResponse.json({ error: 'contact_email is required' }, { status: 400 })
    }

    const country = (body.country || 'us').toLowerCase()

    // -------------------------------------------------------------------------
    // STEP: Create a V2 Core Account — platform collects fees & losses; recipient
    // receives transfers (destination charges / separate charges + transfers).
    // Docs: https://docs.stripe.com/api/v2/core/accounts/create
    // -------------------------------------------------------------------------
    const account = await stripe.v2.core.accounts.create({
      display_name,
      contact_email,
      identity: {
        country,
      },
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
      metadata: {
        connect_demo: 'true',
      },
    })

    return NextResponse.json({
      id: account.id,
      object: account.object,
      display_name: account.display_name,
    })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to create account'
    console.error('[samples/connect/accounts POST]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const id = request.nextUrl.searchParams.get('id')?.trim()
    if (!id) {
      return NextResponse.json({ error: 'Query param id is required (Stripe account id)' }, { status: 400 })
    }

    // -------------------------------------------------------------------------
    // STEP: Always fetch fresh status from Stripe (do not rely on local DB).
    // Include recipient configuration + requirements for UI + capability checks.
    // -------------------------------------------------------------------------
    const account = await stripe.v2.core.accounts.retrieve(id, {
      include: ['configuration.recipient', 'requirements'],
    })

    const recipient = account.configuration?.recipient
    const transfersStatus =
      recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ?? 'unknown'
    const payoutsStatus =
      recipient?.capabilities?.stripe_balance?.payouts?.status ?? 'unknown'

    const readyToReceivePayments = transfersStatus === 'active'

    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status
    const onboardingComplete =
      requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due'

    return NextResponse.json({
      id: account.id,
      display_name: account.display_name,
      contact_email: account.contact_email,
      dashboard: account.dashboard,
      recipient_applied: recipient?.applied,
      transfers_capability_status: transfersStatus,
      payouts_capability_status: payoutsStatus,
      ready_to_receive_payments: readyToReceivePayments,
      requirements_summary_status: requirementsStatus ?? null,
      onboarding_complete: onboardingComplete,
      raw: {
        requirements: account.requirements,
        configuration: account.configuration,
      },
    })
  } catch (e: unknown) {
    if (e instanceof StripeConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
    const msg = e instanceof Error ? e.message : 'Failed to retrieve account'
    console.error('[samples/connect/accounts GET]', e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
