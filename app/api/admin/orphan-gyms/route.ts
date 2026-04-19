/**
 * Admin: list pre-listed (orphan) gyms — anything still waiting to be claimed
 * by a real owner.
 *
 * Two cases are surfaced:
 *
 *  1. `state = 'placeholder'` — gym already transferred to a synthetic
 *     placeholder Supabase user (the admin generated a claim link previously).
 *     Resolved by `profiles.placeholder_account = true`.
 *
 *  2. `state = 'pre_listed'` — admin pre-created the gym while logged in as
 *     themselves and explicitly flagged `gyms.is_pre_listed = true`. No
 *     placeholder user has been minted yet; the first claim-link generation
 *     will mint one and reassign ownership.
 *
 * Internal/test gyms owned by the admin without the `is_pre_listed` flag are
 * intentionally omitted so they don't pollute the handoff workflow.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

type OrphanState = 'placeholder' | 'pre_listed'

interface OrphanGymRow {
  gym_id: string
  gym_name: string | null
  city: string | null
  country: string | null
  created_at: string
  is_live: boolean
  status: string
  state: OrphanState
  placeholder_owner_id: string
  placeholder_email: string | null
  claim_password_set: boolean
  is_pre_listed: boolean
  latest_token: {
    expires_at: string
    claimed_at: string | null
    revoked_at: string | null
    created_at: string
    expired: boolean
    active: boolean
  } | null
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()

  // ---- 1. Placeholder-owned gyms (already transferred). ------------------------
  const { data: placeholders, error: profErr } = await admin
    .from('profiles')
    .select('id, placeholder_email, claim_password_set, placeholder_account')
    .eq('placeholder_account', true)
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  }

  const placeholderIds = (placeholders ?? []).map((p) => p.id)
  const { data: placeholderGyms } = placeholderIds.length
    ? await admin
        .from('gyms')
        .select('id, name, city, country, owner_id, created_at, is_live, status, is_pre_listed')
        .in('owner_id', placeholderIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  // ---- 2. Admin pre-listed gyms (awaiting first claim link). -------------------
  const { data: adminProfiles, error: adminProfErr } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
  if (adminProfErr) {
    return NextResponse.json({ error: adminProfErr.message }, { status: 500 })
  }
  const adminIds = (adminProfiles ?? []).map((p) => p.id)
  const { data: preListedGyms } = adminIds.length
    ? await admin
        .from('gyms')
        .select('id, name, city, country, owner_id, created_at, is_live, status, is_pre_listed')
        .in('owner_id', adminIds)
        .eq('is_pre_listed', true)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  // ---- 3. Latest token per gym (single query). ---------------------------------
  const allGymIds = [
    ...(placeholderGyms ?? []).map((g) => g.id),
    ...(preListedGyms ?? []).map((g) => g.id),
  ]
  const { data: tokens } = allGymIds.length
    ? await admin
        .from('gym_claim_tokens')
        .select('gym_id, expires_at, claimed_at, revoked_at, created_at')
        .in('gym_id', allGymIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const latestByGym = new Map<string, any>()
  for (const t of tokens ?? []) {
    if (!latestByGym.has(t.gym_id)) latestByGym.set(t.gym_id, t)
  }
  const placeholderById = new Map((placeholders ?? []).map((p) => [p.id, p]))

  const now = Date.now()
  const buildRow = (g: any, state: OrphanState): OrphanGymRow => {
    const tok = latestByGym.get(g.id)
    const prof = placeholderById.get(g.owner_id)
    const expiresAt = tok?.expires_at ?? null
    const expired = expiresAt ? new Date(expiresAt).getTime() <= now : false
    const active = Boolean(tok) && !tok.claimed_at && !tok.revoked_at && !expired
    return {
      gym_id: g.id,
      gym_name: g.name,
      city: g.city,
      country: g.country,
      created_at: g.created_at,
      is_live: g.is_live,
      status: g.status,
      state,
      placeholder_owner_id: g.owner_id,
      placeholder_email: prof?.placeholder_email ?? null,
      claim_password_set: prof?.claim_password_set ?? false,
      is_pre_listed: Boolean(g.is_pre_listed),
      latest_token: tok
        ? {
            expires_at: tok.expires_at,
            claimed_at: tok.claimed_at,
            revoked_at: tok.revoked_at,
            created_at: tok.created_at,
            expired,
            active,
          }
        : null,
    }
  }

  const result: OrphanGymRow[] = [
    ...(placeholderGyms ?? []).map((g) => buildRow(g, 'placeholder')),
    ...(preListedGyms ?? []).map((g) => buildRow(g, 'pre_listed')),
  ]

  return NextResponse.json({ gyms: result })
}
