import { describe, expect, it } from 'vitest'
import {
  dropInSessionFromTrainingAccess,
  dropInSessionLabel,
  isDropInPackage,
  trainingAccessFromDropInSession,
  validateDropInBookingDates,
} from '@/lib/packages/drop-in'

describe('isDropInPackage', () => {
  it('identifies drop-in offer type', () => {
    expect(isDropInPackage({ offer_type: 'TYPE_DROP_IN' })).toBe(true)
    expect(isDropInPackage({ offer_type: 'TYPE_TRAINING_ONLY' })).toBe(false)
  })
})

describe('drop-in session mapping', () => {
  it('maps training_access to session labels', () => {
    expect(dropInSessionFromTrainingAccess('once_daily')).toBe('single')
    expect(dropInSessionFromTrainingAccess('twice_daily')).toBe('double')
    expect(dropInSessionLabel('single')).toBe('Single Session')
    expect(trainingAccessFromDropInSession('double')).toBe('twice_daily')
  })
})

describe('validateDropInBookingDates', () => {
  it('requires same-day dates for drop-ins', () => {
    expect(
      validateDropInBookingDates('TYPE_DROP_IN', '2026-06-22', '2026-06-22')
    ).toBeNull()
    expect(
      validateDropInBookingDates('TYPE_DROP_IN', '2026-06-22', '2026-06-23')
    ).toContain('single visit day')
    expect(
      validateDropInBookingDates('TYPE_TRAINING_ONLY', '2026-06-22', '2026-06-23')
    ).toBeNull()
  })
})
