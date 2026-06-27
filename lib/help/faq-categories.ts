import { BRAND_NAME } from '@/lib/brand'

export const FAQ_CATEGORY_SLUGS = [
  'safety',
  'bookings',
  'payments',
  'gyms',
  'general',
] as const

export type FaqCategorySlug = (typeof FAQ_CATEGORY_SLUGS)[number]

export type FaqCategoryMeta = {
  id: FaqCategorySlug
  slug: FaqCategorySlug
  label: string
  pageTitle: string
  description: string
}

export const FAQ_CATEGORIES: FaqCategoryMeta[] = [
  {
    id: 'safety',
    slug: 'safety',
    label: 'Safety & Security',
    pageTitle: `Safety FAQ | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about gym safety, insurance, trainer credentials, and data protection on CombatStay.',
  },
  {
    id: 'bookings',
    slug: 'bookings',
    label: 'Bookings',
    pageTitle: `Booking FAQ | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about modifying, cancelling, accessing, and confirming CombatStay bookings.',
  },
  {
    id: 'payments',
    slug: 'payments',
    label: 'Payments & disputes',
    pageTitle: `Payments FAQ | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about card charges, refunds, cancellation windows, and payment disputes on CombatStay.',
  },
  {
    id: 'gyms',
    slug: 'gyms',
    label: 'Gyms & Training',
    pageTitle: `Training FAQ | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about equipment, skill levels, gym communication, and what to expect on day one.',
  },
  {
    id: 'general',
    slug: 'general',
    label: 'General',
    pageTitle: `General FAQ | ${BRAND_NAME}`,
    description:
      'Frequently asked questions about accounts, reviews, payment methods, and reaching CombatStay customer service.',
  },
]

export const FAQ_CATEGORY_BY_SLUG = Object.fromEntries(
  FAQ_CATEGORIES.map((category) => [category.slug, category]),
) as Record<FaqCategorySlug, FaqCategoryMeta>

export function isFaqCategorySlug(value: string): value is FaqCategorySlug {
  return (FAQ_CATEGORY_SLUGS as readonly string[]).includes(value)
}

export function helpCategoryPath(slug: FaqCategorySlug): string {
  return `/help/${slug}`
}
