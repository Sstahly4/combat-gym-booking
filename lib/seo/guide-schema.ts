import { siteUrl, absoluteUrl } from './site-url'
import { gymCanonicalPath } from './gym-canonical-path'
import { BRAND_NAME } from '@/lib/brand'

const DEFAULT_LOGO_PATH = '/favicon-512x512-rounded.png'

const publisher = {
  '@type': 'Organization',
  name: BRAND_NAME,
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl(DEFAULT_LOGO_PATH),
    width: 512,
    height: 512,
  },
}

export function buildArticleLd(args: {
  title: string
  description: string
  path: string
  datePublished: string
  dateModified?: string
  imagePath?: string
}) {
  const imageUrl =
    args.imagePath && (args.imagePath.startsWith('http://') || args.imagePath.startsWith('https://'))
      ? args.imagePath
      : args.imagePath
        ? absoluteUrl(args.imagePath)
        : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.title,
    description: args.description,
    mainEntityOfPage: absoluteUrl(args.path),
    datePublished: args.datePublished,
    dateModified: args.dateModified || args.datePublished,
    image: imageUrl ? [imageUrl] : undefined,
    author: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: siteUrl,
    },
    publisher,
  }
}

export function buildFaqLd(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function buildBreadcrumbLd(crumbs: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

type GymForSchema = {
  id: string
  slug?: string | null
  name: string
  city?: string | null
  country?: string | null
  averageRating?: number
  reviewCount?: number
}

export function buildGymItemListLd(args: {
  name: string
  gyms: GymForSchema[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: args.name,
    numberOfItems: args.gyms.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: args.gyms.map((gym, index) => {
      const hasRating =
        typeof gym.averageRating === 'number' &&
        typeof gym.reviewCount === 'number' &&
        gym.averageRating > 0 &&
        gym.reviewCount > 0

      const item: Record<string, unknown> = {
        '@type': 'SportsActivityLocation',
        name: gym.name,
        url: absoluteUrl(gymCanonicalPath(gym)),
      }

      if (gym.city || gym.country) {
        item.address = {
          '@type': 'PostalAddress',
          addressLocality: gym.city || undefined,
          addressCountry: gym.country || undefined,
        }
      }

      if (hasRating) {
        item.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: Number(gym.averageRating!.toFixed(2)),
          reviewCount: gym.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      }

      return {
        '@type': 'ListItem',
        position: index + 1,
        item,
      }
    }),
  }
}

/** Brand profile pages: Article + optional SportsActivityLocation review entity when gym is bookable. */
export function buildBrandReviewLd(args: {
  title: string
  description: string
  path: string
  datePublished: string
  dateModified?: string
  imagePath?: string
  brandName: string
  gym?: {
    id: string
    slug?: string | null
    name: string
    city?: string | null
    country?: string | null
    averageRating?: number
    reviewCount?: number
  } | null
}) {
  const imageUrl =
    args.imagePath && (args.imagePath.startsWith('http://') || args.imagePath.startsWith('https://'))
      ? args.imagePath
      : args.imagePath
        ? absoluteUrl(args.imagePath)
        : undefined

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: args.title,
      description: args.description,
      mainEntityOfPage: absoluteUrl(args.path),
      datePublished: args.datePublished,
      dateModified: args.dateModified || args.datePublished,
      image: imageUrl ? [imageUrl] : undefined,
      author: { '@type': 'Organization', name: BRAND_NAME, url: siteUrl },
      publisher,
      about: { '@type': 'SportsActivityLocation', name: args.brandName },
    },
  ]

  if (args.gym) {
    const hasRating =
      typeof args.gym.averageRating === 'number' &&
      typeof args.gym.reviewCount === 'number' &&
      args.gym.averageRating > 0 &&
      args.gym.reviewCount > 0

    const location: Record<string, unknown> = {
      '@type': 'SportsActivityLocation',
      name: args.gym.name,
      url: absoluteUrl(gymCanonicalPath(args.gym)),
    }

    if (args.gym.city || args.gym.country) {
      location.address = {
        '@type': 'PostalAddress',
        addressLocality: args.gym.city || undefined,
        addressCountry: args.gym.country || undefined,
      }
    }

    if (hasRating) {
      location.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(args.gym.averageRating!.toFixed(2)),
        reviewCount: args.gym.reviewCount,
        bestRating: 5,
        worstRating: 1,
      }
    }

    graph.push(location)
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
