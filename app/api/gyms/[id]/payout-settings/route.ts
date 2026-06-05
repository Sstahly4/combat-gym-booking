export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'

type PatchBody = {
  payout_rail?: string
}

/**
 * Owner updates payout rail. Only stripe_connect is supported.
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

    if (rail !== 'stripe_connect') {
      return NextResponse.json({ error: 'payout_rail must be stripe_connect.' }, { status: 400 })
    }

    const { supabase, userId } = access
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id')
      .eq('id', gymId)
      .maybeSingle()

    if (gymError || !gym || gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Gym not found or access denied.' }, { status: 403 })
    }

    const { error: updateError } = await supabase
      .from('gyms')
      .update({ payout_rail: 'stripe_connect', updated_at: new Date().toISOString() })
      .eq('id', gymId)
      .eq('owner_id', userId)

    if (updateError) {
      console.error('[payout-settings]', updateError)
      return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, payout_rail: 'stripe_connect' })
  } catch (e) {
    console.error('[payout-settings]', e)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
