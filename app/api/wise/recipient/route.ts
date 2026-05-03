export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { WiseConfigError } from '@/lib/wise/wise-config'
import { WiseApiError } from '@/lib/wise/wise-http'
import { pickBusinessProfileId, wiseListProfiles } from '@/lib/wise/wise-profiles'
import { wiseCreateEmailRecipient } from '@/lib/wise/wise-recipient'

type Body = {
  gym_id?: string
  currency?: string
  account_holder_name?: string
  email?: string
  wise_profile_id?: number
}

/**
 * Create Wise email recipient and persist on gym (owner-only).
 */
export async function POST(request: NextRequest) {
  try {
    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as Body
    const gymId = typeof body.gym_id === 'string' ? body.gym_id.trim() : ''
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : ''
    const accountHolderName =
      typeof body.account_holder_name === 'string' ? body.account_holder_name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const overrideProfileId =
      typeof body.wise_profile_id === 'number' && Number.isFinite(body.wise_profile_id)
        ? body.wise_profile_id
        : null

    if (!gymId || !currency || !accountHolderName || !email) {
      return NextResponse.json(
        { error: 'gym_id, currency, account_holder_name, and email are required.' },
        { status: 400 }
      )
    }

    const { supabase, userId } = access
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, owner_id, payout_rail')
      .eq('id', gymId)
      .maybeSingle()

    if (gymError || !gym || gym.owner_id !== userId) {
      return NextResponse.json({ error: 'Gym not found or access denied.' }, { status: 403 })
    }

    if (gym.payout_rail !== 'wise') {
      return NextResponse.json({ error: 'Gym payout rail is not set to Wise.' }, { status: 409 })
    }

    let profileId = overrideProfileId
    if (profileId == null) {
      const profiles = await wiseListProfiles()
      profileId = pickBusinessProfileId(profiles)
    }
    if (profileId == null) {
      return NextResponse.json({ error: 'No Wise profile found for this token.' }, { status: 502 })
    }

    const created = await wiseCreateEmailRecipient({
      profileId,
      currency,
      accountHolderName,
      email,
    })

    const { error: updateError } = await supabase
      .from('gyms')
      .update({
        wise_recipient_id: String(created.id),
        wise_recipient_currency: currency,
        wise_payout_ready: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gymId)
      .eq('owner_id', userId)

    if (updateError) {
      console.error('[wise/recipient] gym update', updateError)
      return NextResponse.json({ error: 'Failed to save recipient on gym.' }, { status: 500 })
    }

    return NextResponse.json({
      wise_recipient_id: created.id,
      wise_recipient_currency: currency,
      wise_payout_ready: true,
    })
  } catch (e) {
    if (e instanceof WiseConfigError) {
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    if (e instanceof WiseApiError) {
      return NextResponse.json(
        { error: e.message, wise_status: e.status, details: e.body.slice(0, 2000) },
        { status: 502 }
      )
    }
    console.error('[wise/recipient]', e)
    return NextResponse.json({ error: 'Recipient creation failed.' }, { status: 500 })
  }
}
