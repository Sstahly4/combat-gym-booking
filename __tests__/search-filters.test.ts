import { describe, expect, it } from 'vitest'
import {
  parseSearchCatalogFiltersFromParams,
  searchCatalogFiltersKey,
} from '@/lib/search/search-filters'

describe('search catalog filters', () => {
  it('parses query param into location and discipline', () => {
    const filters = parseSearchCatalogFiltersFromParams({
      query: 'Muay Thai Phuket',
    })
    expect(filters.location).toBe('Phuket')
    expect(filters.discipline).toBe('Muay Thai')
  })

  it('prefers explicit location and discipline params', () => {
    const filters = parseSearchCatalogFiltersFromParams({
      query: 'Muay Thai Phuket',
      location: 'Bangkok',
      discipline: 'MMA',
      country: 'Thailand',
      accommodation: 'true',
    })
    expect(filters.location).toBe('Bangkok')
    expect(filters.discipline).toBe('MMA')
    expect(filters.country).toBe('Thailand')
    expect(filters.accommodation).toBe(true)
  })

  it('builds a stable cache key', () => {
    const a = searchCatalogFiltersKey({
      location: 'Phuket',
      discipline: 'Muay Thai',
      country: 'Thailand',
      minPrice: '',
      maxPrice: '',
      accommodation: false,
    })
    const b = searchCatalogFiltersKey({
      location: 'Phuket',
      discipline: 'Muay Thai',
      country: 'Thailand',
      minPrice: '',
      maxPrice: '',
      accommodation: false,
    })
    expect(a).toBe(b)
  })
})
