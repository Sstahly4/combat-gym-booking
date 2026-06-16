import { describe, expect, it } from 'vitest'
import {
  calendarDatesForStay,
  computeBookingPriceWithSeasons,
} from '@/lib/booking/resolve-seasonal-prices'
import type { PackageSeasonalRate } from '@/lib/types/database'

describe('calendarDatesForStay', () => {
  it('uses nights only for accommodation stays', () => {
    expect(calendarDatesForStay('2026-06-01', '2026-06-11', false)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06',
      '2026-06-07',
      '2026-06-08',
      '2026-06-09',
      '2026-06-10',
    ])
  })

  it('includes checkout day for training stays', () => {
    expect(calendarDatesForStay('2026-06-01', '2026-06-04', true)).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
    ])
  })
})

describe('computeBookingPriceWithSeasons', () => {
  const basePackage = {
    id: 'pkg-1',
    type: 'accommodation' as const,
    price_per_day: 100,
    price_per_week: 600,
    price_per_month: null,
  }

  it('blends low and high daily seasons then applies waterfall', () => {
    const seasons: PackageSeasonalRate[] = [
      {
        id: 's1',
        package_id: 'pkg-1',
        variant_id: null,
        name: 'Low',
        start_date: '2026-06-01',
        end_date: '2026-06-04',
        price_per_day: 80,
        price_per_week: 500,
        price_per_month: null,
        created_at: '',
        updated_at: '',
      },
      {
        id: 's2',
        package_id: 'pkg-1',
        variant_id: null,
        name: 'High',
        start_date: '2026-06-05',
        end_date: '2026-06-10',
        price_per_day: 120,
        price_per_week: 700,
        price_per_month: null,
        created_at: '',
        updated_at: '',
      },
    ]

    const result = computeBookingPriceWithSeasons(
      '2026-06-01',
      '2026-06-11',
      basePackage,
      seasons
    )

    expect(result).not.toBeNull()
    // Blended daily: (4×80 + 6×120) / 10 = 104
    // Blended weekly: (4×500 + 6×700) / 10 = 620 → 1 week + 3 nights = 620 + 312 = 932
    expect(result!.price).toBe(932)
  })

  it('falls back to base package rates when no season matches a day', () => {
    const result = computeBookingPriceWithSeasons(
      '2026-06-01',
      '2026-06-08',
      basePackage,
      []
    )
    expect(result).not.toBeNull()
    expect(result!.price).toBe(600)
  })
})
