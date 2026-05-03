export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getOwnerAccessContext } from '@/lib/auth/owner-guard'
import { WiseConfigError, isWiseSandboxDebugEnabled } from '@/lib/wise/wise-config'
import { WiseApiError } from '@/lib/wise/wise-http'
import { pickBusinessProfileId, wiseListProfiles, wiseListStandardBalances } from '@/lib/wise/wise-profiles'

/**
 * Smoke-test Wise token + list profiles/balances (sandbox-first).
 * Gated by WISE_SANDBOX_ROUTES_ENABLED=1 and owner session.
 */
export async function GET() {
  try {
    if (!isWiseSandboxDebugEnabled()) {
      return NextResponse.json({ error: 'Wise debug routes are disabled.' }, { status: 404 })
    }

    const access = await getOwnerAccessContext()
    if (access.status === 'no_user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (access.status !== 'ok') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const profiles = await wiseListProfiles()
    const profileId = pickBusinessProfileId(profiles)
    let balances: unknown = null
    if (profileId != null) {
      try {
        balances = await wiseListStandardBalances(profileId)
      } catch (e) {
        balances = { error: e instanceof Error ? e.message : 'balance_list_failed' }
      }
    }

    return NextResponse.json({
      profileCount: profiles.length,
      profiles: profiles.map((p) => ({ id: p.id, type: p.type })),
      selectedProfileId: profileId,
      balances,
    })
  } catch (e) {
    if (e instanceof WiseConfigError) {
      return NextResponse.json({ error: e.message }, { status: 503 })
    }
    if (e instanceof WiseApiError) {
      return NextResponse.json({ error: e.message, status: e.status }, { status: 502 })
    }
    console.error('[wise/debug]', e)
    return NextResponse.json({ error: 'Wise debug failed' }, { status: 500 })
  }
}
