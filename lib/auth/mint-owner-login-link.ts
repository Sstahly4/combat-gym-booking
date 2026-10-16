/**
 * Mint an owner login token and return the public URL for partner emails /
 * admin handoff. Best-effort: returns null on failure so callers can fall
 * back to a plain /manage/... link (owner signs in manually).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { APP_URL } from '@/lib/email-layout'
import {
  buildOwnerLoginUrl,
  expiryDaysFromNowIso,
  generateOwnerLoginTokenPlain,
  hashOwnerLoginToken,
  isOwnerLoginProduction,
  isOwnerLoginTokenPepperConfigured,
  OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS,
  OWNER_LOGIN_TOKEN_PEPPER_HELP,
  sanitizeOwnerLoginRedirectPath,
} from '@/lib/auth/owner-login-link'

export type MintOwnerLoginLinkInput = {
  userId: string
  redirectPath: string
  bookingId?: string | null
  purpose?: string
  expiryDays?: number
}

export type MintedOwnerLoginLink = {
  url: string
  expiresAt: string
}

export async function mintOwnerLoginLink(
  admin: SupabaseClient,
  input: MintOwnerLoginLinkInput,
): Promise<MintedOwnerLoginLink | null> {
  if (isOwnerLoginProduction() && !isOwnerLoginTokenPepperConfigured()) {
    console.error('[owner-login-link] mint blocked:', OWNER_LOGIN_TOKEN_PEPPER_HELP)
    return null
  }

  const redirectPath = sanitizeOwnerLoginRedirectPath(input.redirectPath)
  const plain = generateOwnerLoginTokenPlain()
  const tokenHash = hashOwnerLoginToken(plain)
  const expiresAt = expiryDaysFromNowIso(
    input.expiryDays ?? OWNER_LOGIN_TOKEN_DEFAULT_EXPIRY_DAYS,
  )

  const { error } = await admin.from('owner_login_tokens').insert({
    user_id: input.userId,
    token_hash: tokenHash,
    redirect_path: redirectPath,
    booking_id: input.bookingId ?? null,
    purpose: input.purpose ?? 'booking_alert',
    expires_at: expiresAt,
  })

  if (error) {
    console.warn('[owner-login-link] insert failed', error.message)
    return null
  }

  return {
    url: buildOwnerLoginUrl(APP_URL(), plain),
    expiresAt,
  }
}
