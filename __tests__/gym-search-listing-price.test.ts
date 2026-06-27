import { describe, expect, it } from 'vitest'
import {
  collectPackageDailyRates,
  lowestSearchPricePerDay,
} from '@/lib/manage/gym-search-listing-price'

describe('gym-search-listing-price', () => {
  it('collects twice-daily and once-daily rates', () => {
    const rates = collectPackageDailyRates({
      price_per_day: 50,
      once_daily_price_per_day: 35,
      currency: 'USD',
    })
    expect(rates).toEqual(expect.arrayContaining([50, 35]))
  })

  it('picks the lowest rate across packages and tiers', () => {
    const lowest = lowestSearchPricePerDay(
      [
        { price_per_day: 60, once_daily_price_per_day: 40, currency: 'USD' },
        { price_per_day: 45, currency: 'USD' },
        { price_per_day: 10, currency: 'THB' },
      ],
      'USD',
    )
    expect(lowest).toBe(40)
  })

  it('derives daily rate from fixed pricing_config durations', () => {
    const rates = collectPackageDailyRates({
      currency: 'USD',
      pricing_config: {
        mode: 'fixed',
        durations: [
          { days: 7, price: 350 },
          { days: 14, price: 600 },
        ],
      },
    })
    expect(rates).toContain(50)
    expect(rates).toContain(42.857142857142854)
  })
})
