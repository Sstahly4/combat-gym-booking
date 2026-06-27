import type { Package } from '@/lib/types/database'

/** Package fields needed to derive the search “from” daily rate. */
export type PackageSearchPriceRow = {
  price_per_day?: number | null
  once_daily_price_per_day?: number | null
  currency?: string | null
  pricing_config?: Package['pricing_config']
  variants?: Array<{
    price_per_day?: number | null
    once_daily_price_per_day?: number | null
  }>
}

function addPositiveRate(rates: number[], value: unknown) {
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) rates.push(n)
}

/** All guest-facing daily rates on a package (twice-daily, once-daily, variants, pricing_config). */
export function collectPackageDailyRates(pkg: PackageSearchPriceRow): number[] {
  const rates: number[] = []

  addPositiveRate(rates, pkg.price_per_day)
  addPositiveRate(rates, pkg.once_daily_price_per_day)

  for (const variant of pkg.variants ?? []) {
    addPositiveRate(rates, variant.price_per_day)
    addPositiveRate(rates, variant.once_daily_price_per_day)
  }

  const pc = pkg.pricing_config
  if (pc?.mode === 'rate') {
    addPositiveRate(rates, pc.rates?.daily)
  } else if (pc?.mode === 'fixed') {
    for (const duration of pc.durations ?? []) {
      const days = Number(duration.days)
      const price = Number(duration.price)
      if (Number.isFinite(days) && days > 0 && Number.isFinite(price) && price > 0) {
        rates.push(price / days)
      }
    }
  }

  return rates
}

/** Lowest per-day rate across packages in the gym's listing currency — used for search “from” price. */
export function lowestSearchPricePerDay(
  packages: PackageSearchPriceRow[],
  gymCurrency: string,
): number | null {
  const currency = (gymCurrency || 'USD').toUpperCase()
  let min: number | null = null

  for (const pkg of packages) {
    if ((pkg.currency || 'USD').toUpperCase() !== currency) continue
    for (const rate of collectPackageDailyRates(pkg)) {
      min = min === null ? rate : Math.min(min, rate)
    }
  }

  return min
}

export function formatGymListingPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}
