/** ISO 4217 codes used across owner pricing, packages, and payout currency pickers. */
export const GYM_CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'THB', label: 'THB — Thai Baht' },
  { code: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'KRW', label: 'KRW — South Korean Won' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
  { code: 'VND', label: 'VND — Vietnamese Dong' },
]

export const GYM_CURRENCY_CODES = new Set(GYM_CURRENCY_OPTIONS.map((c) => c.code))

export function normalizeGymCurrency(code: string | null | undefined, fallback = 'THB'): string {
  const u = (code || '').trim().toUpperCase().slice(0, 3)
  return GYM_CURRENCY_CODES.has(u) ? u : fallback
}
