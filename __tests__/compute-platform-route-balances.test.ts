import { describe, expect, it } from 'vitest'
import { computePlatformRouteBalances } from '@/lib/manage/compute-platform-route-balances'

describe('computePlatformRouteBalances', () => {
  it('classifies upcoming vs ready using check-in + 3 business days', () => {
    const earlier = (id: string, day: string) => ({
      id,
      status: 'paid',
      start_date: '2026-05-01',
      end_date: '2026-05-08',
      created_at: `${day}T00:00:00.000Z`,
      payment_captured_at: `${day}T01:00:00.000Z`,
      platform_paid_out_at: '2026-05-10T00:00:00.000Z',
      total_price: 100,
      platform_fee: 15,
      guest_name: 'Past',
      discipline: null,
      platform_payout_id: null,
    })
    const bookings = [
      earlier('e1', '2026-04-01'),
      earlier('e2', '2026-04-02'),
      earlier('e3', '2026-04-03'),
      {
        id: 'b4',
        status: 'paid',
        start_date: '2026-06-01',
        end_date: '2026-06-08',
        created_at: '2026-05-01T00:00:00.000Z',
        payment_captured_at: '2026-05-02T00:00:00.000Z',
        platform_paid_out_at: null,
        total_price: 1000,
        platform_fee: 150,
        guest_name: 'Guest',
        discipline: 'Muay Thai',
        platform_payout_id: null,
      },
    ]
    const before = computePlatformRouteBalances(bookings, [], new Date('2026-06-03T12:00:00.000Z'))
    expect(before.upcomingNet).toBe(850)
    expect(before.unpaidEarnedNet).toBe(0)

    const after = computePlatformRouteBalances(bookings, [], new Date('2026-06-04T12:00:00.000Z'))
    expect(after.upcomingNet).toBe(0)
    expect(after.unpaidEarnedNet).toBe(850)
  })
})
