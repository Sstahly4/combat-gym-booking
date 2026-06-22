import type { Package, GymFaqItem } from '@/lib/types/database'
import type { GymReview } from '@/lib/gym/gym-reviews-data'
import { absoluteUrl, siteUrl } from '@/lib/seo/site-url'
import { gymAmenitySchemaFeatures } from '@/lib/seo/gym-meta-description'
import { buildBreadcrumbLd, buildFaqLd } from '@/lib/seo/guide-schema'
import { BRAND_NAME } from '@/lib/brand'

export function normalizeGymFaq(raw: unknown): Array<{ q: string; a: string }> {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const q = String((item as GymFaqItem).question || '').trim()
      const a = String((item as GymFaqItem).answer || '').trim()
      if (!q || !a) return null
      return { q, a }
    })
    .filter((item): item is { q: string; a: string } => item !== null)
}

export function schemaLowestPricePerDay(
  packages: Package[],
  gymCurrency: string,
  gymPricePerDay: number,
): string | undefined {
  const SYMBOLS: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', AUD: 'A$', THB: '฿',
    IDR: 'Rp', JPY: '¥', CNY: '¥', SGD: 'S$', MYR: 'RM',
    NZD: 'NZ$', CAD: 'C$', HKD: 'HK$', INR: '₹', KRW: '₩',
    PHP: '₱', VND: '₫',
  }
  const currency = (gymCurrency || 'USD').toUpperCase()
  const symbol = SYMBOLS[currency] ?? currency

  let min: number | null = null
  for (const pkg of packages) {
    if (pkg.pricing_config?.mode === 'rate') {
      const daily = pkg.pricing_config.rates?.daily
      if (daily && daily > 0) min = min === null ? daily : Math.min(min, daily)
      continue
    }
    if (pkg.pricing_config?.mode === 'fixed') {
      for (const d of pkg.pricing_config.durations ?? []) {
        if (d.price > 0 && d.days > 0) {
          const perDay = d.price / d.days
          min = min === null ? perDay : Math.min(min, perDay)
        }
      }
      continue
    }
    if (pkg.price_per_day && pkg.price_per_day > 0) {
      min = min === null ? pkg.price_per_day : Math.min(min, pkg.price_per_day)
    }
  }

  if (min === null && gymPricePerDay > 0) min = gymPricePerDay
  if (min === null) return undefined
  return `From ${symbol}${Math.round(min).toLocaleString('en-US')}/day`
}

export function gymOpeningHoursToSchema(
  hours: Record<string, string> | undefined,
): string[] | undefined {
  if (!hours || typeof hours !== 'object') return undefined
  const abbr: Record<string, string> = {
    monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th',
    friday: 'Fr', saturday: 'Sa', sunday: 'Su',
  }
  const result: string[] = []
  for (const [day, val] of Object.entries(hours)) {
    const short = abbr[day.toLowerCase()]
    if (!short || !val || /closed/i.test(val)) continue
    const parts = val.replace(/[–—]/g, '-').replace(/\s/g, '').split('-')
    if (parts.length < 2) continue
    const pad = (t: string) => {
      const [h, m = '00'] = t.split(':')
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    }
    result.push(`${short} ${pad(parts[0])}-${pad(parts[1])}`)
  }
  return result.length > 0 ? result : undefined
}

function packageOfferPrice(pkg: Package): number | null {
  if (pkg.pricing_config?.mode === 'rate') {
    const daily = pkg.pricing_config.rates?.daily
    return daily && daily > 0 ? daily : null
  }
  if (pkg.pricing_config?.mode === 'fixed') {
    let min: number | null = null
    for (const d of pkg.pricing_config.durations ?? []) {
      if (d.price > 0 && d.days > 0) {
        const perDay = d.price / d.days
        min = min === null ? perDay : Math.min(min, perDay)
      }
    }
    return min
  }
  if (pkg.price_per_day && pkg.price_per_day > 0) return pkg.price_per_day
  return null
}

function buildPackageOffers(
  gym: { id: string; slug?: string | null; currency: string },
  packages: Package[],
  gymPublicPath: string,
): Record<string, unknown>[] {
  const offers: Record<string, unknown>[] = []
  const gymUrl = absoluteUrl(gymPublicPath)

  for (const pkg of packages.slice(0, 8)) {
    const price = packageOfferPrice(pkg)
    if (price === null) continue
    offers.push({
      '@type': 'Offer',
      name: pkg.name,
      description: pkg.description || undefined,
      price: Number(price.toFixed(2)),
      priceCurrency: (pkg.currency || gym.currency || 'USD').toUpperCase(),
      url: `${gymUrl}#packages`,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
        url: siteUrl,
      },
      itemOffered: {
        '@type': 'Service',
        name: pkg.name,
        provider: {
          '@type': 'SportsActivityLocation',
          '@id': gymUrl,
        },
      },
    })
  }

  return offers
}

function buildReviewNodes(
  gymPublicPath: string,
  reviews: GymReview[],
  max = 5,
): Record<string, unknown>[] {
  const gymUrl = absoluteUrl(gymPublicPath)
  const nodes: Record<string, unknown>[] = []

  for (const review of reviews.slice(0, max)) {
    if (!review.rating || review.rating < 1) continue
    const authorName =
      review.reviewer_name?.trim() ||
      (review.manual_review ? 'Verified guest' : 'CombatStay guest')

    nodes.push({
      '@type': 'Review',
      author: { '@type': 'Person', name: authorName },
      datePublished: review.created_at,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: review.comment?.trim() || undefined,
      itemReviewed: { '@type': 'SportsActivityLocation', '@id': gymUrl },
    })
  }

  return nodes
}

export function buildGymPageJsonLd(args: {
  gym: {
    id: string
    slug?: string | null
    name: string
    description?: string | null
    city?: string | null
    country?: string | null
    address?: string | null
    latitude?: number | null
    longitude?: number | null
    public_contact_phone?: string | null
    disciplines?: string[] | null
    amenities?: Record<string, unknown> | null
    currency: string
    price_per_day: number
    opening_hours?: Record<string, string> | null
  }
  gymPublicPath: string
  packages: Package[]
  reviewCount: number
  averageRating: number
  primaryImage?: string
  reviews?: GymReview[]
  faqItems?: Array<{ q: string; a: string }>
}): Record<string, unknown> {
  const gymUrl = absoluteUrl(args.gymPublicPath)
  const { gym } = args

  const sportsActivity: Record<string, unknown> = {
    '@type': 'SportsActivityLocation',
    '@id': gymUrl,
    name: gym.name,
    url: gymUrl,
    description:
      gym.description ||
      `Train at ${gym.name} in ${gym.city}, ${gym.country}. Book combat sports camps on CombatStay.`,
    image: args.primaryImage ? [args.primaryImage] : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.address || undefined,
      addressLocality: gym.city || undefined,
      addressCountry: gym.country || undefined,
    },
    geo:
      typeof gym.latitude === 'number' && typeof gym.longitude === 'number'
        ? {
            '@type': 'GeoCoordinates',
            latitude: gym.latitude,
            longitude: gym.longitude,
          }
        : undefined,
    telephone: gym.public_contact_phone || undefined,
    sport: Array.isArray(gym.disciplines) && gym.disciplines.length > 0 ? gym.disciplines : undefined,
    amenityFeature: gymAmenitySchemaFeatures(gym.amenities),
    priceRange: schemaLowestPricePerDay(args.packages, gym.currency, gym.price_per_day),
    aggregateRating:
      args.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(args.averageRating.toFixed(2)),
            reviewCount: args.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    openingHours: gymOpeningHoursToSchema(gym.opening_hours ?? undefined),
    isPartOf: {
      '@type': 'WebSite',
      name: BRAND_NAME,
      url: siteUrl,
    },
  }

  const graph: Record<string, unknown>[] = [sportsActivity]

  const breadcrumbs = buildBreadcrumbLd([
    { name: 'Home', path: '/' },
    ...(gym.country
      ? [{ name: gym.country, path: `/search?country=${encodeURIComponent(gym.country)}` }]
      : []),
    ...(gym.city
      ? [
          {
            name: gym.city,
            path: `/search?country=${encodeURIComponent(gym.country || '')}&location=${encodeURIComponent(gym.city)}`,
          },
        ]
      : []),
    { name: gym.name, path: args.gymPublicPath },
  ])
  graph.push(breadcrumbs)

  const faqItems = args.faqItems ?? []
  if (faqItems.length > 0) {
    graph.push(buildFaqLd(faqItems))
  }

  if (args.reviews && args.reviews.length > 0) {
    graph.push(...buildReviewNodes(args.gymPublicPath, args.reviews))
  }

  const offers = buildPackageOffers(gym, args.packages, args.gymPublicPath)
  if (offers.length > 0) {
    graph.push(...offers)
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
