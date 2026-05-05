import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOwnerOrAdminAccessContext } from '@/lib/auth/owner-guard'
import {
  DEFAULT_STRIPE_CONNECT_COUNTRY,
  gymCountryToStripeIso2,
} from '@/lib/stripe/gym-country'
import { normalizeStripeRedirectBaseUrl, StripeConfigError } from '@/lib/stripe/stripe-client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }
  if (error instanceof Error) return error.message
  return ''
}

/** Stripe returns this when the platform account has not completed Connect activation. */
function isStripeConnectNotEnabledError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('signed up for connect') ||
    m.includes('dashboard.stripe.com/connect') ||
    m.includes('enable connect')
  )
}

/** Express country not enabled under Connect → Express → Country and capabilities. */
function isExpressCountryDisabledError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('not enabled for express') ||
    m.includes('country and capabilities') ||
    m.includes('settings/applications/express')
  )
}

/**
 * Stored `acct_xxx` is invalid for the current STRIPE_SECRET_KEY (e.g. test account + live key,
 * live account + test key, or account deleted in Dashboard).
 */
function isStaleConnectedAccountError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('not connected to your platform') ||
    (m.includes('does not exist') && m.includes('account')) ||
    (m.includes('no such') && m.includes('account'))
  )
}

export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerOrAdminAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok' || !access.user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { supabase, user } = access

    let requestedGymId: string | null = null
    let embeddedOnly = false
    try {
      const body = (await request.json()) as { gym_id?: unknown; embedded_only?: unknown }
      if (typeof body?.gym_id === 'string' && body.gym_id.trim()) {
        requestedGymId = body.gym_id.trim()
      }
      embeddedOnly = body?.embedded_only === true
    } catch {
      // no JSON body — fall back to default gym resolution
    }

    let gym: { id: string; stripe_account_id: string | null; country: string | null } | null = null

    if (requestedGymId) {
      const { data: row, error } = await supabase
        .from('gyms')
        .select('id, stripe_account_id, owner_id, country')
        .eq('id', requestedGymId)
        .maybeSingle()

      if (error || !row || row.owner_id !== access.userId) {
        return NextResponse.json({ error: 'Gym not found or access denied' }, { status: 403 })
      }
      gym = { id: row.id, stripe_account_id: row.stripe_account_id, country: row.country }
    } else {
      const { data } = await supabase
        .from('gyms')
        .select('id, stripe_account_id, country')
        .eq('owner_id', access.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      gym = data
    }

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
    }

    const hadStoredStripeAccount = Boolean(gym.stripe_account_id)

    const stripeCountry =
      gymCountryToStripeIso2(gym.country) ?? DEFAULT_STRIPE_CONNECT_COUNTRY

    const rawBase = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '')
    let baseUrl: string
    try {
      baseUrl = normalizeStripeRedirectBaseUrl(rawBase)
    } catch (e) {
      const msg =
        e instanceof StripeConfigError
          ? e.message
          : 'Invalid app URL for Stripe redirects. Use https:// in NEXT_PUBLIC_APP_URL for production.'
      return NextResponse.json({ error: msg, code: 'stripe_redirect_https_required' }, { status: 400 })
    }

    const gymQs = `tab=payouts&gym_id=${encodeURIComponent(gym.id)}`
    const payoutsSettingsPath = `/manage/settings?${gymQs}`

    const createExpressAccount = async (): Promise<string> => {
      const account = await stripe.accounts.create({
        type: 'express',
        country: stripeCountry,
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      await supabase.from('gyms').update({ stripe_account_id: account.id }).eq('id', gym!.id)
      try {
        const created = await stripe.accounts.retrieve(account.id)
        if (created.charges_enabled && created.payouts_enabled) {
          await supabase.from('gyms').update({ stripe_connect_verified: true }).eq('id', gym!.id)
        }
      } catch (error) {
        console.error('Error checking Stripe verification status:', error)
      }
      return account.id
    }

    const createAccountLink = (accountId: string) =>
      stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}${payoutsSettingsPath}&stripe_refresh=1`,
        return_url: `${baseUrl}${payoutsSettingsPath}&from_stripe=1`,
        type: 'account_onboarding',
      })

    let accountId = gym.stripe_account_id

    if (!accountId) {
      accountId = await createExpressAccount()
    }

    if (embeddedOnly) {
      return NextResponse.json({ ok: true as const, account_id: accountId })
    }

    try {
      const accountLink = await createAccountLink(accountId)
      return NextResponse.json({ url: accountLink.url })
    } catch (linkError: unknown) {
      const linkMsg = errorMessage(linkError)
      if (hadStoredStripeAccount && isStaleConnectedAccountError(linkMsg)) {
        console.warn(
          '[stripe/create-account] Clearing stale stripe_account_id and recreating Connect account:',
          gym.id,
          linkMsg
        )
        await supabase
          .from('gyms')
          .update({ stripe_account_id: null, stripe_connect_verified: false })
          .eq('id', gym.id)

        const newAccountId = await createExpressAccount()
        const accountLink = await createAccountLink(newAccountId)
        return NextResponse.json({ url: accountLink.url })
      }
      throw linkError
    }
  } catch (error: unknown) {
    console.error('Stripe account creation error:', error)
    const raw = errorMessage(error)

    if (raw && isStripeConnectNotEnabledError(raw)) {
      return NextResponse.json(
        {
          error:
            'Stripe Connect is not enabled for the Stripe account tied to this app. In the Stripe Dashboard, open Connect (Test: https://dashboard.stripe.com/test/connect ) and complete platform setup. Use the secret key from that same account in STRIPE_SECRET_KEY.',
          code: 'stripe_connect_not_enabled',
        },
        { status: 503 }
      )
    }

    if (raw && isExpressCountryDisabledError(raw)) {
      return NextResponse.json(
        {
          error:
            'This country is not enabled for Stripe Express connected accounts on your platform. Open Stripe → Settings → Connect → Express accounts → Country and capabilities, and enable the countries where your gyms operate (e.g. Thailand, Australia, United States). The app uses your gym’s country from onboarding; ensure that country is enabled.',
          code: 'express_country_not_enabled',
          help_url: 'https://dashboard.stripe.com/settings/applications/express',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: raw || 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
}
