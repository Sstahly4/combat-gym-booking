/**
 * One-time affiliate payout intake links — same security model as gym claim tokens:
 * store SHA-256 hash only; plaintext shown to admin once at generation.
 */
import { createHash, randomBytes } from 'crypto'

export const AFFILIATE_INTAKE_TOKEN_BYTES = 32
export const AFFILIATE_INTAKE_DEFAULT_EXPIRY_DAYS = 14

export function generateAffiliateIntakeTokenPlain(): string {
  return randomBytes(AFFILIATE_INTAKE_TOKEN_BYTES).toString('hex')
}

export function hashAffiliateIntakeToken(plain: string): string {
  const normalised = plain.trim().toLowerCase()
  const pepper = process.env.AFFILIATE_INTAKE_PEPPER ?? process.env.CLAIM_TOKEN_PEPPER ?? ''
  return createHash('sha256').update(`affiliate-intake:${pepper}:${normalised}`).digest('hex')
}

export function buildAffiliateIntakeUrl(appUrl: string, plain: string): string {
  const base = appUrl.replace(/\/$/, '')
  return `${base}/affiliate/setup/${plain}`
}

export function affiliateIntakeExpiryDaysFromNowIso(days = AFFILIATE_INTAKE_DEFAULT_EXPIRY_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

export function formatAffiliatePayoutDetails(params: {
  payout_method: 'bank' | 'paypal'
  name: string
  country: string
  bsb?: string
  account_number?: string
  paypal_email?: string
}): string {
  const name = params.name.trim()
  const country = params.country.trim()
  if (params.payout_method === 'paypal') {
    const email = (params.paypal_email || '').trim().toLowerCase()
    return `Country: ${country}\nPayPal: ${email}\nAccount name: ${name}`
  }
  const bsb = (params.bsb || '').trim()
  const account = (params.account_number || '').trim()
  return `Country: ${country}\nAccount name: ${name}\nBSB: ${bsb}\nAccount: ${account}`
}

export function isAffiliateIntakePepperConfigured(): boolean {
  const pepper = process.env.AFFILIATE_INTAKE_PEPPER ?? process.env.CLAIM_TOKEN_PEPPER
  return Boolean(pepper && pepper.length >= 16)
}

export const AFFILIATE_INTAKE_PEPPER_HELP =
  'Set AFFILIATE_INTAKE_PEPPER (or CLAIM_TOKEN_PEPPER) to a long random secret for affiliate intake links.'
