import { describe, expect, it } from 'vitest'
import {
  toCanonicalBookingStatus,
  canonicalBookingStatusLabel,
} from '@/lib/bookings/status-normalization'

describe('toCanonicalBookingStatus', () => {
  it.each([
    ['pending', 'pending'],
    ['pending_payment', 'pending'],
    ['pending_confirmation', 'pending'],
    ['awaiting_approval', 'pending'],
    ['gym_confirmed', 'confirmed'],
    ['confirmed', 'confirmed'],
    ['paid', 'paid'],
    ['completed', 'completed'],
    ['declined', 'declined'],
    ['cancelled', 'cancelled'],
    ['something_unknown', 'pending'],
  ])('maps %s -> %s', (input, expected) => {
    expect(toCanonicalBookingStatus(input)).toBe(expected)
  })
})

describe('canonicalBookingStatusLabel', () => {
  it('returns human labels for each status', () => {
    expect(canonicalBookingStatusLabel('pending')).toBe('Pending')
    expect(canonicalBookingStatusLabel('confirmed')).toBe('Confirmed')
    expect(canonicalBookingStatusLabel('paid')).toBe('Paid')
    expect(canonicalBookingStatusLabel('completed')).toBe('Completed')
    expect(canonicalBookingStatusLabel('declined')).toBe('Declined')
    expect(canonicalBookingStatusLabel('cancelled')).toBe('Cancelled')
  })
})
