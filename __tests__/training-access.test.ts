import { describe, expect, it } from 'vitest'
import {
  offerTypeUsesTrainingAccess,
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

describe('training access labels', () => {
  it('maps values to card and inclusion copy', () => {
    expect(trainingAccessCardLabel('twice_daily')).toBe('Twice Daily')
    expect(trainingAccessInclusionLabel('flexible_daily')).toContain('choose')
  })
})
