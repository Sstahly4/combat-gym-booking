import { describe, expect, it } from 'vitest'
import {
  findOverlappingSeasonalRate,
  hasAtLeastOneSeasonalTier,
  seasonalRateScopesOverlap,
} from '@/lib/packages/seasonal-rate-validation'
import type { PackageSeasonalRate } from '@/lib/types/database'

describe('seasonalRateScopesOverlap', () => {
  it('detects overlap for same all-variants scope', () => {
    expect(
      seasonalRateScopesOverlap(
        { variant_id: null, start_date: '2026-07-01', end_date: '2026-07-31' },
        { variant_id: null, start_date: '2026-07-15', end_date: '2026-08-15' }
      )
    ).toBe(true)
  })

  it('does not flag overlap across different variant scopes', () => {
    expect(
      seasonalRateScopesOverlap(
        { variant_id: null, start_date: '2026-07-01', end_date: '2026-07-31' },
        { variant_id: 'var-vip', start_date: '2026-07-15', end_date: '2026-07-31' }
      )
    ).toBe(false)
  })
})

describe('findOverlappingSeasonalRate', () => {
  const existing: PackageSeasonalRate[] = [
    {
      id: 'r1',
      package_id: 'p1',
      variant_id: null,
      name: 'Peak',
      start_date: '2026-12-01',
      end_date: '2027-02-28',
      price_per_week: 700,
      price_per_day: null,
      price_per_month: null,
      created_at: '',
      updated_at: '',
    },
  ]

  it('finds conflicting rule', () => {
    const hit = findOverlappingSeasonalRate(
      { variant_id: null, start_date: '2027-01-01', end_date: '2027-01-31' },
      existing
    )
    expect(hit?.name).toBe('Peak')
  })

  it('excludes rule being edited', () => {
    const hit = findOverlappingSeasonalRate(
      { variant_id: null, start_date: '2027-01-01', end_date: '2027-01-31' },
      existing,
      'r1'
    )
    expect(hit).toBeUndefined()
  })
})

describe('hasAtLeastOneSeasonalTier', () => {
  it('requires at least one tier', () => {
    expect(
      hasAtLeastOneSeasonalTier({ price_per_day: '', price_per_week: '400', price_per_month: '' })
    ).toBe(true)
    expect(
      hasAtLeastOneSeasonalTier({ price_per_day: '', price_per_week: '', price_per_month: '' })
    ).toBe(false)
  })
})
