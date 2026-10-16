/**
 * Admin `generateLink()` returns the OTP hash either as `properties.hashed_token`
 * directly or only inside `action_link` query params (older / newer GoTrue
 * versions differ). Pull whichever is available so server-side `verifyOtp`
 * always has a token to verify.
 */
export function extractOtpHash(
  linkData: { properties?: Record<string, unknown> | null } | null | undefined,
): string | null {
  const p = linkData?.properties
  if (!p) return null
  const direct = p.hashed_token
  if (typeof direct === 'string' && direct.length > 0) return direct
  const actionLink = p.action_link
  if (typeof actionLink === 'string' && actionLink.length > 0) {
    try {
      const u = new URL(actionLink)
      const th = u.searchParams.get('token_hash') || u.searchParams.get('token')
      if (th) return th
    } catch {
      /* ignore */
    }
  }
  return null
}
