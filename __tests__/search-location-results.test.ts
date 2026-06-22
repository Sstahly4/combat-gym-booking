import { describe, expect, it } from 'vitest'
import {
  gymMatchesLocationQuery,
  inferCountryFromLocationQuery,
  isCountryOnlyLocationSearch,
  partitionLocationSearchGyms,
} from '@/lib/search/search-location-results'

describe('search location results', () => {
  it('matches city and country queries like the search filter', () => {
    const gym = { city: 'Krabi', country: 'Thailand' }
    expect(gymMatchesLocationQuery(gym, 'Krabi')).toBe(true)
    expect(gymMatchesLocationQuery(gym, 'Thailand')).toBe(true)
    expect(gymMatchesLocationQuery(gym, 'Krabi, Thailand')).toBe(true)
    expect(gymMatchesLocationQuery(gym, 'Phuket')).toBe(false)
  })

  it('detects country-only searches', () => {
    expect(isCountryOnlyLocationSearch('Thailand')).toBe(true)
    expect(inferCountryFromLocationQuery('Krabi, Thailand')).toBe('Thailand')
    expect(isCountryOnlyLocationSearch('Krabi')).toBe(false)
  })

  it('partitions primary and nearby gyms by distance from anchor', () => {
    const gyms = [
      { id: '1', city: 'Krabi', country: 'Thailand', latitude: 8.0863, longitude: 98.9063 },
      { id: '2', city: 'Phuket', country: 'Thailand', latitude: 7.8804, longitude: 98.3923 },
      { id: '3', city: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018 },
    ]

    const { primary, nearby } = partitionLocationSearchGyms(gyms, {
      locationQuery: 'Krabi',
      anchor: { lat: 8.0863, lng: 98.9063 },
      radiusKm: 200,
    })

    expect(primary.map((g) => g.id)).toEqual(['1'])
    expect(nearby.map((g) => g.id)).toEqual(['2'])
    expect(nearby[0]?.distanceKm).toBeGreaterThan(50)
    expect(nearby[0]?.distanceKm).toBeLessThan(120)
  })
})
