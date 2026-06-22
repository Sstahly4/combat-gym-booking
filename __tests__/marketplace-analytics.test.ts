import { describe, expect, it } from 'vitest'
import {
  buildFighterProfileSnapshot,
  searchLeadTimeDays,
} from '@/lib/marketplace/marketplace-analytics'

describe('marketplace analytics helpers', () => {
  it('computes search lead time in whole days', () => {
    const asOf = new Date('2026-06-01T12:00:00')
    expect(searchLeadTimeDays('2026-06-15', asOf)).toBe(14)
    expect(searchLeadTimeDays(null, asOf)).toBeNull()
  })

  it('builds fighter profile snapshot when fields exist', () => {
    expect(
      buildFighterProfileSnapshot({
        home_country: 'Australia',
        combat_skill_level: 'advanced',
        combat_primary_discipline: 'BJJ',
      }),
    ).toEqual({
      home_country: 'Australia',
      home_location: null,
      combat_skill_level: 'advanced',
      combat_primary_discipline: 'BJJ',
      combat_disciplines: null,
    })
    expect(buildFighterProfileSnapshot({})).toBeNull()
    expect(
      buildFighterProfileSnapshot({ country_of_residence: 'United Kingdom' }),
    ).toEqual({
      home_country: 'United Kingdom',
      home_location: null,
      combat_skill_level: null,
      combat_primary_discipline: null,
      combat_disciplines: null,
    })
  })
})
