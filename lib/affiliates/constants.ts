export const AFFILIATE_REF_COOKIE = 'cs_ref'
export const AFFILIATE_REF_COOKIE_MAX_AGE_DAYS = 30
export const AFFILIATE_REF_COOKIE_MAX_AGE_SECONDS = AFFILIATE_REF_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60

export const AFFILIATE_APPROVAL_DAYS = 14
export const AFFILIATE_MIN_PAYOUT_AUD = 20

export const AFFILIATE_TIER_COMMISSION = {
  founding: 0.4,
  standard: 0.3,
} as const

export const PLATFORM_COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || '0.15'
)
