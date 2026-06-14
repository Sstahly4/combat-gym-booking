const COMBATSTAY_HOST = 'combatstay.com'

/** Canonical https origin for referral links (no www). */
export function affiliateReferralOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
      : `https://${COMBATSTAY_HOST}`)

  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    if (u.hostname === `www.${COMBATSTAY_HOST}` || u.hostname.startsWith('www.')) {
      u.hostname = u.hostname.replace(/^www\./, '')
    }
    return u.origin
  } catch {
    return `https://${COMBATSTAY_HOST}`
  }
}

export function affiliateReferralUrl(code: string): string {
  return `${affiliateReferralOrigin()}/ref/${encodeURIComponent(code)}`
}

/** Bio-friendly share string, e.g. combatstay.com/ref/username (no protocol). */
export function affiliateReferralShareUrl(code: string): string {
  return toAffiliateReferralShareText(affiliateReferralUrl(code))
}

/** Normalize any referral URL for display/copy in bios. */
export function toAffiliateReferralShareText(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.replace(/\/$/, '') || u.pathname
    return `${host}${path}${u.search}`
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }
}
