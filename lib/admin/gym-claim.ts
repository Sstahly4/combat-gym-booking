/**
 * Gym claim helpers — admin-issued, regeneratable claim links that let a real
 * owner take over a gym account that the platform pre-created on their behalf.
 * Links remain valid until the owner sets their password (or the token expires).
 *
 * URL shape: https://combatstay.com/claim/<22-char-code>
 * Token is 16 random bytes as base64url (no padding). We store SHA-256 of the
 * token, never the plaintext. The plaintext is only shown to the admin once at
 * generation time.
 *
 * Legacy 64-char hex tokens still redeem: they were always lowercase, and hashing
 * still trims without case-folding so those hashes match.
 *
 * Helpers in this file are pure (no Supabase) so they can be unit-tested.
 */
import { createHash, randomBytes } from 'crypto'
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

export { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

/** 16 bytes → ~22-char base64url; ~128 bits of entropy. */
export const CLAIM_TOKEN_BYTES = 16
export const CLAIM_TOKEN_DEFAULT_EXPIRY_DAYS = 14

export function generateClaimTokenPlain(): string {
  return randomBytes(CLAIM_TOKEN_BYTES).toString('base64url')
}

export function hashClaimToken(plain: string): string {
  // base64url is case-sensitive. Legacy hex tokens are already lowercase in URLs.
  const normalised = plain.trim()
  const pepper = process.env.CLAIM_TOKEN_PEPPER ?? ''
  return createHash('sha256').update(`${pepper}:${normalised}`).digest('hex')
}

/**
 * Resolve the token hash for lookup. Tries the trimmed token first, then a
 * lowercase variant so older hex claim links (hashed with toLowerCase) still work
 * if a client mangled casing.
 */
export function hashClaimTokenCandidates(plain: string): string[] {
  const trimmed = plain.trim()
  const lower = trimmed.toLowerCase()
  const primary = hashClaimToken(trimmed)
  if (lower === trimmed) return [primary]
  const secondary = createHash('sha256')
    .update(`${process.env.CLAIM_TOKEN_PEPPER ?? ''}:${lower}`)
    .digest('hex')
  return primary === secondary ? [primary] : [primary, secondary]
}

export function buildClaimUrl(appUrl: string, plain: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/claim/${plain}`
}

/**
 * Build a deterministic placeholder email for a pre-listed gym so the
 * synthetic auth user has a stable, valid-looking address.
 */
export function buildPlaceholderEmail(gymId: string): string {
  return `claim+${gymId}@${PLACEHOLDER_EMAIL_DOMAIN}`
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`)
}

/** Generate a long random throwaway password for the synthetic auth user. */
export function generatePlaceholderPassword(): string {
  return randomBytes(24).toString('base64url')
}

export function expiryDaysFromNowIso(days = CLAIM_TOKEN_DEFAULT_EXPIRY_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}
