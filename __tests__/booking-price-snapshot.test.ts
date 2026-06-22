import { describe, expect, it } from 'vitest'
import { leadTimeDaysFromStart } from '@/lib/booking/booking-price-snapshot'

describe('booking price snapshot lead time', () => {
  it('counts whole days until check-in', () => {
    const asOf = new Date('2026-06-01T12:00:00Z')
    expect(leadTimeDaysFromStart('2026-06-10', asOf)).toBe(9)
    expect(leadTimeDaysFromStart('2026-06-01', asOf)).toBe(0)
  })
})
