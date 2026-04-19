import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'

countries.registerLocale(enLocale)

/**
 * Non-standard labels used in our UI that are not valid English country names for i18n-iso-countries.
 */
const EXTRA_ALIASES: Record<string, string> = {
  bali: 'ID',
  usa: 'US',
  uk: 'GB',
  'korea, south': 'KR',
  'south korea': 'KR',
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Maps gym `country` strings (UI labels) to ISO 3166-1 alpha-2 for Stripe Connect Express.
 */
export function gymCountryToStripeIso2(gymCountry: string | null | undefined): string | null {
  if (!gymCountry?.trim()) return null
  const raw = gymCountry.trim()
  const lower = normalizeKey(raw)

  const alias = EXTRA_ALIASES[lower]
  if (alias) return alias

  const fromLib = countries.getAlpha2Code(raw, 'en')
  if (fromLib) return fromLib

  for (const { code, name } of RESIDENCE_COUNTRIES) {
    if (code === 'OTHER') continue
    if (normalizeKey(name) === lower) return code
  }

  if (/^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase()
  }

  return null
}

/** When gym country is missing or unmapped — Thailand matches primary market. */
export const DEFAULT_STRIPE_CONNECT_COUNTRY = 'TH'
