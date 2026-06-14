import { RESIDENCE_COUNTRIES } from '@/lib/constants/residence-countries'
import type { AffiliatePayoutMethod, AffiliatePayoutRegion } from '@/lib/types/database'

export const AUSTRALIA_COUNTRY = 'Australia'

/** Countries for affiliate payout intake — Australia first, then alphabetical. */
export const AFFILIATE_PAYOUT_COUNTRIES: string[] = [
  AUSTRALIA_COUNTRY,
  ...RESIDENCE_COUNTRIES.map((c) => c.name)
    .filter((name) => name !== AUSTRALIA_COUNTRY)
    .sort((a, b) => a.localeCompare(b)),
]

export function isAustraliaCountry(country: string): boolean {
  return country.trim().toLowerCase() === AUSTRALIA_COUNTRY.toLowerCase()
}

export function normalizeAffiliatePayoutRegion(value: unknown): AffiliatePayoutRegion {
  return value === 'international' ? 'international' : 'au'
}

export function regionFromCountry(country: string): AffiliatePayoutRegion {
  return isAustraliaCountry(country) ? 'au' : 'international'
}

/** Locked payout rail for each region — affiliates cannot choose on intake. */
export function payoutMethodForRegion(region: AffiliatePayoutRegion): AffiliatePayoutMethod {
  return region === 'au' ? 'bank' : 'paypal'
}

export function payoutMethodForCountry(country: string): AffiliatePayoutMethod {
  return payoutMethodForRegion(regionFromCountry(country))
}

export function payoutRailLabel(region: AffiliatePayoutRegion): string {
  return region === 'au' ? 'Bank transfer' : 'PayPal'
}

export function payoutRegionLabel(region: AffiliatePayoutRegion, country?: string | null): string {
  if (country) {
    return `${country} · ${payoutRailLabel(region)}`
  }
  return region === 'au' ? 'Australia (bank transfer)' : 'International (PayPal)'
}

export function intakePayoutDescription(country: string): string {
  return isAustraliaCountry(country)
    ? 'Australian bank account — payouts via direct transfer (Osko where supported).'
    : 'PayPal — enter the email on your PayPal account. Payouts are sent via PayPal.'
}

/** Extract PayPal email from stored payout details for admin display. */
export function extractPayPalEmail(payoutDetails: string): string | null {
  const match = payoutDetails.match(/^PayPal:\s*(.+)$/m)
  return match?.[1]?.trim() || null
}

export function isValidAffiliatePayoutCountry(country: string): boolean {
  const trimmed = country.trim()
  return AFFILIATE_PAYOUT_COUNTRIES.some((c) => c.toLowerCase() === trimmed.toLowerCase())
}
