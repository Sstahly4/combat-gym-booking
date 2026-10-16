/**
 * Owner login-link helpers — OTA-style deep links in partner emails that sign
 * an existing gym owner into Partner Hub and land them on a specific page
 * (usually bookings). Pure helpers (no Supabase) for unit tests.
 *
 * Plaintext tokens are 32 bytes hex (64 chars). We store SHA-256 of the token
 * with a namespaced pepper; plaintext only appears in the emailed URL.
 */
import { createHash, randomBytes } from 'crypto'

export const OWNER_LOGIN_TOKEN_BYTES = 32
/** How long a booking-alert login link stays clickable (multi-use until then). */
export const OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS = 7

const MANAGE_PREFIX = '/manage'

export function generateOwnerLoginTokenPlain(): string {
  return randomBytes(OWNER_LOGIN_TOKEN_BYTES).toString('hex')
}

function ownerLoginPepper(): string {
  return (
    process.env.OWNER_LOGIN_TOKEN_PEPPER ||
    process.env.CLAIM_TOKEN_PEPPER ||
    ''
  )
}

export function hashOwnerLoginToken(plain: string): string {
  const normalised = plain.trim().toLowerCase()
  return createHash('sha256')
    .update(`owner-login:${ownerLoginPepper()}:${normalised}`)
    .digest('hex')
}

export function buildOwnerLoginUrl(appUrl: string, plain: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/ol/${plain}`
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
 * Mark the destination so Partner Hub waits for cookie hydration after /ol
 * (same race as claim links → /manage?claimed=1).
 */
export function withOwnerLoginHydrationFlag(path: string): string {
  const safe = sanitizeOwnerLoginRedirectPath(path)
  const q = safe.includes('?') ? '&' : '?'
  if (/[?&]ol=1(?:&|$)/.test(safe)) return safe
  return `${safe}${q}ol=1`
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
