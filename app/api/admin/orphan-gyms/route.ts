/**
 * Admin: list pre-listed (orphan) gyms whose owner is still a synthetic
 * placeholder account, with the latest claim-token state for each.
 *
 * "Orphan" here = a gym whose `owner_id` profile has `placeholder_account = true`
 * (i.e. nobody has finished the claim flow for it yet). Once the owner sets
 * their password, claim_password_set flips true; once they update their email,
 * placeholder_account flips false.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()

  // Pull placeholder-owner profiles first; one query keeps this snappy even
  // for a few hundred orphans.
  const { data: placeholders, error: profErr } = await admin
    .from('profiles')
    .select('id, placeholder_email, claim_password_set, placeholder_account')
    .eq('placeholder_account', true)

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 })
  }

  const ownerIds = (placeholders ?? []).map((p) => p.id)
  if (ownerIds.length === 0) {
    return NextResponse.json({ gyms: [] })
  }

  const { data: gyms, error: gymsErr } = await admin
    .from('gyms')
    .select('id, name, city, country, owner_id, created_at, is_live, status')
    .in('owner_id', ownerIds)
    .order('created_at', { ascending: false })

  if (gymsErr) {
    return NextResponse.json({ error: gymsErr.message }, { status: 500 })
  }

  const gymIds = (gyms ?? []).map((g) => g.id)
  const { data: tokens } = gymIds.length
    ? await admin
        .from('gym_claim_tokens')
        .select('gym_id, expires_at, claimed_at, revoked_at, created_at')
        .in('gym_id', gymIds)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const latestByGym = new Map<string, any>()
  for (const t of tokens ?? []) {
    if (!latestByGym.has(t.gym_id)) latestByGym.set(t.gym_id, t)
  }
  const profileById = new Map(placeholders!.map((p) => [p.id, p]))

  const now = Date.now()
  const result = (gyms ?? []).map((g) => {
    const tok = latestByGym.get(g.id)
    const prof = profileById.get(g.owner_id)
    const expiresAt = tok?.expires_at ?? null
    const expired = expiresAt ? new Date(expiresAt).getTime() <= now : false
    const active =
      Boolean(tok) && !tok.claimed_at && !tok.revoked_at && !expired
    return {
      gym_id: g.id,
      gym_name: g.name,
      city: g.city,
      country: g.country,
      created_at: g.created_at,
      is_live: g.is_live,
      status: g.status,
      placeholder_owner_id: g.owner_id,
      placeholder_email: prof?.placeholder_email ?? null,
      claim_password_set: prof?.claim_password_set ?? false,
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
  })

  return NextResponse.json({ gyms: result })
}
