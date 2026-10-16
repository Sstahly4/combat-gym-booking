/**
 * Owner login-link helpers — OTA-style deep links in partner emails / admin
 * handoff that sign an existing gym owner into Partner Hub.
 *
 * URL shape (industry-short): https://combatstay.com/go/<22-char-code>
 * Token is 16 random bytes as base64url (no padding). We store SHA-256 of the
 * token with a namespaced pepper; plaintext only appears in the shared URL.
 */
import { createHash, randomBytes } from 'crypto'

/** 16 bytes → 22-char base64url; ~128 bits of entropy. */
export const OWNER_LOGIN_TOKEN_BYTES = 16
/** How long a login link stays clickable (multi-use until then). */
export const OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS = 7

const MANAGE_PREFIX = '/manage'

export function generateOwnerLoginTokenPlain(): string {
  return randomBytes(OWNER_LOGIN_TOKEN_BYTES).toString('base64url')
}

function ownerLoginPepper(): string {
  return (
    process.env.OWNER_LOGIN_TOKEN_PEPPER ||
    process.env.CLAIM_TOKEN_PEPPER ||
    ''
  )
}

export function hashOwnerLoginToken(plain: string): string {
  // base64url is case-sensitive — only trim whitespace.
  const normalised = plain.trim()
  return createHash('sha256')
    .update(`owner-login:${ownerLoginPepper()}:${normalised}`)
    .digest('hex')
}

export function buildOwnerLoginUrl(appUrl: string, plain: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/go/${plain}`
}

export function expiryDaysFromNowIso(days = OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Only allow in-app Partner Hub destinations. Reject protocol-relative or
 * absolute URLs so a minted token cannot open an external site after sign-in.
 */
export function sanitizeOwnerLoginRedirectPath(path: string | null | undefined): string {
  const fallback = '/manage/bookings'
  if (!path || typeof path !== 'string') return fallback
  const trimmed = path.trim()
  if (!trimmed.startsWith(MANAGE_PREFIX)) return fallback
  if (trimmed.startsWith('//')) return fallback
  if (trimmed.includes('://')) return fallback
  if (trimmed.includes('\\') || trimmed.includes('\n') || trimmed.includes('\r')) return fallback
  return trimmed
}

/**
 * Mark the destination so Partner Hub waits for cookie hydration after /go
 * (same race as claim links → /manage?claimed=1).
 */
export function withOwnerLoginHydrationFlag(path: string): string {
  const safe = sanitizeOwnerLoginRedirectPath(path)
  const q = safe.includes('?') ? '&' : '?'
  if (/[?&]go=1(?:&|$)/.test(safe)) return safe
  return `${safe}${q}go=1`
}

export function isOwnerLoginTokenPepperConfigured(): boolean {
  return ownerLoginPepper().length >= 32
}

export function isOwnerLoginProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  )
}

export const OWNER_LOGIN_TOKEN_PEPPER_HELP =
  'Set OWNER_LOGIN_TOKEN_PEPPER or CLAIM_TOKEN_PEPPER to a random string of at least 32 characters. Do not rotate after issuing links — that invalidates outstanding owner login URLs.'
