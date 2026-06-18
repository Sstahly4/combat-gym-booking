import { describe, expect, it } from 'vitest'
import {
  applyTrainingTierToBreakdown,
  formatPriceLineDescription,
  trainingTierLinePrefix,
} from '@/lib/booking/price-breakdown-display'
import type { PriceBreakdown } from '@/lib/utils'

const sampleBreakdown: PriceBreakdown = {
  price: 315,
  savedVsNightly: 0,
  unit: 'day',
  duration: 7,
  durationLabel: '7 days',
  lines: [
    {
      label: '7 days',
      qty: 7,
      unitPrice: 45,
      subtotal: 315,
      kind: 'day',
    },
  ],
}

describe('price-breakdown-display', () => {
  it('prefixes training tier on line labels', () => {
    const result = applyTrainingTierToBreakdown(sampleBreakdown, {
      showTrainingTier: true,
      trainingTier: 'once_daily',
    })
    expect(result.lines[0].label).toBe('Once Daily Training: 7 days')
    expect(trainingTierLinePrefix('twice_daily')).toBe('Twice Daily Training')
  })

  it('formats line description with tier label', () => {
    const line = applyTrainingTierToBreakdown(sampleBreakdown, {
      showTrainingTier: true,
      trainingTier: 'once_daily',
    }).lines[0]
    expect(formatPriceLineDescription(line)).toBe('Once Daily Training: 7 days')
  })

  it('leaves breakdown unchanged when tier selection is hidden', () => {
    const result = applyTrainingTierToBreakdown(sampleBreakdown, {
      showTrainingTier: false,
      trainingTier: 'once_daily',
    })
    expect(result.lines[0].label).toBe('7 days')
  })
})
