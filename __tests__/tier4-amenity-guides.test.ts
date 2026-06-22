import { describe, expect, it } from 'vitest'
import {
  buildTier4GuideCopyFromSlug,
  tier4GuidePath,
} from '@/lib/guides/tier4-amenity-guides'

describe('tier4 amenity guides', () => {
  it('builds canonical tier 4 paths from city + amenity slug', () => {
    expect(tier4GuidePath('Krabi', 'private-ac-room')).toBe(
      '/blog/best-muay-thai-gyms/krabi/private-ac-room',
    )
    expect(tier4GuidePath('Koh Samui', 'with-accommodation')).toBe(
      '/blog/best-muay-thai-gyms/koh-samui/with-accommodation',
    )
  })

  it('builds SEO copy from amenity catalog row', () => {
    const copy = buildTier4GuideCopyFromSlug('Krabi', {
      name: 'Air conditioning',
      slug: 'private-ac-room',
    })
    expect(copy.path).toBe('/blog/best-muay-thai-gyms/krabi/private-ac-room')
    expect(copy.title).toContain('Krabi')
    expect(copy.title).toContain('Air conditioning')
    expect(copy.description).toContain('air conditioning')
  })
})
