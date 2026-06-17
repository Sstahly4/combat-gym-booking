import { describe, expect, it } from 'vitest'
import {
  addUtcBusinessDaysFromYmd,
  buildGymPaidBookingOrdinals,
  getPartnerPayoutEligibleAt,
  resolvePartnerPayoutEligibility,
} from '@/lib/manage/partner-payout-eligibility'

describe('addUtcBusinessDaysFromYmd', () => {
  it('adds 3 business days from Monday to Thursday UTC', () => {
    const result = addUtcBusinessDaysFromYmd('2026-06-01', 3) // Mon
    expect(result.toISOString()).toBe('2026-06-04T00:00:00.000Z') // Thu
  })

  it('skips weekends when adding business days from Friday', () => {
    const result = addUtcBusinessDaysFromYmd('2026-06-05', 3) // Fri
    expect(result.toISOString()).toBe('2026-06-10T00:00:00.000Z') // Wed
  })
})

describe('resolvePartnerPayoutEligibility', () => {
  const base = {
    id: 'b1',
    status: 'paid',
    start_date: '2026-06-01',
    end_date: '2026-06-08',
    created_at: '2026-05-01T10:00:00.000Z',
    payment_captured_at: '2026-05-02T10:00:00.000Z',
    platform_paid_out_at: null,
  }

  it('uses check-in anchor for 4th+ booking', () => {
    const eligibleAt = getPartnerPayoutEligibleAt(base, 4)
    expect(eligibleAt.toISOString()).toBe('2026-06-04T00:00:00.000Z')
  })

  it('uses checkout anchor for first 3 bookings', () => {
    const eligibleAt = getPartnerPayoutEligibleAt(base, 2)
    expect(eligibleAt.toISOString()).toBe('2026-06-11T00:00:00.000Z') // Thu after Mon Jun 8
  })

  it('is upcoming before eligible instant', () => {
    const result = resolvePartnerPayoutEligibility(base, {
      gymPaidBookingOrdinal: 4,
      now: new Date('2026-06-03T12:00:00.000Z'),
    })
    expect(result.reason).toBe('upcoming')
    expect(result.eligible).toBe(false)
  })

  it('is ready on or after eligible instant', () => {
    const result = resolvePartnerPayoutEligibility(base, {
      gymPaidBookingOrdinal: 4,
      now: new Date('2026-06-04T00:00:00.000Z'),
    })
    expect(result.reason).toBe('ready')
    expect(result.eligible).toBe(true)
    expect(result.schedule).toBe('standard')
  })

  it('marks paid_out bookings ineligible', () => {
    const result = resolvePartnerPayoutEligibility(
      { ...base, platform_paid_out_at: '2026-06-10T00:00:00.000Z' },
      { gymPaidBookingOrdinal: 1, now: new Date('2026-07-01T00:00:00.000Z') },
    )
    expect(result.reason).toBe('paid_out')
    expect(result.eligible).toBe(false)
  })
})

describe('buildGymPaidBookingOrdinals', () => {
  it('orders captured bookings by created_at', () => {
    const ordinals = buildGymPaidBookingOrdinals([
      {
        id: 'b2',
        status: 'paid',
        start_date: '2026-07-01',
        end_date: '2026-07-08',
        created_at: '2026-06-02T00:00:00.000Z',
        payment_captured_at: '2026-06-02T01:00:00.000Z',
      },
      {
        id: 'b1',
        status: 'paid',
        start_date: '2026-06-01',
        end_date: '2026-06-08',
        created_at: '2026-06-01T00:00:00.000Z',
        payment_captured_at: '2026-06-01T01:00:00.000Z',
      },
      {
        id: 'b3',
        status: 'pending',
        start_date: '2026-08-01',
        end_date: '2026-08-08',
        created_at: '2026-06-03T00:00:00.000Z',
      },
    ])
    expect(ordinals.get('b1')).toBe(1)
    expect(ordinals.get('b2')).toBe(2)
    expect(ordinals.has('b3')).toBe(false)
  })
})
