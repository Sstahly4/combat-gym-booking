import { describe, expect, it } from 'vitest'
import {
  dbStatusesForAdminFilter,
  isBookingStayActiveOrUpcoming,
  parseAdminBookingFilter,
  passesAdminBookingFilter,
} from '@/lib/bookings/admin-booking-filters'

describe('parseAdminBookingFilter', () => {
  it('defaults to live', () => {
    expect(parseAdminBookingFilter(null)).toBe('live')
    expect(parseAdminBookingFilter('nope')).toBe('live')
  })

  it('parses known filters', () => {
    expect(parseAdminBookingFilter('funnel')).toBe('funnel')
    expect(parseAdminBookingFilter('cancelled')).toBe('cancelled')
  })
})

describe('passesAdminBookingFilter', () => {
  const now = new Date('2026-06-15T12:00:00')

  it('live requires confirmed/paid and future or current stay', () => {
    expect(
      passesAdminBookingFilter(
        { status: 'confirmed', end_date: '2026-06-20' },
        'live',
        now,
      ),
    ).toBe(true)
    expect(
      passesAdminBookingFilter(
        { status: 'confirmed', end_date: '2026-06-10' },
        'live',
        now,
      ),
    ).toBe(false)
    expect(
      passesAdminBookingFilter({ status: 'pending', end_date: '2026-06-20' }, 'live', now),
    ).toBe(false)
  })

  it('funnel includes pending and granular checkout statuses', () => {
    expect(
      passesAdminBookingFilter({ status: 'abandoned', end_date: '2026-06-20' }, 'funnel', now),
    ).toBe(true)
    expect(dbStatusesForAdminFilter('funnel')).toContain('payment_failed')
  })
})

describe('isBookingStayActiveOrUpcoming', () => {
  it('is true when end date is today or later', () => {
    const now = new Date('2026-06-15T12:00:00')
    expect(isBookingStayActiveOrUpcoming('2026-06-15', now)).toBe(true)
    expect(isBookingStayActiveOrUpcoming('2026-06-14', now)).toBe(false)
  })
})
