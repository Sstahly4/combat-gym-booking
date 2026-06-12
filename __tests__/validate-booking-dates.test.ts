import { describe, expect, it } from 'vitest'
import { isBookingStartDateInPast } from '@/lib/booking/validate-booking-dates'

describe('isBookingStartDateInPast', () => {
  const now = new Date(2026, 5, 12, 15, 30, 0) // 12 Jun 2026 local

  it('returns false for today', () => {
    expect(isBookingStartDateInPast('2026-06-12', now)).toBe(false)
  })

  it('returns false for a future check-in', () => {
    expect(isBookingStartDateInPast('2026-06-20', now)).toBe(false)
  })

  it('returns true for yesterday', () => {
    expect(isBookingStartDateInPast('2026-06-11', now)).toBe(true)
  })

  it('returns true for dates far in the past', () => {
    expect(isBookingStartDateInPast('2025-01-01', now)).toBe(true)
  })
})
