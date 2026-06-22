import { describe, expect, it } from 'vitest'
import {
  offerTypeUsesTrainingAccess,
  offersOnceDailyTrainingChoice,
  getTravelerTrainingTierOptions,
  travelerCanChooseTrainingSession,
  resolveEffectiveTrainingTier,
  travelerSessionCardLabel,
  travelerSessionLabel,
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

describe('traveler session helpers', () => {
  const trainingPkg = {
    type: 'training' as const,
    offer_type: 'TYPE_TRAINING_ONLY' as const,
    training_access: 'once_daily' as const,
    price_per_day: 1500,
  }

  it('locks once-daily when only that track is configured', () => {
    const options = getTravelerTrainingTierOptions(trainingPkg, null)
    expect(options).toEqual({ twice_daily: false, once_daily: true })
    expect(travelerCanChooseTrainingSession(options)).toBe(false)
    expect(resolveEffectiveTrainingTier(options, 'twice_daily')).toBe('once_daily')
    expect(travelerSessionCardLabel(options)).toBe('Single session')
  })

  it('allows choice when both tracks are configured', () => {
    const options = getTravelerTrainingTierOptions(
      { ...trainingPkg, training_access: 'twice_daily', once_daily_price_per_day: 1200 },
      null
    )
    expect(travelerCanChooseTrainingSession(options)).toBe(true)
    expect(offersOnceDailyTrainingChoice(
      { ...trainingPkg, training_access: 'twice_daily', once_daily_price_per_day: 1200 },
      null
    )).toBe(true)
    expect(travelerSessionCardLabel(options)).toBe('Single or double session')
    expect(travelerSessionLabel('twice_daily')).toBe('Double session')
  })
})

describe('training access labels', () => {
  it('maps values to card and inclusion copy', () => {
    expect(trainingAccessCardLabel('twice_daily')).toBe('Twice Daily')
    expect(trainingAccessInclusionLabel('flexible_daily')).toContain('choose')
  })
})
