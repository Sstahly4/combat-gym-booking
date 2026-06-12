export const HOMEPAGE_ROW_SIZE_DESKTOP = 10
export const HOMEPAGE_ROW_SIZE_MOBILE = 8

const HOLIDAY_CITIES = [
  'phuket',
  'krabi',
  'pattaya',
  'koh samui',
  'koh phangan',
  'koh tao',
  'hua hin',
  'chiang mai',
]

const BEACH_TRAINING_CITY_SUBSTRINGS = [
  'phuket',
  'krabi',
  'pattaya',
  'koh samui',
  'koh phangan',
  'koh tao',
  'hua hin',
  'cha-am',
]

export type HomepageGym = Record<string, any>

function normalizeText(value: unknown): string {
  return String(value ?? '').toLowerCase()
}

function hasPackages(gym: HomepageGym): boolean {
  return Array.isArray(gym.packages) && gym.packages.length > 0
}

function packageText(gym: HomepageGym): string {
  if (!hasPackages(gym)) return ''
  return gym.packages
    .map((pkg: any) => `${pkg?.name ?? ''} ${pkg?.type ?? ''} ${pkg?.offer_type ?? ''}`)
    .join(' ')
    .toLowerCase()
}

function hasAccommodationSignal(gym: HomepageGym): boolean {
  if (gym.offers_accommodation === true) return true
  if (gym.amenities?.accommodation === true) return true
  if (gym.accommodation_price_per_day != null || gym.accommodation_price_per_week != null) return true
  if (!hasPackages(gym)) return false
  return gym.packages.some((pkg: any) =>
    pkg?.includes_accommodation === true ||
    pkg?.type === 'accommodation' ||
    pkg?.offer_type === 'TYPE_TRAINING_ACCOM' ||
    pkg?.offer_type === 'TYPE_ALL_INCLUSIVE'
  )
}

export function hasHolidaySignal(gym: HomepageGym): boolean {
  const city = normalizeText(gym.city)
  const text = packageText(gym)
  return (
    hasAccommodationSignal(gym) ||
    HOLIDAY_CITIES.some((holidayCity) => city.includes(holidayCity)) ||
    /holiday|retreat|stay|accommodation|accom|camp/i.test(text)
  )
}

export function hasBeginnerSignal(gym: HomepageGym): boolean {
  const amenities = gym.amenities ?? {}
  const text = `${normalizeText(gym.description)} ${packageText(gym)}`
  return (
    amenities.beginner_friendly === true ||
    amenities.beginnerFriendly === true ||
    /beginner|first[-\s]?timer|fundamentals|all levels|no experience/i.test(text)
  )
}

export function hasTrainStayPackageSignal(gym: HomepageGym): boolean {
  if (!hasPackages(gym)) return false
  return gym.packages.some(
    (pkg: any) => pkg.type === 'accommodation' || pkg.includes_accommodation === true,
  )
}

export function hasBeachsideSignal(gym: HomepageGym): boolean {
  const city = normalizeText(gym.city)
  return BEACH_TRAINING_CITY_SUBSTRINGS.some((needle) => city.includes(needle))
}

export function qualityScore(gym: HomepageGym): number {
  const rating = Number(gym.averageRating ?? 0)
  const reviewCount = Number(gym.reviewCount ?? 0)
  const imageCount = Array.isArray(gym.images) ? gym.images.length : 0
  const packageCount = Array.isArray(gym.packages) ? gym.packages.length : 0
  const createdAt = gym.created_at ? new Date(gym.created_at).getTime() : 0
  const ageDays = Number.isFinite(createdAt) && createdAt > 0
    ? (Date.now() - createdAt) / 86_400_000
    : Number.POSITIVE_INFINITY
  const freshnessBoost = Math.max(0, 12 - Math.max(0, ageDays) / 5)

  return (
    rating * 20 +
    Math.min(reviewCount, 20) * 2 +
    Math.min(imageCount, 8) * 1.5 +
    Math.min(packageCount, 4) * 3 +
    (gym.verification_status === 'trusted' ? 8 : 0) +
    freshnessBoost
  )
}

export function compareByQuality(a: HomepageGym, b: HomepageGym): number {
  const scoreDiff = qualityScore(b) - qualityScore(a)
  if (scoreDiff !== 0) return scoreDiff
  return String(a.name ?? '').localeCompare(String(b.name ?? ''))
}

export function buildHomepageRow({
  pool,
  primary,
  sort = compareByQuality,
  used,
  limit = HOMEPAGE_ROW_SIZE_DESKTOP,
}: {
  pool: HomepageGym[]
  primary: (gym: HomepageGym) => boolean
  sort?: (a: HomepageGym, b: HomepageGym) => number
  used: Set<string>
  limit?: number
}): HomepageGym[] {
  const selected: HomepageGym[] = []
  const add = (gym: HomepageGym) => {
    if (!gym?.id || used.has(gym.id) || selected.some((g) => g.id === gym.id)) return
    selected.push(gym)
  }

  pool.filter(primary).sort(sort).forEach(add)
  if (selected.length < limit) {
    pool.filter((gym) => !primary(gym)).sort(sort).forEach(add)
  }

  const row = selected.slice(0, limit)
  row.forEach((gym) => used.add(gym.id))
  return row
}

export function countGymsInDestination(gyms: HomepageGym[], destination: string): number {
  const needle = normalizeText(destination).trim()
  if (!needle) return 0
  return gyms.filter((gym) => normalizeText(gym.city).includes(needle)).length
}

export function deriveTopRatedGyms(gyms: HomepageGym[], limit: number): HomepageGym[] {
  return [...gyms]
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
      return String(a.name ?? '').localeCompare(String(b.name ?? ''))
    })
    .slice(0, limit)
}

export function sortGymImages<T extends { images?: Array<{ order?: number | null }> | null }>(
  gyms: T[],
): T[] {
  gyms.forEach((gym) => {
    if (gym.images && Array.isArray(gym.images)) {
      gym.images.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
  })
  return gyms
}
