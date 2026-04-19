/**
 * POST /api/stripe/connect/account-session
 *
 * Creates a short-lived Stripe AccountSession for the embedded Connect
 * components on the Partner Hub Payouts page. The returned `client_secret`
 * is consumed by `<ConnectComponentsProvider />` on the client.
 *
 * Body:  { gym_id: string }
 * Auth:  must be the owner of the gym (same guard as /api/stripe/balances)
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status })
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError('Stripe is not configured on the server.', 503, 'stripe_not_configured')
    }

    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') return jsonError('Unauthorized', 401)
    if (access.status !== 'ok') return jsonError('Forbidden', 403)

    const body = await request.json().catch(() => ({}))
    const gymId = typeof body?.gym_id === 'string' ? body.gym_id : null
    if (!gymId) return jsonError('Missing gym_id', 400, 'missing_gym_id')

    const { supabase } = access
    const { data: gym, error } = await supabase
      .from('gyms')
      .select('id, owner_id, stripe_account_id')
      .eq('id', gymId)
      .maybeSingle()

    if (error || !gym || gym.owner_id !== access.userId) {
      return jsonError('Gym not found or access denied', 403)
    }
    if (!gym.stripe_account_id) {
      return jsonError('Stripe account not connected for this gym.', 409, 'stripe_not_connected')
    }

    const session = await stripe.accountSessions.create({
      account: gym.stripe_account_id as string,
      components: {
        payouts: { enabled: true },
        account_management: { enabled: true },
      },
    })

    return NextResponse.json({
      client_secret: session.client_secret,
      account: gym.stripe_account_id,
      publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
    })
  } catch (err: any) {
    console.error('[stripe/connect/account-session] failed', err)
    return jsonError(err?.message || 'Failed to create account session', 500)
  }
}
