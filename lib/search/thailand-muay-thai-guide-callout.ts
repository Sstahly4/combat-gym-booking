import {
  FLAGSHIP_MUAY_THAI_GUIDE,
  muayThaiCityGuidePath,
} from '@/lib/guides/gym-guide-links'
import { inferCountryFromLocationQuery } from '@/lib/search/search-location-results'

export type ThailandGuideCalloutLinks = {
  flagship: typeof FLAGSHIP_MUAY_THAI_GUIDE
  cityGuide: { href: string; label: string } | null
}

function isThailandNeedle(value: string): boolean {
  return value.trim().toLowerCase().includes('thailand')
}

function filtersTargetThailand(filters: {
  location: string
  country: string
  countries: string[]
}): boolean {
  const needles = [
    filters.country,
    filters.location,
    inferCountryFromLocationQuery(filters.location) ?? '',
    ...filters.countries,
  ]
  return needles.some((n) => n.trim() && isThailandNeedle(n))
}

function filtersIncludeMuayThai(filters: { discipline: string; disciplines: string[] }): boolean {
  const norm = (s: string) => s.trim().toLowerCase()
  if (norm(filters.discipline) === 'muay thai') return true
  return filters.disciplines.some((d) => norm(d) === 'muay thai')
}

function cityFromLocationQuery(location: string, country: string): string | null {
  const loc = location.trim()
  if (!loc) return null
  if (loc.includes(',')) {
    const city = loc.split(',')[0]?.trim()
    return city || null
  }
  if (isThailandNeedle(loc)) return null
  if (country.trim() && isThailandNeedle(country)) return loc
  if (isThailandNeedle(inferCountryFromLocationQuery(loc) ?? '')) return null
  return loc
}

export function getThailandMuayThaiGuideCalloutLinks(filters: {
  location: string
  country: string
  countries: string[]
  discipline: string
  disciplines: string[]
}): ThailandGuideCalloutLinks | null {
  if (!filtersIncludeMuayThai(filters)) return null
  if (!filtersTargetThailand(filters)) return null

  const city = cityFromLocationQuery(filters.location, filters.country)
  const cityGuide = city
    ? {
        href: muayThaiCityGuidePath(city),
        label: `Best Muay Thai gyms in ${city}`,
      }
    : null

  return { flagship: FLAGSHIP_MUAY_THAI_GUIDE, cityGuide }
}
