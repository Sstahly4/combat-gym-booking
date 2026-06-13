import type { SupabaseClient } from '@supabase/supabase-js'
import {
  affiliateIntakeExpiryDaysFromNowIso,
  generateAffiliateIntakeTokenPlain,
  hashAffiliateIntakeToken,
} from '@/lib/affiliates/intake-token'

export type IntakeTokenValidation =
  | { ok: true; tokenId: string; affiliateId: string; affiliateName: string }
  | { ok: false; reason: 'not_found' | 'used' | 'revoked' | 'expired' }

export async function validateAffiliateIntakeToken(
  admin: SupabaseClient,
  plainToken: string
): Promise<IntakeTokenValidation> {
  const tokenHash = hashAffiliateIntakeToken(plainToken)

  const { data: row } = await admin
    .from('affiliate_intake_tokens')
    .select('id, affiliate_id, expires_at, completed_at, revoked_at, affiliate:affiliates(name)')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!row) return { ok: false, reason: 'not_found' }
  if (row.revoked_at) return { ok: false, reason: 'revoked' }
  if (row.completed_at) return { ok: false, reason: 'used' }
  if (new Date(row.expires_at) <= new Date()) return { ok: false, reason: 'expired' }

  const affiliate = row.affiliate as unknown as { name: string } | null
  return {
    ok: true,
    tokenId: row.id,
    affiliateId: row.affiliate_id,
    affiliateName: affiliate?.name || '',
  }
}

export async function revokeActiveAffiliateIntakeTokens(
  admin: SupabaseClient,
  affiliateId: string
) {
  const now = new Date().toISOString()
  await admin
    .from('affiliate_intake_tokens')
    .update({ revoked_at: now })
    .eq('affiliate_id', affiliateId)
    .is('completed_at', null)
    .is('revoked_at', null)
}

export async function createAffiliateIntakeToken(params: {
  admin: SupabaseClient
  affiliateId: string
  createdBy?: string | null
  expiresInDays?: number
}) {
  const { admin, affiliateId, createdBy, expiresInDays = 14 } = params
  await revokeActiveAffiliateIntakeTokens(admin, affiliateId)

  const plain = generateAffiliateIntakeTokenPlain()
  const tokenHash = hashAffiliateIntakeToken(plain)
  const expiresAt = affiliateIntakeExpiryDaysFromNowIso(expiresInDays)

  const { error } = await admin.from('affiliate_intake_tokens').insert({
    affiliate_id: affiliateId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: createdBy || null,
  })

  if (error) throw new Error(error.message)

  return { plain, expiresAt }
}
