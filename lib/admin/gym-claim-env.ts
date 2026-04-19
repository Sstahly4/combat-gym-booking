/**
 * Production guardrails for gym claim tokens (migration 044).
 * Hashing uses CLAIM_TOKEN_PEPPER in lib/admin/gym-claim.ts — without a strong
 * pepper in production, issued links must not be generated or redeemed.
 */
const MIN_PEPPER_LEN = 32

export function isClaimProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  )
}

/** True when CLAIM_TOKEN_PEPPER is long enough to use for hashing. */
export function isClaimTokenPepperConfigured(): boolean {
  const p = process.env.CLAIM_TOKEN_PEPPER ?? ''
  return p.length >= MIN_PEPPER_LEN
}

export const CLAIM_TOKEN_PEPPER_HELP =
  'Set CLAIM_TOKEN_PEPPER to a random string of at least 32 characters in your hosting env (e.g. openssl rand -hex 32). Do not rotate after issuing links — that invalidates outstanding claim URLs.'
