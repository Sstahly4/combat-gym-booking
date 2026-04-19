/**
 * Format money for owner dashboard using a locale that shows the expected symbol
 * (e.g. AUD → "A$0.00", USD → "US$0.00"; other codes use Intl with a fixed locale).
 */
const LOCALE_BY_CURRENCY: Record<string, string> = {
  AUD: 'en-AU',
  USD: 'en-US',
  GBP: 'en-GB',
  NZD: 'en-NZ',
  CAD: 'en-CA',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  SGD: 'en-SG',
  CHF: 'de-CH',
  HKD: 'en-HK',
  INR: 'en-IN',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ZAR: 'en-ZA',
  THB: 'th-TH',
  MYR: 'ms-MY',
  PHP: 'en-PH',
  IDR: 'id-ID',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  CZK: 'cs-CZ',
  CNY: 'zh-CN',
  TWD: 'zh-TW',
  ARS: 'es-AR',
  CLP: 'es-CL',
  COP: 'es-CO',
  ILS: 'he-IL',
  TRY: 'tr-TR',
  RUB: 'ru-RU',
}

const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])

function localeForCurrency(code: string): string {
  return LOCALE_BY_CURRENCY[code] ?? (code === 'AUD' ? 'en-AU' : code === 'NZD' ? 'en-NZ' : 'en-US')
}

/** Unambiguous $ variants (always show A$, US$, NZ$, CA$ regardless of browser locale). */
function explicitDollarString(code: string, amount: number, minF: number, maxF: number): string | null {
  const n = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minF,
    maximumFractionDigits: maxF,
  }).format(amount)
  if (code === 'AUD') return `A$${n}`
  if (code === 'USD') return `US$${n}`
  if (code === 'NZD') return `NZ$${n}`
  if (code === 'CAD') return `CA$${n}`
  return null
}

export function formatDashboardMoney(
  amount: number,
  currencyCode: string,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string {
  const code = (currencyCode || 'USD').toUpperCase()
  const defaultFrac = ZERO_DECIMAL.has(code) ? 0 : 2
  const minF = options.minimumFractionDigits ?? defaultFrac
  const maxF = options.maximumFractionDigits ?? defaultFrac
  const dollar = explicitDollarString(code, amount, minF, maxF)
  if (dollar) return dollar
  const locale = localeForCurrency(code)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minF,
      maximumFractionDigits: maxF,
    }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(maxF)}`
  }
}

/** Whole amounts omit “.00”; values with cents show up to 2 decimals (e.g. overview metric cards). */
export function formatDashboardMoneyCompact(amount: number, currencyCode: string): string {
  const code = (currencyCode || 'USD').toUpperCase()
  if (ZERO_DECIMAL.has(code)) {
    return formatDashboardMoney(amount, currencyCode, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }
  const minF = 0
  const maxF = 2
  const dollar = explicitDollarString(code, amount, minF, maxF)
  if (dollar) return dollar
  const locale = localeForCurrency(code)
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minF,
      maximumFractionDigits: maxF,
    }).format(amount)
  } catch {
    return `${code} ${amount}`
  }
}
