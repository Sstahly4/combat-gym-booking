import { describe, expect, it } from 'vitest'
import {
  offerTypeUsesTrainingAccess,
  offersOnceDailyTrainingChoice,
  trainingAccessInclusionLabel,
  trainingAccessCardLabel,
} from '@/lib/packages/training-access'

describe('offerTypeUsesTrainingAccess', () => {
  it('includes training packages', () => {
    expect(offerTypeUsesTrainingAccess('TYPE_TRAINING_ONLY')).toBe(true)
    expect(offerTypeUsesTrainingAccess('TYPE_ALL_INCLUSIVE')).toBe(true)
  })

  it('excludes one-time events', () => {
    expect(offerTypeUsesTrainingAccess('TYPE_ONE_TIME_EVENT')).toBe(false)
    expect(offerTypeUsesTrainingAccess('TYPE_DROP_IN')).toBe(false)
  })
})

describe('offersOnceDailyTrainingChoice', () => {
  const trainingPkg = { type: 'training' as const, offer_type: 'TYPE_TRAINING_ONLY' as const }

  it('is false when only one track is configured', () => {
    expect(offersOnceDailyTrainingChoice(trainingPkg, null)).toBe(false)
    expect(
      offersOnceDailyTrainingChoice(
        { ...trainingPkg, price_per_day: 2000 },
        null
      )
    ).toBe(false)
    expect(
      offersOnceDailyTrainingChoice(
        { ...trainingPkg, once_daily_price_per_day: 1500 },
        null
      )
    ).toBe(false)
  })

  it('is true when both twice-daily and once-daily tracks are configured', () => {
    expect(
      offersOnceDailyTrainingChoice(
        { ...trainingPkg, price_per_day: 2000, once_daily_price_per_day: 1500 },
        null
      )
    ).toBe(true)
    expect(
      offersOnceDailyTrainingChoice(trainingPkg, {
        price_per_day: 2000,
        once_daily_price_per_day: 1500,
      })
    ).toBe(true)
  })
})

describe('training access labels', () => {
  it('maps values to card and inclusion copy', () => {
    expect(trainingAccessCardLabel('twice_daily')).toBe('Twice Daily')
    expect(trainingAccessInclusionLabel('flexible_daily')).toContain('choose')
  })
})
