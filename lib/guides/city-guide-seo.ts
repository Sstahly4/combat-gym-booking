export const MUAY_THAI_CITY_GUIDE_DATE_PUBLISHED = '2025-10-15'
export const MUAY_THAI_CITY_GUIDE_DATE_MODIFIED = '2026-07-04'

export function buildMuayThaiCityGuideSeo(
  city: string,
  options?: { description?: string; path?: string },
) {
  const TITLE = `Best Muay Thai Gyms in ${city} (2026)`
  const SEO_TITLE = `Best Muay Thai Gyms in ${city} (2026): Ranked by Reviews`
  const PATH =
    options?.path ??
    `/blog/best-muay-thai-gyms/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'))}`
  const DESCRIPTION =
    options?.description ??
    `Compare the best Muay Thai gyms in ${city} — live prices, guest reviews, and training schedules. Updated 2026 rankings.`
  return { TITLE, SEO_TITLE, PATH, DESCRIPTION }
}
