export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

const RAILS = new Set(['wise', 'stripe_connect'])

type PatchBody = {
  payout_rail?: string
  wise_recipient_currency?: string | null
}

/**
 * Owner updates payout rail and optional Wise payout currency (before recipient creation).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const gymId = params.id?.trim()
    if (!gymId) {
      return NextResponse.json({ error: 'Missing gym id.' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as PatchBody
    const rail = typeof body.payout_rail === 'string' ? body.payout_rail.trim() : ''
    const currencyRaw =
      body.wise_recipient_currency === undefined
        ? undefined
        : typeof body.wise_recipient_currency === 'string'
          ? body.wise_recipient_currency.trim().toUpperCase()
          : null

    if (!rail || !RAILS.has(rail)) {
      return NextResponse.json({ error: 'payout_rail must be wise or stripe_connect.' }, { status: 400 })
    }

    const { supabase, userId } = access
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, wise_recipient_currency, wise_recipient_id')
      .eq('id', gymId)
      .maybeSingle()

    if (gymError || !gym || gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Gym not found or access denied.' }, { status: 403 })
    }

    const patch: Record<string, unknown> = {
      payout_rail: rail,
      updated_at: new Date().toISOString(),
    }

    if (rail === 'wise') {
      if (currencyRaw !== undefined) {
        patch.wise_recipient_currency = currencyRaw || null
        const prev = (gym as { wise_recipient_currency?: string | null }).wise_recipient_currency
        if (currencyRaw && prev && currencyRaw !== prev) {
          patch.wise_recipient_id = null
          patch.wise_payout_ready = false
        }
      }
    }

    if (rail === 'stripe_connect') {
      patch.wise_payout_ready = false
      patch.wise_recipient_id = null
      patch.wise_recipient_currency = null
    }

    const { error: updateError } = await supabase.from('gyms').update(patch).eq('id', gymId).eq('owner_id', userId)

    if (updateError) {
      console.error('[payout-settings]', updateError)
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, payout_rail: rail })
  } catch (e) {
    console.error('[payout-settings]', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
