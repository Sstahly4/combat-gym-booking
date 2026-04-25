'use client'

import { useEffect, useMemo, useRef, useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { calculateEstimatedPrice } from '@/lib/utils'
import type { Gym, GymImage } from '@/lib/types/database'
import { Filter, X, Star, Search, ChevronDown, MapPin, Check, ChevronsUpDown, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { useCurrency } from '@/lib/contexts/currency-context'
import { CategoryTabs } from '@/components/category-tabs'
import { SearchBarRedesign } from '@/components/search-bar-redesign'
import { SaveButton } from '@/components/save-button'
import { parseSearchQuery, SEARCH_DISCIPLINES } from '@/lib/search/search-browse-title'

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

function SearchPageContent() {
  const searchParams = useSearchParams()
  const { convertPrice, formatPrice } = useCurrency()
  const [gyms, setGyms] = useState<GymWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
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
  const initialCheckin = searchParams.get('checkin') || ''
  const initialCheckout = searchParams.get('checkout') || ''
  const guestsParam = searchParams.get('guests') || ''

  const [filters, setFilters] = useState({
    location: initialLocation,
    discipline: initialDiscipline,
    country: searchParams.get('country') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    accommodation: searchParams.get('accommodation') === 'true',
    checkin: initialCheckin,
    checkout: initialCheckout,
    disciplines: [] as string[],
    countries: [] as string[],
    levels: [] as string[],
    minRating: '',
    popularFilters: [] as string[],
  })

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
    const t = setTimeout(() => { fetchGyms() }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchGyms = async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('gyms')
      .select('*, images:gym_images(*)')
      .eq('verification_status', 'verified')
      .eq('status', 'approved')

    if (filters.location) query = query.or(`city.ilike.%${filters.location}%,country.ilike.%${filters.location}%`)
    if (filters.country) query = query.ilike('country', `%${filters.country}%`)
    if (filters.countries.length > 0) query = query.or(filters.countries.map(c => `country.ilike.%${c}%`).join(','))
    if (filters.discipline) query = query.contains('disciplines', [filters.discipline])
    if (filters.disciplines.length > 0) query = query.contains('disciplines', filters.disciplines)
    if (filters.minPrice) query = query.gte('price_per_day', parseFloat(filters.minPrice))
    if (filters.maxPrice) query = query.lte('price_per_day', parseFloat(filters.maxPrice))
    if (filters.accommodation || filters.popularFilters.includes('Accommodation included')) {
      query = query.eq('amenities->accommodation', true)
    }

    const { data, error } = await query
    if (error) { console.error(error); setLoading(false); return }

    const gymsRaw = data || []
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

    setGyms(gymsRaw.map((gym: any) => ({
      ...gym,
      images: (gym.images || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
      average_rating: statsByGym[gym.id]?.avg || 0,
      review_count: statsByGym[gym.id]?.count || 0,
    })))
    setLoading(false)
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

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating * 2) / 2
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const v = i + 1
          const full = rounded >= v
          const half = !full && rounded >= v - 0.5
          if (full) return <Star key={i} className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
          if (half) return (
            <span key={i} className="relative inline-flex w-3 h-3">
              <Star className="absolute inset-0 w-3 h-3 text-gray-300 fill-gray-200" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
              </span>
            </span>
          )
          return <Star key={i} className="w-3 h-3 text-gray-300 fill-gray-200" />
        })}
      </div>
    )
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
  const renderCard = (gym: GymWithImages) => {
    const hasReviews = (gym.review_count || 0) > 0 && (gym.average_rating || 0) > 0
    const rawRating = hasReviews ? (gym.average_rating as number) : getFallbackRating(gym.id)
    const displayRating = Math.round(rawRating * 2) / 2
    const displayCount = hasReviews ? (gym.review_count as number) : 0
    const duration = (filters.checkin && filters.checkout)
      ? Math.floor((new Date(filters.checkout).getTime() - new Date(filters.checkin).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    const estimatedPrice = duration > 0
      ? calculateEstimatedPrice(duration, { daily: gym.price_per_day, weekly: gym.price_per_week, monthly: gym.price_per_month })
      : null

    const href = `/gyms/${gym.id}${filters.checkin && filters.checkout ? `?checkin=${filters.checkin}&checkout=${filters.checkout}` : ''}`
    const rawPrice =
      estimatedPrice != null && estimatedPrice > 0 ? estimatedPrice : gym.price_per_day || 0
    const priceDisplay = formatPrice(convertPrice(rawPrice, gym.currency || 'USD'))
    const priceLabelTop = estimatedPrice ? 'Estimated total' : 'Starting from'
    const priceLabelBottom = estimatedPrice ? `for ${duration} nights` : 'per session'
    const guestsCount = (() => {
      const n = parseInt(guestsParam || '', 10)
      if (!Number.isFinite(n) || n <= 0) return null
      return n
    })()

    const placeQuery =
      gym.address ||
      (gym.name && gym.city ? `${gym.name}, ${gym.city}, ${gym.country}` : `${gym.city}, ${gym.country}`)
    const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}`

    return (
      <div key={gym.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-[260px] md:w-[320px] flex-shrink-0 p-3 sm:p-4">
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
            >
              {gym.images.length > 0 ? (
                <Image
                  src={gym.images[0].url}
                  alt={gym.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 320px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
              )}
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
                  className="font-bold text-[#006ce4] hover:underline text-[15px] md:text-base leading-snug inline-block"
                >
                  {gym.name}
                </Link>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{gym.city}, {gym.country}</span>
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

              {/* Rating (mobile top-right) */}
              <div className="sm:hidden flex-shrink-0 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-gray-900">{ratingLabel(displayRating)}</div>
                    {hasReviews && <div className="text-[10px] text-gray-500">{displayCount} reviews</div>}
                  </div>
                  <ScoreBadge score={displayRating} />
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

            {/* Key details (Booking-like black lines) */}
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

            {/* Highlights (Booking-like green lines) */}
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
              {filters.checkin && filters.checkout && duration > 0 && (
                <div className="flex items-start gap-2 text-[12px] text-green-700">
                  <span className="leading-snug">Dates selected • {duration} nights</span>
                </div>
              )}
            </div>
          </div>

          {/* Right column (desktop) */}
          <div className="hidden sm:flex w-[240px] md:w-[270px] py-4 pr-5 pl-4 border-l border-gray-100 flex-col justify-between">
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
                className="mt-3 inline-flex w-full items-center justify-center bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold py-2.5 rounded text-sm transition-colors"
              >
                See availability
              </Link>
            </div>
          </div>

          {/* Mobile CTA row */}
          <div className="sm:hidden px-4 pb-4">
            <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                {renderStars(displayRating)}
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">{priceLabelTop}</div>
                <div className="text-[22px] font-semibold text-gray-900 leading-tight">{priceDisplay}</div>
                <div className="text-[11px] text-gray-500">
                  {priceLabelBottom}{guestsCount ? `, ${guestsCount} guest${guestsCount !== 1 ? 's' : ''}` : ''}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Includes taxes and charges</div>
              </div>
            </div>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center bg-[#006ce4] hover:bg-[#0057b8] text-white font-bold py-3 rounded text-sm transition-colors"
            >
              See availability
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BookingProvider initialCheckin={initialCheckin} initialCheckout={initialCheckout}>
      <div className="min-h-screen bg-white">

        {/* ── Blue search strip — z-index so the translated search bar + dropdowns stack above the body (map iframes, listing images) ── */}
        <div className="relative z-30 bg-[#003580] pt-5 pb-0">
          <div className="max-w-6xl mx-auto px-4">
            <CategoryTabs value={category} onChange={setCategory} />
            <div className="translate-y-1/2">
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

        {/* White spacer — absorbs the bottom half of the pill + breadcrumb */}
        <div className="bg-white pt-10 pb-4">
          <div className="max-w-6xl mx-auto px-4">
            {/* Breadcrumb — same left spacing as nav tabs and search bar content */}
            <nav className="flex items-center flex-wrap gap-y-1 text-sm pl-6" aria-label="Breadcrumb">
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
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex gap-6 items-start">

            {/* ── Sidebar (desktop) ──────────────────────────────────── */}
            <aside className="hidden md:block w-64 xl:w-72 flex-shrink-0 sticky top-4">
              {sidebar}
            </aside>

            {/* ── Results ────────────────────────────────────────────── */}
            <main className="flex-1 min-w-0">
              {/* Results header (aligned with results column) */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900 mb-3">
                  {loading ? (
                    <span className="text-gray-400 text-base font-normal">Searching…</span>
                  ) : (
                    <>
                      {filters.location ? <>{filters.location}: </> : null}
                      {filteredByRating.length} {filteredByRating.length === 1 ? 'gym' : 'gyms'} found
                    </>
                  )}
                </h1>

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
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex h-44">
                      <div className="w-[220px] bg-gray-200 animate-pulse flex-shrink-0" />
                      <div className="flex-1 p-4 space-y-3">
                        <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredByRating.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-700">No gyms found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or searching a different destination.</p>
                  <button type="button" onClick={clearFilters} className="mt-4 text-[#006ce4] text-sm hover:underline">
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredByRating.map(gym => renderCard(gym))}
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
                  Show {filteredByRating.length} result{filteredByRating.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </BookingProvider>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f2f6fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
