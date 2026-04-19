import type { Gym, Profile } from '@/lib/types/database'

/** Map country (ISO 3166-1 alpha-2 or common English name) → ISO 4217. Keys are uppercase, no diacritics. */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: 'AUD',
  AUSTRALIA: 'AUD',
  US: 'USD',
  USA: 'USD',
  'UNITED STATES': 'USD',
  'UNITED STATES OF AMERICA': 'USD',
  NZ: 'NZD',
  'NEW ZEALAND': 'NZD',
  GB: 'GBP',
  UK: 'GBP',
  'UNITED KINGDOM': 'GBP',
  'GREAT BRITAIN': 'GBP',
  CA: 'CAD',
  CANADA: 'CAD',
  IE: 'EUR',
  IRELAND: 'EUR',
  FR: 'EUR',
  FRANCE: 'EUR',
  DE: 'EUR',
  GERMANY: 'EUR',
  ES: 'EUR',
  SPAIN: 'EUR',
  IT: 'EUR',
  ITALY: 'EUR',
  NL: 'EUR',
  NETHERLANDS: 'EUR',
  BE: 'EUR',
  BELGIUM: 'EUR',
  AT: 'EUR',
  AUSTRIA: 'EUR',
  PT: 'EUR',
  PORTUGAL: 'EUR',
  FI: 'EUR',
  FINLAND: 'EUR',
  GR: 'EUR',
  GREECE: 'EUR',
  CH: 'CHF',
  SWITZERLAND: 'CHF',
  JP: 'JPY',
  JAPAN: 'JPY',
  KR: 'KRW',
  'SOUTH KOREA': 'KRW',
  SG: 'SGD',
  SINGAPORE: 'SGD',
  HK: 'HKD',
  'HONG KONG': 'HKD',
  IN: 'INR',
  INDIA: 'INR',
  BR: 'BRL',
  BRAZIL: 'BRL',
  MX: 'MXN',
  MEXICO: 'MXN',
  ZA: 'ZAR',
  'SOUTH AFRICA': 'ZAR',
  TH: 'THB',
  THAILAND: 'THB',
  MY: 'MYR',
  MALAYSIA: 'MYR',
  PH: 'PHP',
  PHILIPPINES: 'PHP',
  ID: 'IDR',
  INDONESIA: 'IDR',
  AE: 'AED',
  UAE: 'AED',
  'UNITED ARAB EMIRATES': 'AED',
  SA: 'SAR',
  'SAUDI ARABIA': 'SAR',
  SE: 'SEK',
  SWEDEN: 'SEK',
  NO: 'NOK',
  NORWAY: 'NOK',
  DK: 'DKK',
  DENMARK: 'DKK',
  PL: 'PLN',
  POLAND: 'PLN',
  CZ: 'CZK',
  'CZECH REPUBLIC': 'CZK',
  CZECHIA: 'CZK',
  CN: 'CNY',
  CHINA: 'CNY',
  TW: 'TWD',
  TAIWAN: 'TWD',
  AR: 'ARS',
  ARGENTINA: 'ARS',
  CL: 'CLP',
  CHILE: 'CLP',
  CO: 'COP',
  COLOMBIA: 'COP',
  IL: 'ILS',
  ISRAEL: 'ILS',
  TR: 'TRY',
  TURKEY: 'TRY',
  TÜRKIYE: 'TRY',
  RU: 'RUB',
  RUSSIA: 'RUB',
}

function normalizeCountryToken(raw: string | null | undefined): string | null {
  if (!raw) return null
  const t = raw
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return t || null
}

function currencyFromCountry(country: string | null | undefined): string | null {
  const key = normalizeCountryToken(country)
  if (!key) return null
  if (COUNTRY_TO_CURRENCY[key]) return COUNTRY_TO_CURRENCY[key]
  for (const word of key.split(' ')) {
    if (word && COUNTRY_TO_CURRENCY[word]) return COUNTRY_TO_CURRENCY[word]
  }
  return null
}

/**
 * Currency for owner dashboard: gym.currency if set, else infer from gym country, else profile country of residence, else USD.
 */
export function resolveOwnerCurrency(gym: Gym | undefined, profile: Profile | null | undefined): string {
  const fromGym = gym?.currency?.trim()
  if (fromGym) return fromGym.toUpperCase()
  const fromGymCountry = currencyFromCountry(gym?.country)
  if (fromGymCountry) return fromGymCountry
  const fromProfile = currencyFromCountry(profile?.country_of_residence ?? undefined)
  if (fromProfile) return fromProfile
  return 'USD'
}
