/**
 * Gym claim helpers — admin-issued, regeneratable claim links that let a real
 * owner take over a gym account that the platform pre-created on their behalf.
 *
 * Plaintext tokens are 32 bytes hex (64 chars). We store SHA-256 of the token,
 * never the plaintext. The plaintext is only shown to the admin once at
 * generation time.
 *
 * Helpers in this file are pure (no Supabase) so they can be unit-tested.
 */
import { createHash, randomBytes } from 'crypto'
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

export { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/admin/gym-claim-constants'

export const CLAIM_TOKEN_BYTES = 32
export const CLAIM_TOKEN_DEFAULT_EXPIRY_DAYS = 14

export function generateClaimTokenPlain(): string {
  return randomBytes(CLAIM_TOKEN_BYTES).toString('hex')
}

export function hashClaimToken(plain: string): string {
  const normalised = plain.trim().toLowerCase()
  const pepper = process.env.CLAIM_TOKEN_PEPPER ?? ''
  return createHash('sha256').update(`${pepper}:${normalised}`).digest('hex')
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
