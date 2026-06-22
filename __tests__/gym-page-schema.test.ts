import { describe, expect, it } from 'vitest'
import { buildGymPageJsonLd, normalizeGymFaq } from '@/lib/seo/gym-page-schema'

describe('gym page schema', () => {
  it('normalizes owner FAQ rows', () => {
    expect(
      normalizeGymFaq([
        { question: '  Is Wi-Fi included? ', answer: 'Yes in common areas.' },
        { question: '', answer: 'skip' },
      ]),
    ).toEqual([{ q: 'Is Wi-Fi included?', a: 'Yes in common areas.' }])
  })

  it('builds a JSON-LD graph with location, breadcrumbs, and offers', () => {
    const ld = buildGymPageJsonLd({
      gym: {
        id: 'g1',
        slug: 'test-gym',
        name: 'Test Gym',
        description: 'Train hard.',
        city: 'Phuket',
        country: 'Thailand',
        address: '123 Road',
        latitude: 7.9,
        longitude: 98.3,
        disciplines: ['Muay Thai'],
        amenities: { wifi: true },
        currency: 'THB',
        price_per_day: 1200,
      },
      gymPublicPath: '/gyms/test-gym',
      packages: [
        {
          id: 'p1',
          gym_id: 'g1',
          name: 'Training package',
          description: null,
          price_per_day: 1000,
          currency: 'THB',
        } as never,
      ],
      reviewCount: 2,
      averageRating: 4.5,
      faqItems: [{ q: 'What time is check-in?', a: 'After 2pm.' }],
      reviews: [
        {
          id: 'r1',
          rating: 5,
          comment: 'Great camp',
          created_at: '2026-01-01T00:00:00Z',
          manual_review: true,
          reviewer_name: 'Alex',
        } as never,
      ],
    })

    expect(ld['@context']).toBe('https://schema.org')
    const graph = ld['@graph'] as Record<string, unknown>[]
    expect(graph.some((n) => n['@type'] === 'SportsActivityLocation')).toBe(true)
    expect(graph.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true)
    expect(graph.some((n) => n['@type'] === 'FAQPage')).toBe(true)
    expect(graph.some((n) => n['@type'] === 'Review')).toBe(true)
    expect(graph.some((n) => n['@type'] === 'Offer')).toBe(true)
  })
})
