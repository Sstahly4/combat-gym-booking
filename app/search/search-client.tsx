'use client'

import { useEffect, useMemo, useRef, useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { calculateEstimatedPrice } from '@/lib/utils'
import type { Gym, GymImage } from '@/lib/types/database'
import { Filter, X, Star, Search, ChevronDown, MapPin, Check, ChevronsUpDown, ChevronRight } from 'lucide-react'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { useCurrency } from '@/lib/contexts/currency-context'
import { CategoryTabs } from '@/components/category-tabs'
import { SearchBarRedesign } from '@/components/search-bar-redesign'
import { SaveButton } from '@/components/save-button'
import { parseSearchQuery, SEARCH_DISCIPLINES } from '@/lib/search/search-browse-title'
import {
  centroidOfGyms,
  formatNearbyDistanceKm,
  gymMatchesLocationQuery,
  inferCountryFromLocationQuery,
  isCountryOnlyLocationSearch,
  locationSearchLabel,
  partitionLocationSearchGyms,
  type NearbySearchGym,
} from '@/lib/search/search-location-results'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { SearchResultGymImageCarousel } from '@/components/search-result-gym-image-carousel'
import { DATES_CONFIRMED_QUERY, gymHrefWithOptionalDates } from '@/lib/booking-dates-intent'
import { logSearchEvent, logSearchGymClick } from '@/lib/marketplace/log-search-client'
import {
  searchCatalogFiltersKey,
  type SearchCatalogFilters,
} from '@/lib/search/search-filters'
import type { SearchServerPayload } from '@/lib/search/search-server-listings'

const COUNTRIES = ['Thailand', 'Indonesia', 'Australia', 'Japan', 'USA', 'Brazil', 'Philippines', 'Malaysia']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const SORT_OPTIONS = [
  { value: 'recommended', label: 'Our top picks' },
  { value: 'price_asc', label: 'Price (lowest first)' },
  { value: 'price_desc', label: 'Price (highest first)' },
  { value: 'rating', label: 'Best reviewed' },
  { value: 'review_count', label: 'Most reviewed' },
  { value: 'newest', label: 'Newest listings' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'value', label: 'Best value' },
]

interface GymWithImages extends Gym {
  images: GymImage[]
  average_rating?: number
  review_count?: number
  distanceKm?: number
}

/** Search list payload — explicit columns + one thumbnail image per gym (not select *). */
const SEARCH_GYM_SELECT = `
  id,
  name,
  slug,
  city,
  country,
  address,
  tagline,
  description,
  price_per_day,
  price_per_week,
  price_per_month,
  currency,
  disciplines,
  amenities,
  created_at,
  latitude,
  longitude,
  images:gym_images(url, variants, order)
`

const MIN_DESCRIPTION_SNIPPET = 32
/** ~one handset line at 13px; CSS truncate still applies if needed */
const MAX_DESCRIPTION_SNIPPET = 78

/** Airbnb-style hook from listing copy: first sentence or line of description, accurate because owner-written. */
function snippetFromGymDescription(raw: string | null | undefined): string | null {
  if (!raw) return null
  const stripped = raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped.length < MIN_DESCRIPTION_SNIPPET) return null

  let head = stripped
  const sentence = stripped.match(/^[\s\S]{20,}?[.!?](?=\s|$)/)
  if (sentence) head = sentence[0].trim()

  if (head.length > MAX_DESCRIPTION_SNIPPET) {
    const slice = head.slice(0, MAX_DESCRIPTION_SNIPPET)
    const lastSpace = slice.lastIndexOf(' ')
    head = (lastSpace > 36 ? slice.slice(0, lastSpace) : slice).trimEnd()
  }
  return head
}

/** Squared distance threshold: ignore tap navigation if finger moved farther than this (scroll/swipe intent). */
const MOVE_CANCEL_PX = 12
const MOVE_CANCEL_SQ = MOVE_CANCEL_PX * MOVE_CANCEL_PX

function TapGuardLink({
  onClick,
  ...props
}: React.ComponentProps<typeof Link> & { className?: string; children: React.ReactNode }) {
  const movedRef = useRef(false)
  const pointerSessionCleanupRef = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      pointerSessionCleanupRef.current?.()
      pointerSessionCleanupRef.current = null
    },
    [],
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    movedRef.current = false
    pointerSessionCleanupRef.current?.()
    pointerSessionCleanupRef.current = null

    const startX = e.clientX
    const startY = e.clientY
    const pid = e.pointerId

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (dx * dx + dy * dy > MOVE_CANCEL_SQ) movedRef.current = true
    }

    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      pointerSessionCleanupRef.current = null
    }

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      pointerSessionCleanupRef.current = null
    }
    pointerSessionCleanupRef.current = cleanup

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (movedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onClick?.(e)
  }

  return <Link {...props} onPointerDown={handlePointerDown} onClick={handleClick} />
}

/**
 * Two-line mobile card subtitles, built in one pass with zero overlap.
 *
 * tagline  Owner-written headline (up to 80 chars).
 *          Falls back to description opening, then discipline + city template.
 *
 * facts    Always three scannable chips separated by dot:
 *          {discipline} · {On-site stay | Drop-in} · {city}
 */
function buildMobileCardLines(gym: GymWithImages): { tagline: string; facts: string } {
  const a = (gym as { amenities?: Record<string, unknown> }).amenities
  const acc = Boolean(a?.accommodation)

  const d0 = (gym.disciplines?.[0] ?? '').trim()
  const city = (gym.city ?? '').trim()
  const country = (gym.country ?? '').trim()
  const place = city || country

  // Line 1: owner tagline > description snippet > template
  const ownerTagline = ((gym as { tagline?: string | null }).tagline ?? '').trim()
  let tagline = ownerTagline

  if (!tagline) {
    const fromDesc = snippetFromGymDescription(gym.description)
    if (fromDesc) tagline = fromDesc
  }
  if (!tagline) {
    if (d0 && place) tagline = d0 + ' gym in ' + place
    else if (d0) tagline = d0 + ' gym'
    else if (place) tagline = 'Training gym in ' + place
    else tagline = 'Training gym'
  }

  // Line 2: always 3 scannable chips
  const discipline = d0 || 'Training'
  const stayType = acc ? 'On-site stay' : 'Drop-in'
  const location = city || country || 'Thailand'
  const facts = discipline + ' · ' + stayType + ' · ' + location

  return { tagline, facts }
}

// ─── Sidebar map ──────────────────────────────────────────────────────────────

function SearchLocationMap({ location }: { location: string }) {
  const [loaded, setLoaded] = useState(false)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '')
    }
  }, [])

  if (!apiKey || !location) {
    // Placeholder when no key or location yet
    return (
      <div className="h-44 bg-gradient-to-br from-[#003580]/10 to-[#006ce4]/10 flex flex-col items-center justify-center gap-2 rounded-t-xl border-b border-gray-200">
        <MapPin className="w-6 h-6 text-[#003580]/40" />
        <span className="text-xs text-gray-400">Map preview</span>
      </div>
    )
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(location)}&zoom=10&maptype=roadmap`

  return (
    <div className="relative h-44 bg-gray-100 overflow-hidden rounded-t-xl border-b border-gray-200">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100">
          <div className="w-6 h-6 rounded-full border-2 border-[#003580] border-t-transparent animate-spin" />
        </div>
      )}
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        title="Search area map"
        className="w-full h-full pointer-events-none"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
      {/* Location label overlay */}
      <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm border border-gray-200 max-w-fit">
          <MapPin className="w-3.5 h-3.5 text-[#003580] flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-800 truncate">{location}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function CheckboxRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#003580] border-[#003580]' : 'border-gray-400 bg-white group-hover:border-gray-600'}`}>
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-sm text-gray-800">{label}</span>
    </label>
  )
}

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-200 py-4">
      <button type="button" onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full text-left">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="bg-[#003580] text-white text-xs font-bold px-2 py-1 rounded min-w-[2rem] text-center">
      {score.toFixed(1)}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

async function geocodeLocationAnchor(
  query: string,
): Promise<{ lat: number; lng: number; country: string | null } | null> {
  try {
    const res = await fetch(`/api/geo/address-search?q=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const json = (await res.json()) as {
      results?: Array<{ lat?: string; lon?: string; country?: string | null }>
    }
    const hit = json.results?.[0]
    if (!hit?.lat || !hit?.lon) return null
    const lat = parseFloat(hit.lat)
    const lng = parseFloat(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng, country: hit.country?.trim() || null }
  } catch {
    return null
  }
}

function catalogFiltersFromState(filters: {
  location: string
  discipline: string
  country: string
  minPrice: string
  maxPrice: string
  accommodation: boolean
  popularFilters: string[]
}): SearchCatalogFilters {
  return {
    location: filters.location.trim(),
    discipline: filters.discipline.trim(),
    country: filters.country.trim(),
    minPrice: filters.minPrice.trim(),
    maxPrice: filters.maxPrice.trim(),
    accommodation:
      filters.accommodation || filters.popularFilters.includes('Accommodation included'),
  }
}

function SearchPageContent({ initialPayload }: { initialPayload?: SearchServerPayload }) {
  const searchParams = useSearchParams()
  const { convertPrice, formatPrice } = useCurrency()
  const [gyms, setGyms] = useState<GymWithImages[]>(
    () => (initialPayload?.gyms as GymWithImages[]) ?? [],
  )
  const [nearbyGyms, setNearbyGyms] = useState<NearbySearchGym<GymWithImages>[]>(
    () => (initialPayload?.nearbyGyms as NearbySearchGym<GymWithImages>[]) ?? [],
  )
  const [loading, setLoading] = useState(() => !initialPayload)
  const skipNextFetchRef = useRef(!!initialPayload)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.setAttribute('data-filter-open', '1')
    } else {
      document.body.removeAttribute('data-filter-open')
    }
    return () => { document.body.removeAttribute('data-filter-open') }
  }, [mobileFiltersOpen])
  const [sortBy, setSortBy] = useState('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [category, setCategory] = useState<'gyms' | 'train-stay' | 'seminars'>('gyms')
  // useTransition lets React keep the filter inputs responsive while the
  // derived result list (sorting, rating filter, card re-render) runs at
  // lower priority in the background — big INP win on the search page.
  const [, startTransition] = useTransition()

  const queryParam = searchParams.get('query') || ''
  const parsedQuery = parseSearchQuery(queryParam)
  const initialLocation = searchParams.get('location') || parsedQuery.location
  const initialDiscipline = searchParams.get('discipline') || parsedQuery.discipline
  const urlCheckin = searchParams.get('checkin') || ''
  const urlCheckout = searchParams.get('checkout') || ''
  const urlDatesConfirmed = searchParams.get(DATES_CONFIRMED_QUERY) === 'true'
  const guestsParam = searchParams.get('guests') || ''

  const defaultDatesForCategory = (c: typeof category) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (c === 'train-stay') {
      // Next Monday (or today if already Monday), then +7 days.
      const day = today.getDay() // 0=Sun ... 6=Sat
      const daysUntilMonday = (8 - day) % 7
      const nextMonday = new Date(today)
      nextMonday.setDate(today.getDate() + daysUntilMonday)
      const end = new Date(nextMonday)
      end.setDate(nextMonday.getDate() + 7)
      return {
        checkin: nextMonday.toISOString().slice(0, 10),
        checkout: end.toISOString().slice(0, 10),
      }
    }

    // Gyms + Seminars default to a single day (same-day).
    const iso = today.toISOString().slice(0, 10)
    return { checkin: iso, checkout: iso }
  }

  const initialDates = useMemo(() => {
    if (urlCheckin || urlCheckout) return { checkin: urlCheckin, checkout: urlCheckout }
    return defaultDatesForCategory(category)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCheckin, urlCheckout, category])

  const [filters, setFilters] = useState({
    location: initialLocation,
    discipline: initialDiscipline,
    country: searchParams.get('country') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    accommodation: searchParams.get('accommodation') === 'true',
    checkin: initialDates.checkin,
    checkout: initialDates.checkout,
    disciplines: [] as string[],
    countries: [] as string[],
    levels: [] as string[],
    minRating: '',
    popularFilters: [] as string[],
  })

  // When switching tabs, treat the active tab as a "mode" signal that controls
  // date defaults and key filter constraints. Do not override explicit URL dates.
  useEffect(() => {
    const urlHasDates = Boolean(searchParams.get('checkin') || searchParams.get('checkout'))
    if (urlHasDates) return

    const next = defaultDatesForCategory(category)
    setFilters(prev => ({
      ...prev,
      checkin: next.checkin,
      checkout: next.checkout,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  useEffect(() => {
    const qp = searchParams.get('query') || ''
    if (qp) {
      const parsed = parseSearchQuery(qp)
      setFilters(prev => ({
        ...prev,
        location: parsed.location || searchParams.get('location') || prev.location,
        discipline: parsed.discipline || searchParams.get('discipline') || prev.discipline,
        country: searchParams.get('country') || prev.country,
        checkin: searchParams.get('checkin') || prev.checkin,
        checkout: searchParams.get('checkout') || prev.checkout,
      }))
    } else {
      setFilters(prev => ({
        ...prev,
        location: searchParams.get('location') || prev.location,
        discipline: searchParams.get('discipline') || prev.discipline,
        country: searchParams.get('country') || prev.country,
        checkin: searchParams.get('checkin') || prev.checkin,
        checkout: searchParams.get('checkout') || prev.checkout,
      }))
    }
  }, [searchParams])

  // Debounce filter changes → fetchGyms. Without this, typing "150" into
  // the Min Price input fires 3 Supabase round-trips; with debounce, only
  // the final value triggers the network call, and the typing itself stays
  // at 60fps. 250ms is short enough to feel instant but long enough to
  // coalesce rapid input/checkbox storms.
  useEffect(() => {
    const catalogKey = searchCatalogFiltersKey(catalogFiltersFromState(filters))
    if (skipNextFetchRef.current && initialPayload?.filtersKey === catalogKey) {
      skipNextFetchRef.current = false
      return
    }

    const t = setTimeout(() => { fetchGyms() }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchGyms = async () => {
    setLoading(true)
    const supabase = createClient()

    const applyCatalogFilters = (
      baseQuery: ReturnType<ReturnType<typeof supabase.from>['select']>,
    ) => {
      let query = baseQuery
        .in('verification_status', ['verified', 'trusted'])
        .eq('status', 'approved')
        .order('order', { ascending: true, nullsFirst: false, foreignTable: 'gym_images' })
        .limit(1, { foreignTable: 'gym_images' })

      if (filters.country) query = query.ilike('country', `%${filters.country}%`)
      if (filters.countries.length > 0) {
        query = query.or(filters.countries.map((c) => `country.ilike.%${c}%`).join(','))
      }
      if (filters.discipline) query = query.contains('disciplines', [filters.discipline])
      if (filters.disciplines.length > 0) query = query.contains('disciplines', filters.disciplines)
      if (filters.minPrice) query = query.gte('price_per_day', parseFloat(filters.minPrice))
      if (filters.maxPrice) query = query.lte('price_per_day', parseFloat(filters.maxPrice))
      if (filters.accommodation || filters.popularFilters.includes('Accommodation included')) {
        query = query.eq('amenities->accommodation', true)
      }
      return query
    }

    const enrichGyms = async (gymsRaw: any[]) => {
      const ids = gymsRaw.map((g: any) => g.id).filter(Boolean)
      let statsByGym: Record<string, { avg: number; count: number }> = {}
      if (ids.length > 0) {
        const { data: reviews } = await supabase.from('reviews').select('gym_id, rating').in('gym_id', ids)
        const byGym: Record<string, number[]> = {}
        reviews?.forEach((r: any) => {
          if (!r?.gym_id || typeof r.rating !== 'number') return
          if (!byGym[r.gym_id]) byGym[r.gym_id] = []
          byGym[r.gym_id].push(r.rating)
        })
        Object.entries(byGym).forEach(([gymId, ratings]) => {
          statsByGym[gymId] = { avg: ratings.reduce((s, n) => s + n, 0) / ratings.length, count: ratings.length }
        })
      }

      return gymsRaw.map((gym: any) => ({
        ...gym,
        images: (gym.images || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
        average_rating: statsByGym[gym.id]?.avg || 0,
        review_count: statsByGym[gym.id]?.count || 0,
      })) as GymWithImages[]
    }

    const locationQuery = filters.location.trim()
    const useNearbyExpansion = Boolean(locationQuery) && !isCountryOnlyLocationSearch(locationQuery)

    const disciplinesForLog = [
      filters.discipline,
      ...filters.disciplines,
    ].filter((d): d is string => Boolean(d && d.trim()))

    const emitSearchLedger = (
      primaryCount: number,
      nearbyCount: number,
      anchor: { lat: number; lng: number } | null,
    ) => {
      logSearchEvent({
        destination_input: locationQuery || null,
        resolved_latitude: anchor?.lat ?? null,
        resolved_longitude: anchor?.lng ?? null,
        disciplines: disciplinesForLog,
        start_date: filters.checkin || null,
        end_date: filters.checkout || null,
        results_count: primaryCount + nearbyCount,
        primary_results_count: primaryCount,
        nearby_results_count: nearbyCount,
      })
    }

    try {
      if (useNearbyExpansion) {
        let country = inferCountryFromLocationQuery(locationQuery)
        let anchor = await geocodeLocationAnchor(locationQuery)

        if (!country && anchor?.country) {
          country = inferCountryFromLocationQuery(anchor.country) ?? anchor.country
        }

        let regionalQuery = applyCatalogFilters(supabase.from('gyms').select(SEARCH_GYM_SELECT))
        if (country) {
          regionalQuery = regionalQuery.ilike('country', `%${country}%`)
        } else {
          regionalQuery = regionalQuery.or(
            `city.ilike.%${locationQuery}%,country.ilike.%${locationQuery}%`,
          )
        }

        const { data, error } = await regionalQuery
        if (error) {
          console.error(error)
          setGyms([])
          setNearbyGyms([])
          return
        }

        const enriched = await enrichGyms(data || [])
        const primaryMatches = enriched.filter((g) => gymMatchesLocationQuery(g, locationQuery))

        const centroid = centroidOfGyms(primaryMatches)
        let resolvedAnchor = centroid ?? (anchor ? { lat: anchor.lat, lng: anchor.lng } : null)
        if (!resolvedAnchor && country) {
          const geo = await geocodeLocationAnchor(`${locationSearchLabel(locationQuery)}, ${country}`)
          if (geo) resolvedAnchor = { lat: geo.lat, lng: geo.lng }
        }

        if (resolvedAnchor) {
          const { primary, nearby } = partitionLocationSearchGyms(enriched, {
            locationQuery,
            anchor: resolvedAnchor,
          })
          setGyms(primary)
          setNearbyGyms(nearby)
          emitSearchLedger(primary.length, nearby.length, resolvedAnchor)
        } else {
          setGyms(primaryMatches)
          setNearbyGyms([])
          emitSearchLedger(primaryMatches.length, 0, null)
        }
        return
      }

      let query = applyCatalogFilters(supabase.from('gyms').select(SEARCH_GYM_SELECT))
      if (locationQuery) {
        query = query.or(`city.ilike.%${locationQuery}%,country.ilike.%${locationQuery}%`)
      }

      const { data, error } = await query
      if (error) {
        console.error(error)
        setGyms([])
        setNearbyGyms([])
        return
      }

      const enriched = await enrichGyms(data || [])
      setGyms(enriched)
      setNearbyGyms([])
      emitSearchLedger(enriched.length, 0, null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: any) =>
    startTransition(() => setFilters(prev => ({ ...prev, [key]: value })))

  const toggleArrayFilter = (key: 'disciplines' | 'countries' | 'levels' | 'popularFilters', value: string) => {
    startTransition(() => setFilters(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    }))
  }

  const clearFilters = () => startTransition(() => setFilters(prev => ({
    ...prev, discipline: '', minPrice: '', maxPrice: '', experienceLevel: '',
    accommodation: false, disciplines: [], countries: [], levels: [], minRating: '', popularFilters: [],
  })))

  const activeFilterCount = [
    filters.discipline, filters.minPrice, filters.maxPrice, filters.minRating,
    ...filters.disciplines, ...filters.countries, ...filters.levels, ...filters.popularFilters,
    filters.accommodation ? 'acc' : '',
  ].filter(Boolean).length

  const getFallbackRating = (gymId: string) => {
    const str = String(gymId || 'gym')
    let hash = 0; for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    return Math.min(5.0, 3.5 + (hash % 4) * 0.5)
  }

  const ratingLabel = (r: number) => {
    if (r >= 4.8) return 'Exceptional'
    if (r >= 4.3) return 'Very good'
    if (r >= 3.8) return 'Good'
    if (r >= 3.3) return 'Pleasant'
    return 'Okay'
  }

  const sortedGyms = useMemo(() => {
    const arr = [...gyms]
    if (sortBy === 'price_asc') return arr.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0))
    if (sortBy === 'price_desc') return arr.sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0))
    if (sortBy === 'rating') return arr.sort((a, b) => {
      const ra = (a.review_count || 0) > 0 ? (a.average_rating || 0) : getFallbackRating(a.id)
      const rb = (b.review_count || 0) > 0 ? (b.average_rating || 0) : getFallbackRating(b.id)
      return rb - ra
    })
    if (sortBy === 'review_count') return arr.sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    if (sortBy === 'newest') return arr.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    if (sortBy === 'name_asc') return arr.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }))
    if (sortBy === 'value') return arr.sort((a, b) => {
      // Heuristic: higher rating + lower price = better value
      const ra = (a.review_count || 0) > 0 ? (a.average_rating || 0) : getFallbackRating(a.id)
      const rb = (b.review_count || 0) > 0 ? (b.average_rating || 0) : getFallbackRating(b.id)
      const pa = Math.max(1, a.price_per_day || 0)
      const pb = Math.max(1, b.price_per_day || 0)
      const scoreA = ra / pa
      const scoreB = rb / pb
      return scoreB - scoreA
    })
    return arr
  }, [gyms, sortBy])

  const filteredByRating = useMemo(() => {
    if (!filters.minRating) return sortedGyms
    const min = parseFloat(filters.minRating)
    return sortedGyms.filter(g => {
      const r = (g.review_count || 0) > 0 ? (g.average_rating || 0) : 3.5
      return r >= min
    })
  }, [sortedGyms, filters.minRating])

  const filteredNearbyByRating = useMemo(() => {
    if (!filters.minRating) return nearbyGyms
    const min = parseFloat(filters.minRating)
    return nearbyGyms.filter((g) => {
      const r = (g.review_count || 0) > 0 ? (g.average_rating || 0) : 3.5
      return r >= min
    })
  }, [nearbyGyms, filters.minRating])

  const locationLabel = locationSearchLabel(filters.location)
  const totalVisibleResults = filteredByRating.length + filteredNearbyByRating.length

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Map at top */}
      <SearchLocationMap location={filters.location} />

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">Filter by:</span>
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters} className="text-xs text-[#006ce4] hover:underline">
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="px-4">
        <SidebarSection title="Your budget (per day)">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={e => handleFilterChange('minPrice', e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#006ce4]"
              />
            </div>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={e => handleFilterChange('maxPrice', e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#006ce4]"
              />
            </div>
          </div>
        </SidebarSection>

        <SidebarSection title="Popular filters">
          {['Accommodation included', 'Beginner friendly', 'Private training available', 'Airport pickup', 'Daily sessions'].map(f => (
            <CheckboxRow
              key={f}
              label={f}
              checked={filters.popularFilters.includes(f)}
              onChange={() => toggleArrayFilter('popularFilters', f)}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Review score">
          {[
            { value: '4.5', label: 'Exceptional: 4.5+' },
            { value: '4.0', label: 'Very good: 4.0+' },
            { value: '3.5', label: 'Good: 3.5+' },
          ].map(opt => (
            <CheckboxRow
              key={opt.value}
              label={opt.label}
              checked={filters.minRating === opt.value}
              onChange={checked => handleFilterChange('minRating', checked ? opt.value : '')}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Discipline">
          {SEARCH_DISCIPLINES.map(d => (
            <CheckboxRow
              key={d}
              label={d}
              checked={filters.disciplines.includes(d) || filters.discipline === d}
              onChange={() => {
                if (filters.discipline === d) handleFilterChange('discipline', '')
                else toggleArrayFilter('disciplines', d)
              }}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Experience level">
          {EXPERIENCE_LEVELS.map(l => (
            <CheckboxRow key={l} label={l} checked={filters.levels.includes(l)} onChange={() => toggleArrayFilter('levels', l)} />
          ))}
        </SidebarSection>

        <SidebarSection title="Country / Region" defaultOpen={false}>
          {COUNTRIES.map(c => (
            <CheckboxRow key={c} label={c} checked={filters.countries.includes(c)} onChange={() => toggleArrayFilter('countries', c)} />
          ))}
        </SidebarSection>
      </div>
    </div>
  )

  // ─── Result card ──────────────────────────────────────────────────────────
  const renderCard = (gym: GymWithImages, options?: { fromNearby?: boolean }) => {
    const fromNearby = options?.fromNearby ?? false
    const onResultClick = () => logSearchGymClick(gym.id, { fromNearby })
    const hasReviews = (gym.review_count || 0) > 0 && (gym.average_rating || 0) > 0
    const rawRating = hasReviews ? (gym.average_rating as number) : getFallbackRating(gym.id)
    const displayRating = Math.round(rawRating * 2) / 2
    const displayCount = hasReviews ? (gym.review_count as number) : 0
    const rawDuration = (filters.checkin && filters.checkout)
      ? Math.floor((new Date(filters.checkout).getTime() - new Date(filters.checkin).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    const isSingleDayMode = category === 'gyms' || category === 'seminars'
    const displayDuration = isSingleDayMode ? Math.max(1, rawDuration + 1) : rawDuration

    const estimatedPrice = (isSingleDayMode ? displayDuration >= 1 : rawDuration > 0)
      ? calculateEstimatedPrice(
        isSingleDayMode ? displayDuration : rawDuration,
        { daily: gym.price_per_day, weekly: gym.price_per_week, monthly: gym.price_per_month },
      )
      : null

    const href = gymHrefWithOptionalDates(gym.slug || gym.id, {
      checkin: filters.checkin,
      checkout: filters.checkout,
      datesConfirmed: urlDatesConfirmed,
    })
    const rawPrice =
      estimatedPrice != null && estimatedPrice > 0 ? estimatedPrice : gym.price_per_day || 0
    const priceDisplay = formatPrice(convertPrice(rawPrice, gym.currency || 'USD'))
    const priceLabelTop = estimatedPrice ? 'Estimated total' : 'Starting from'
    const priceLabelBottom = estimatedPrice
      ? isSingleDayMode
        ? `for ${displayDuration} ${displayDuration === 1 ? 'day' : 'days'}`
        : `for ${rawDuration} ${rawDuration === 1 ? 'night' : 'nights'}`
      : 'per session'
    const guestsCount = (() => {
      const n = parseInt(guestsParam || '', 10)
      if (!Number.isFinite(n) || n <= 0) return null
      return n
    })()

    const placeQuery =
      gym.address ||
      (gym.name && gym.city ? `${gym.name}, ${gym.city}, ${gym.country}` : `${gym.city}, ${gym.country}`)
    const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`
    const { tagline: mobileTagline, facts: mobileFacts } = buildMobileCardLines(gym)
    const mobileTitle = (gym.name || '').trim() || 'Gym'
    const distanceHint =
      typeof gym.distanceKm === 'number' ? formatNearbyDistanceKm(gym.distanceKm) : null

    return (
      <div
        key={gym.id}
        className="bg-transparent sm:bg-white border-0 sm:border sm:border-gray-200 rounded-none sm:rounded-xl overflow-visible sm:overflow-hidden shadow-none sm:shadow-none hover:shadow-none sm:hover:shadow-md transition-shadow"
      >
        {/* ── Mobile: Airbnb-style dense card — entire block is one tap target (no CTA button) ── */}
        <div className="sm:hidden relative">
          <TapGuardLink
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${mobileTitle} — ${mobileTagline}`}
            onClick={onResultClick}
            className="block text-left outline-none focus-visible:ring-2 focus-visible:ring-[#003580] focus-visible:ring-offset-2 rounded-[12px] active:bg-gray-50/50"
          >
            <div className="relative px-0 pt-0 sm:px-2 sm:pt-2">
              {/* Airbnb-style rectangle: 4:3 + 12px radius; object-cover inside carousel */}
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[12px] bg-gray-100 sm:shadow-none">
                <SearchResultGymImageCarousel
                  images={gym.images}
                  alt={gym.name}
                  sizes="(max-width: 640px) 100vw, 360px"
                />
              </div>
            </div>
            {/* Text block: 4px between each line, then 10px gap before price */}
            <div className="px-0 pt-3 pb-1.5 flex flex-col">
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-base font-bold leading-tight text-gray-900 line-clamp-1">
                  {mobileTitle}
                </h2>
                <div className="flex shrink-0 items-center gap-0.5 text-[12px] text-gray-900">
                  {hasReviews ? (
                    <>
                      <Star className="h-3 w-3 fill-gray-900 text-gray-900" strokeWidth={0} aria-hidden />
                      <span className="font-medium">{displayRating.toFixed(2)}</span>
                      <span className="text-gray-500 whitespace-nowrap">({displayCount})</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-500">New</span>
                  )}
                </div>
              </div>
              {/* Line 1: owner tagline (or description/template fallback) — 4px below title */}
              <p className="mt-[4px] min-w-0 truncate text-[13px] leading-tight text-gray-500">{mobileTagline}</p>
              {/* Line 2: scannable facts chips — 4px below tagline */}
              <p className="mt-[4px] min-w-0 truncate text-[12px] leading-tight text-gray-500">{mobileFacts}</p>
              {distanceHint ? (
                <p className="mt-[4px] min-w-0 truncate text-[12px] leading-tight text-gray-500">{distanceHint}</p>
              ) : null}
              {/* Price block — 10px below fact chips to separate data blocks */}
              <div className="mt-[10px] flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold tabular-nums leading-tight text-gray-900">
                    {priceDisplay}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-[2px]">
                    {priceLabelBottom}
                    {guestsCount ? ` · ${guestsCount} guest${guestsCount !== 1 ? 's' : ''}` : ''}
                  </div>
                </div>
              </div>
              <p className="mt-[2px] text-[10px] text-gray-400 leading-tight">Includes taxes and charges</p>
            </div>
          </TapGuardLink>
          <SaveButton gymId={gym.id} />
        </div>

        {/* ── Desktop: existing three-column card ── */}
        <div className="hidden sm:flex sm:flex-row">
          {/* Image */}
          <div className="sm:w-[260px] md:w-[320px] flex-shrink-0 p-3 sm:p-4">
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onResultClick}
              className="relative block w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
            >
              <div className="absolute inset-0">
                {gym.images.length > 0 ? (
                  <ResponsiveGymImage
                    image={gym.images[0]}
                    alt={gym.name}
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
                )}
              </div>
              <SaveButton gymId={gym.id} />
            </Link>
          </div>

          {/* Middle content */}
          <div className="flex-1 px-4 pb-4 sm:py-4 sm:pl-0 sm:pr-5 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onResultClick}
                  className="font-bold text-[#006ce4] hover:underline text-[15px] md:text-base leading-snug inline-block"
                >
                  {gym.name}
                </Link>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{gym.city}, {gym.country}</span>
                  {distanceHint ? (
                    <>
                      <span className="text-gray-300 mx-1">•</span>
                      <span className="whitespace-nowrap text-gray-500">{distanceHint}</span>
                    </>
                  ) : null}
                  <span className="text-gray-300 mx-1">•</span>
                  <a
                    href={mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#006ce4] hover:underline font-medium whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Show on map
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {gym.disciplines.slice(0, 3).map(d => (
                <span key={d} className="text-[11px] bg-blue-50 text-[#003580] px-2 py-0.5 rounded-full border border-blue-100">
                  {d}
                </span>
              ))}
              {gym.disciplines.length > 3 && (
                <span className="text-[11px] text-gray-400">+{gym.disciplines.length - 3} more</span>
              )}
            </div>

            <div className="mt-3 space-y-0.5 text-[13px] text-gray-900">
              <div className="font-semibold leading-snug">
                {gym.disciplines?.length ? `${gym.disciplines[0]} training camp` : 'Training camp'}
                {gym.amenities?.accommodation ? ' with accommodation' : ''}
              </div>
              <div className="text-[12px] text-gray-600 leading-snug">
                {gym.amenities?.meals ? 'Meals available' : 'Flexible training packages'}
                {gym.amenities?.airport_pickup ? ' • Airport pickup available' : ''}
              </div>
            </div>

            <div className="mt-3 border-l-2 border-gray-200 pl-3 space-y-1">
              <div className="flex items-start gap-2 text-[12px] text-green-700">
                <Check className="w-3.5 h-3.5 flex-shrink-0 mt-[1px]" strokeWidth={2.5} />
                <span className="leading-snug">Verified training facility</span>
              </div>
              {gym.disciplines.length >= 2 && (
                <div className="flex items-start gap-2 text-[12px] text-green-700">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 mt-[1px]" strokeWidth={2.5} />
                  <span className="leading-snug">Multiple disciplines available</span>
                </div>
              )}
              {filters.checkin && filters.checkout && (isSingleDayMode ? displayDuration >= 1 : rawDuration > 0) && (
                <div className="flex items-start gap-2 text-[12px] text-green-700">
                  <span className="leading-snug">
                    Dates selected • {isSingleDayMode
                      ? `${displayDuration} ${displayDuration === 1 ? 'day' : 'days'}`
                      : `${rawDuration} ${rawDuration === 1 ? 'night' : 'nights'}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="w-[240px] md:w-[270px] flex-shrink-0 py-4 pr-5 pl-4 border-l border-gray-100 flex-col justify-between flex">
            <div className="flex items-start justify-end gap-2">
              <div className="text-right">
                <div className="text-[11px] font-semibold text-gray-900">{ratingLabel(displayRating)}</div>
                {hasReviews && <div className="text-[10px] text-gray-500">{displayCount} reviews</div>}
              </div>
              <ScoreBadge score={displayRating} />
            </div>

            <div className="mt-3 text-right">
              <div className="text-[11px] text-gray-500">{priceLabelTop}</div>
              <div className="text-[22px] font-semibold text-gray-900 leading-tight">
                {priceDisplay}
              </div>
              <div className="text-[11px] text-gray-500">
                {priceLabelBottom}{guestsCount ? `, ${guestsCount} guest${guestsCount !== 1 ? 's' : ''}` : ''}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Includes taxes and charges</div>

              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onResultClick}
                className="mt-3 inline-flex w-full items-center justify-center bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold py-2.5 rounded text-sm transition-colors"
              >
                See availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BookingProvider key={category} initialCheckin={initialDates.checkin} initialCheckout={initialDates.checkout}>
      <div className="min-h-screen bg-white">

        {/* ── Search strip — white on mobile; blue + overlapping pill on desktop ── */}
        <div className="relative z-30 bg-white pt-4 pb-3 md:bg-[#003580] md:pt-5 md:pb-0">
          <div className="max-w-6xl mx-auto px-6 md:px-4">
            <div className="hidden md:block">
              <CategoryTabs value={category} onChange={setCategory} />
            </div>
            <div className="md:translate-y-1/2">
              <SearchBarRedesign
                showTabs={false}
                yellowBorder={true}
                activeCategory={category}
                initialQuery={filters.location}
                onCategoryChange={setCategory}
              />
            </div>
          </div>
        </div>

        {/* White spacer — absorbs the bottom half of the pill on desktop; breadcrumb desktop-only */}
        <div className="bg-white pb-3 md:pt-10 md:pb-4">
          <div className="max-w-6xl mx-auto px-6 md:px-4">
            {/* Breadcrumb — desktop only; mobile shows location + dates in the search pill */}
            <nav className="hidden md:flex items-center flex-wrap gap-y-1 text-sm pl-6" aria-label="Breadcrumb">
              <Link href="/" className="text-[#006ce4] hover:underline">Home</Link>
              {filters.location && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 flex-shrink-0" />
                  <Link
                    href={`/search?location=${encodeURIComponent(filters.location.split(',')[0].trim())}`}
                    className="text-[#006ce4] hover:underline"
                  >
                    {/* Show country portion if location has a comma (e.g. "Phuket, Thailand") */}
                    {filters.location.includes(',')
                      ? filters.location.split(',').slice(-1)[0].trim()
                      : filters.location}
                  </Link>
                  {filters.location.includes(',') && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 flex-shrink-0" />
                      <Link
                        href={`/search?location=${encodeURIComponent(filters.location)}`}
                        className="text-[#006ce4] hover:underline"
                      >
                        {filters.location.split(',')[0].trim()}
                      </Link>
                    </>
                  )}
                </>
              )}
              {filters.discipline && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 flex-shrink-0" />
                  <Link
                    href={`/search?discipline=${encodeURIComponent(filters.discipline)}`}
                    className="text-[#006ce4] hover:underline"
                  >
                    {filters.discipline}
                  </Link>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1 flex-shrink-0" />
              <span className="text-gray-500">Search results</span>
            </nav>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 pb-8 pt-4 md:px-4 md:pt-5 md:pb-5">
          <div className="flex gap-6 items-start">

            {/* ── Sidebar (desktop) ──────────────────────────────────── */}
            <aside className="hidden md:block w-64 xl:w-72 flex-shrink-0 sticky top-4">
              {sidebar}
            </aside>

            {/* ── Results — ~672px max on large phones (Airbnb-style); 24px page gutters via px-6 ── */}
            <main className="flex-1 min-w-0 w-full max-w-2xl mx-auto md:max-w-none md:mx-0">
              {/* Results header (aligned with results column); title hidden on mobile for cleaner OTA toolbar */}
              <div className="mb-3 md:mb-4">
                <h2 className="mb-3 hidden text-xl font-bold text-gray-900 md:block">
                  {loading ? (
                    <span className="text-gray-400 text-base font-normal">Searching…</span>
                  ) : (
                    <>
                      {filters.location ? <>{locationLabel}: </> : null}
                      {filteredByRating.length > 0 ? (
                        <>
                          {filteredByRating.length} {filteredByRating.length === 1 ? 'gym' : 'gyms'} found
                        </>
                      ) : filteredNearbyByRating.length > 0 ? (
                        <>showing nearby gyms</>
                      ) : (
                        <>0 gyms found</>
                      )}
                    </>
                  )}
                </h2>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sort pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSortOpen(v => !v)}
                      className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm font-medium text-gray-900 hover:border-gray-500 shadow-sm transition-colors"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">Sort by:</span>
                      <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Our top picks'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${sortOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {sortOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close sort"
                          className="fixed inset-0 z-10"
                          onClick={() => setSortOpen(false)}
                        />
                        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-[0_18px_45px_rgba(0,0,0,0.14)] z-20 min-w-[260px] overflow-hidden">
                          {SORT_OPTIONS.map(o => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => { setSortBy(o.value); setSortOpen(false) }}
                              className={`w-full text-left px-5 py-3.5 text-[15px] flex items-center justify-between transition-colors hover:bg-gray-50 ${sortBy === o.value ? 'font-semibold text-gray-900' : 'text-gray-900'}`}
                            >
                              {o.label}
                              {sortBy === o.value && <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile filters pill */}
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="md:hidden flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-500 shadow-sm transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-10 sm:space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex flex-col overflow-hidden rounded-[12px] border-0 bg-white/90 shadow-sm sm:h-44 sm:flex-row sm:border sm:border-gray-200 sm:rounded-xl sm:bg-white sm:shadow-none"
                    >
                      <div className="aspect-[4/3] w-full flex-shrink-0 bg-gray-200 animate-pulse sm:aspect-auto sm:h-full sm:w-[220px]" />
                      <div className="flex flex-1 flex-col gap-2 p-3 sm:justify-start sm:space-y-3 sm:gap-0 sm:p-4">
                        <div className="h-5 w-2/3 rounded bg-gray-200 animate-pulse" />
                        <div className="h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
                        <div className="hidden h-3 w-full rounded bg-gray-200 animate-pulse sm:block" />
                        <div className="hidden h-3 w-4/5 rounded bg-gray-200 animate-pulse sm:block" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredByRating.length === 0 && filteredNearbyByRating.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-700">No gyms found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or searching a different destination.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 text-[#006ce4] text-sm hover:underline">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-10 sm:space-y-3">
                  {filteredByRating.map((gym) => renderCard(gym))}
                  {filteredNearbyByRating.length > 0 ? (
                    <div className="pt-8 sm:pt-6 border-t border-gray-200 space-y-6 sm:space-y-3">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          More gyms near {locationLabel || filters.location}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          Within about 150 km — options travelers often compare when planning a trip.
                        </p>
                      </div>
                      {filteredNearbyByRating.map((gym) => renderCard(gym, { fromNearby: true }))}
                    </div>
                  ) : null}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* ── Mobile filters bottom sheet ────────────────────────────── */}
        {mobileFiltersOpen && (
          <>
            <button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200 bg-white">
                <span className="font-bold text-gray-900">Filter by</span>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="px-4 pb-8">{sidebar}</div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold py-3 rounded text-sm transition-colors"
                >
                  Show {totalVisibleResults} result{totalVisibleResults !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BookingProvider>
  )
}

export default function SearchClient({
  initialPayload,
}: {
  initialPayload?: SearchServerPayload
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f2f6fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPageContent initialPayload={initialPayload} />
    </Suspense>
  )
}
