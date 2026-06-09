/**
 * Stripe Klarna presentment currencies (charge currency on the PaymentIntent).
 * @see https://docs.stripe.com/payments/klarna
 */
export const KLARNA_PRESENTMENT_CURRENCIES = [
  'AUD',
  'CAD',
  'CHF',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'NOK',
  'NZD',
  'PLN',
  'RON',
  'SEK',
  'USD',
] as const

export type KlarnaPresentmentCurrency = (typeof KLARNA_PRESENTMENT_CURRENCIES)[number]

const KLARNA_CURRENCY_SET = new Set<string>(KLARNA_PRESENTMENT_CURRENCIES)

/** Klarna is only available when the gym's settlement/charge currency is supported. */
export function isKlarnaAvailableForCurrency(currency: string | null | undefined): boolean {
  if (!currency) return false
  return KLARNA_CURRENCY_SET.has(currency.trim().toUpperCase())
}
