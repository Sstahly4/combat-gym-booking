import { describe, expect, it } from 'vitest'
import {
  bookingOccupiedDates,
  dropInSpotsLeft,
  isDropInDateSoldOut,
} from '@/lib/packages/drop-in-capacity'

describe('bookingOccupiedDates', () => {
  it('counts same-day visits as one spot', () => {
    expect(bookingOccupiedDates('2026-06-22', '2026-06-22')).toEqual(['2026-06-22'])
  })

  it('counts multi-day stays across inclusive visit days', () => {
    expect(bookingOccupiedDates('2026-06-01', '2026-06-08')).toEqual([
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06',
      '2026-06-07',
    ])
  })
})

describe('drop-in capacity helpers', () => {
  it('treats null capacity as unlimited', () => {
    expect(isDropInDateSoldOut(null, 99)).toBe(false)
    expect(dropInSpotsLeft(null, 5)).toBeNull()
  })

  it('marks sold out when booked meets cap', () => {
    expect(isDropInDateSoldOut(10, 10)).toBe(true)
    expect(isDropInDateSoldOut(10, 9)).toBe(false)
    expect(dropInSpotsLeft(10, 9)).toBe(1)
  })
})
