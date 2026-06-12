/** One card thumbnail per gym — matches search list pattern. */
export const HOMEPAGE_GYM_IMAGE_SELECT =
  'url, variants, order, focus_x, focus_y'

/** Package fields needed for homepage shelf filters (no descriptions or event metadata). */
export const HOMEPAGE_PACKAGE_SELECT =
  'id, type, includes_accommodation, includes_meals, name, offer_type'

/** Gym + packages payload for homepage row building and TripPlanner filters. */
export const HOMEPAGE_SLIM_GYM_WITH_PACKAGES_SELECT = `
  id,
  slug,
  name,
  city,
  country,
  description,
  price_per_day,
  currency,
  disciplines,
  amenities,
  offers_accommodation,
  accommodation_price_per_day,
  accommodation_price_per_week,
  verification_status,
  created_at,
  images:gym_images(${HOMEPAGE_GYM_IMAGE_SELECT}),
  packages(${HOMEPAGE_PACKAGE_SELECT})
`

/** Carousel card display only — used for the fast LCP row query. */
export const HOMEPAGE_CARD_GYM_SELECT = `
  id,
  slug,
  name,
  city,
  country,
  price_per_day,
  currency,
  verification_status,
  created_at,
  images:gym_images(${HOMEPAGE_GYM_IMAGE_SELECT})
`
