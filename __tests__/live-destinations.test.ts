import { describe, expect, it } from 'vitest'
import {
  buildLiveDestinationsFromGyms,
  filterLiveDestinations,
  queryLooksLikeDestination,
} from '@/lib/search/live-destinations'

describe('live destinations', () => {
  it('aggregates cities by gym count and sorts by popularity', () => {
    const destinations = buildLiveDestinationsFromGyms([
      { city: 'Pai', country: 'Thailand' },
      { city: 'Phuket', country: 'Thailand' },
      { city: 'Phuket', country: 'Thailand' },
      { city: 'Krabi', country: 'Thailand' },
    ])

    expect(destinations.map((d) => d.name)).toEqual(['Phuket', 'Krabi', 'Pai'])
    expect(destinations[0]?.gymCount).toBe(2)
    expect(destinations.find((d) => d.name === 'Pai')?.visual).toBe('mountain')
  })

  it('filters destinations for typeahead queries', () => {
    const destinations = buildLiveDestinationsFromGyms([
      { city: 'Pai', country: 'Thailand' },
      { city: 'Phuket', country: 'Thailand' },
    ])

    expect(filterLiveDestinations(destinations, 'pai').map((d) => d.name)).toEqual(['Pai'])
    expect(queryLooksLikeDestination('pai', destinations)).toBe(true)
    expect(queryLooksLikeDestination('tiger gym', destinations)).toBe(false)
  })
})
