import { describe, expect, it } from 'vitest'
import { computeBookingPriceFromDates } from '@/lib/booking/recalculate-booking-price'

describe('server booking price (computeBookingPriceFromDates)', () => {
  const accomPackage = {
    type: 'accommodation' as const,
    price_per_day: 100,
    price_per_week: 600,
    price_per_month: null,
  }

  it('computes 10-night stay as 1 week + 3 nights', () => {
    const result = computeBookingPriceFromDates('2026-06-01', '2026-06-11', accomPackage)
    expect(result).not.toBeNull()
    expect(result!.price).toBe(900)
    expect(result!.lines).toHaveLength(2)
  })

  it('returns null when checkout is not after checkin', () => {
    expect(computeBookingPriceFromDates('2026-06-10', '2026-06-10', accomPackage)).toBeNull()
  })

  it('rounds to two decimal places when used as verified total', () => {
    const pkg = {
      type: 'training' as const,
      price_per_day: 33.33,
      price_per_week: null,
      price_per_month: null,
    }
    const result = computeBookingPriceFromDates('2026-06-01', '2026-06-04', pkg)
    expect(result).not.toBeNull()
    const verified = Number(result!.price.toFixed(2))
    expect(verified).toBe(133.32)
  })
})
