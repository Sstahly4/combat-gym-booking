const CODE_PATTERN = /^[a-z0-9]{1,20}$/

export function normalizeAffiliateCode(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidAffiliateCode(code: string): boolean {
  return CODE_PATTERN.test(code)
}

export function affiliateCodeValidationError(code: string): string | null {
  const normalized = normalizeAffiliateCode(code)
  if (!normalized) return 'Referral code is required'
  if (normalized.length > 20) return 'Code must be 20 characters or fewer'
  if (!CODE_PATTERN.test(normalized)) {
    return 'Use lowercase letters and numbers only — no spaces or symbols'
  }
  return null
}

/** Generate a slug from a person's name when they have no preference. */
export function generateAffiliateCodeFromName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20)
  return base || `partner${Math.floor(1000 + Math.random() * 9000)}`
}
