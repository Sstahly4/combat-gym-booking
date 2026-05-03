import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status })
}

function pickTotal(items: Array<{ amount: number; currency: string }>, currency: string) {
  return items
    .filter((x) => x.currency.toLowerCase() === currency.toLowerCase())
    .reduce((sum, x) => sum + (Number(x.amount) || 0), 0)
}

export async function GET(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError('Payment processing is not configured on the server.', 503, 'stripe_not_configured')
    }

    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return jsonError('Unauthorized', 401)
    if (access.status !== 'ok') return jsonError('Forbidden', 403)

    const { supabase } = access
    const url = new URL(request.url)
    const gymId = url.searchParams.get('gym_id')

    if (!gymId) return jsonError('Missing gym_id', 400, 'missing_gym_id')

    const { data: gym, error } = await supabase
      .from('gyms')
      .select(
        `id, owner_id, currency, payout_rail, wise_payout_ready, wise_recipient_id, wise_recipient_currency,
         stripe_account_id, stripe_connect_verified, stripe_payouts_enabled, stripe_charges_enabled,
         payouts_hold_active, payouts_hold_reason, payouts_hold_set_at`
      )
      .eq('id', gymId)
      .maybeSingle()

    if (error || !gym || gym.owner_id !== access.userId) {
      return jsonError('Gym not found or access denied', 403)
    }

    const rail =
      (gym as { payout_rail?: string }).payout_rail === 'stripe_connect' ? 'stripe_connect' : 'wise'

    /** Wise (and default) rail does not use a connected Stripe account for payouts — return a safe empty balance view. */
    if (rail !== 'stripe_connect') {
      const g = gym as {
        id: string
        wise_payout_ready?: boolean | null
        wise_recipient_currency?: string | null
        currency?: string | null
        payouts_hold_active?: boolean | null
        payouts_hold_reason?: string | null
        payouts_hold_set_at?: string | null
      }
      const displayCurrency = (
        g.wise_recipient_currency ||
        g.currency ||
        'usd'
      ).toLowerCase()

      return NextResponse.json({
        payout_rail: 'wise' as const,
        gym: {
          id: g.id,
          stripe_account_id: null,
          stripe_connect_verified: Boolean((gym as { stripe_connect_verified?: boolean }).stripe_connect_verified),
          payout_rail: 'wise' as const,
          wise_payout_ready: Boolean(g.wise_payout_ready),
          wise_recipient_currency: g.wise_recipient_currency ?? null,
          payouts_hold_active: Boolean(g.payouts_hold_active),
          payouts_hold_reason: g.payouts_hold_reason ?? null,
          payouts_hold_set_at: g.payouts_hold_set_at ?? null,
        },
        stripe: {
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        },
        currency: displayCurrency,
        available: { total: 0 },
        pending: { total: 0 },
        payouts: [] as unknown[],
      })
    }

    if (!gym.stripe_account_id) {
      return jsonError(
        'Payouts are not connected for this gym yet. Open Balances → Payouts to finish setup.',
        409,
        'stripe_not_connected'
      )
    }

    const accountId = gym.stripe_account_id as string

    const [account, balance, payouts, externalAccounts] = await Promise.all([
      stripe.accounts.retrieve(accountId),
      stripe.balance.retrieve({}, { stripeAccount: accountId }),
      stripe.payouts.list({ limit: 25 }, { stripeAccount: accountId }),
      stripe.accounts
        .listExternalAccounts(accountId, { object: 'bank_account', limit: 25 })
        .catch(() => ({ data: [] as Stripe.BankAccount[] })),
    ])

    const bankById = new Map<string, { bank_name: string | null; last4: string | null }>()
    for (const ba of (externalAccounts.data as Stripe.BankAccount[]) || []) {
      bankById.set(ba.id, { bank_name: ba.bank_name ?? null, last4: ba.last4 ?? null })
    }

    // Choose a "primary" currency for display: first available, else first pending, else USD fallback.
    const primaryCurrency =
      (balance.available[0]?.currency || balance.pending[0]?.currency || 'usd').toLowerCase()

    const availableTotal = pickTotal(balance.available as any, primaryCurrency)
    const pendingTotal = pickTotal(balance.pending as any, primaryCurrency)

    return NextResponse.json({
      gym: {
        id: gym.id,
        stripe_account_id: accountId,
        stripe_connect_verified: Boolean(gym.stripe_connect_verified),
        stripe_payouts_enabled:
          typeof gym.stripe_payouts_enabled === 'boolean' ? gym.stripe_payouts_enabled : null,
        stripe_charges_enabled:
          typeof gym.stripe_charges_enabled === 'boolean' ? gym.stripe_charges_enabled : null,
        payouts_hold_active: Boolean((gym as { payouts_hold_active?: boolean }).payouts_hold_active),
        payouts_hold_reason: (gym as { payouts_hold_reason?: string | null }).payouts_hold_reason ?? null,
        payouts_hold_set_at: (gym as { payouts_hold_set_at?: string | null }).payouts_hold_set_at ?? null,
      },
      stripe: {
        charges_enabled: Boolean((account as any).charges_enabled),
        payouts_enabled: Boolean((account as any).payouts_enabled),
        details_submitted: Boolean((account as any).details_submitted),
      },
      currency: primaryCurrency,
      available: {
        total: availableTotal,
        by_currency: balance.available,
      },
      pending: {
        total: pendingTotal,
        by_currency: balance.pending,
      },
      payouts: payouts.data.map((p) => {
        const destinationId = typeof p.destination === 'string' ? p.destination : null
        const bank = destinationId ? bankById.get(destinationId) ?? null : null
        return {
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          arrival_date: p.arrival_date,
          created: p.created,
          destination: destinationId,
          destination_bank_name: bank?.bank_name ?? null,
          destination_last4: bank?.last4 ?? null,
          type: 'Payout to bank account',
        }
      }),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load balances'
    console.error('[stripe/balances]', err)
    return jsonError(message, 500)
  }
}

