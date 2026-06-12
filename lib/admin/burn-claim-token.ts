import type { SupabaseClient } from '@supabase/supabase-js'

export type BurnClaimTokenResult = {
  burned: boolean
  gymId: string | null
  tokenId: string | null
}

/**
 * Mark the owner's active claim token as consumed. Called only after the owner
 * sets their password — the link stays reusable until then (bounded by expires_at).
 */
export async function burnActiveClaimTokenForOwner(
  admin: SupabaseClient,
  ownerId: string,
): Promise<BurnClaimTokenResult> {
  const { data: gym, error: gymErr } = await admin
    .from('gyms')
    .select('id')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (gymErr || !gym?.id) {
    if (gymErr) console.warn('[burnClaimToken] gym lookup failed', gymErr)
    return { burned: false, gymId: null, tokenId: null }
  }

  const nowIso = new Date().toISOString()

  const { data: activeToken, error: tokenErr } = await admin
    .from('gym_claim_tokens')
    .select('id')
    .eq('gym_id', gym.id)
    .is('claimed_at', null)
    .is('revoked_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (tokenErr) {
    console.warn('[burnClaimToken] active token lookup failed', tokenErr)
    return { burned: false, gymId: gym.id, tokenId: null }
  }

  if (!activeToken?.id) {
    return { burned: false, gymId: gym.id, tokenId: null }
  }

  const { data: burned, error: burnErr } = await admin
    .from('gym_claim_tokens')
    .update({ claimed_at: nowIso })
    .eq('id', activeToken.id)
    .is('claimed_at', null)
    .select('id')
    .maybeSingle()

  if (burnErr) {
    console.warn('[burnClaimToken] update failed', burnErr)
    return { burned: false, gymId: gym.id, tokenId: activeToken.id }
  }

  return {
    burned: Boolean(burned?.id),
    gymId: gym.id,
    tokenId: burned?.id ?? null,
  }
}
