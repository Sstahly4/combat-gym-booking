import { describe, expect, it } from 'vitest'
import {
  BOOKING_STATUS_CANCELLED_BY_GYM,
  BOOKING_STATUS_PAYMENT_FAILED,
  buildBookingStatusUpdate,
  isGymCancelledStatus,
  shouldApplyPaymentFailedStatus,
} from '@/lib/bookings/booking-lifecycle'

describe('shouldApplyPaymentFailedStatus', () => {
  it('allows funnel statuses', () => {
    expect(shouldApplyPaymentFailedStatus('pending')).toBe(true)
    expect(shouldApplyPaymentFailedStatus(BOOKING_STATUS_PAYMENT_FAILED)).toBe(true)
  })

  it('blocks active bookings', () => {
    expect(shouldApplyPaymentFailedStatus('confirmed')).toBe(false)
    expect(shouldApplyPaymentFailedStatus('paid')).toBe(false)
    expect(shouldApplyPaymentFailedStatus('completed')).toBe(false)
  })
})

describe('isGymCancelledStatus', () => {
  it('includes legacy declined and cancelled_by_gym', () => {
    expect(isGymCancelledStatus('declined')).toBe(true)
    expect(isGymCancelledStatus(BOOKING_STATUS_CANCELLED_BY_GYM)).toBe(true)
    expect(isGymCancelledStatus('cancelled_by_traveller')).toBe(false)
  })
})

describe('buildBookingStatusUpdate', () => {
  it('sets status and timestamps together', () => {
    const payload = buildBookingStatusUpdate(BOOKING_STATUS_PAYMENT_FAILED)
    expect(payload.status).toBe('payment_failed')
    expect(payload.status_updated_at).toBe(payload.updated_at)
  })
})
