'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { calculateEstimatedPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Gym, GymImage } from '@/lib/types/database'
import { Filter, X, Star } from 'lucide-react'
import Image from 'next/image'
import { Check } from 'lucide-react'

const DISCIPLINES = ['Muay Thai', 'MMA', 'BJJ', 'Boxing', 'Wrestling', 'Kickboxing']
const COUNTRIES = ['Thailand', 'Bali', 'Australia']
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced']

// Parse query to extract location and discipline
function parseSearchQuery(query: string): { location: string; discipline: string } {
  if (!query.trim()) return { location: '', discipline: '' }
  
  let foundDiscipline = ''
  const queryLower = query.toLowerCase()
  
  for (const disc of DISCIPLINES) {
    const discLower = disc.toLowerCase()
    if (queryLower.includes(discLower)) {
      foundDiscipline = disc
      break
    }
    if (discLower === 'bjj' && (queryLower.includes('jiu jitsu') || queryLower.includes('jiujitsu'))) {
      foundDiscipline = disc
      break
    }
    if (discLower === 'muay thai' && (queryLower.includes('muaythai') || queryLower.includes('muay'))) {
      foundDiscipline = disc
      break
    }
  }
  
  let location = query
  if (foundDiscipline) {
    location = query
      .replace(new RegExp(foundDiscipline, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  return {
    location: location || '',
    discipline: foundDiscipline || ''
  }
}

interface GymWithImages extends Gym {
  images: GymImage[]
  average_rating?: number
  review_count?: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [gyms, setGyms] = useState<GymWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Parse query parameter if present (from unified search)
  const queryParam = searchParams.get('query') || ''
  const parsedQuery = parseSearchQuery(queryParam)
  
  // Prioritize direct URL params over parsed query (for destination links)
  const initialLocation = searchParams.get('location') || parsedQuery.location
  const initialDiscipline = searchParams.get('discipline') || parsedQuery.discipline

  const [filters, setFilters] = useState({
    location: initialLocation,
    discipline: initialDiscipline,
    country: searchParams.get('country') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    accommodation: searchParams.get('accommodation') === 'true',
    checkin: searchParams.get('checkin') || '',
    checkout: searchParams.get('checkout') || '',
  })

  // Update filters when search params change (e.g., from unified search)
  useEffect(() => {
    const queryParam = searchParams.get('query') || ''
    if (queryParam) {
      const parsed = parseSearchQuery(queryParam)
      setFilters(prev => ({
        ...prev,
        location: parsed.location || searchParams.get('location') || prev.location,
        discipline: parsed.discipline || searchParams.get('discipline') || prev.discipline,
        country: searchParams.get('country') || prev.country,
      }))
    } else {
      // If no query param, use individual location/discipline params
      setFilters(prev => ({
        ...prev,
        location: searchParams.get('location') || prev.location,
        discipline: searchParams.get('discipline') || prev.discipline,
        country: searchParams.get('country') || prev.country,
      }))
    }
  }, [searchParams])

  useEffect(() => {
    fetchGyms()
  }, [filters])

  const fetchGyms = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('gyms')
      .select(`
        *,
        images:gym_images(*)
      `)
      .eq('verification_status', 'verified') // Only show verified gyms
      .eq('status', 'approved') // Keep legacy check for compatibility

    // Apply filters
    if (filters.location) {
      query = query.or(`city.ilike.%${filters.location}%,country.ilike.%${filters.location}%`)
    }

    if (filters.country) {
      query = query.ilike('country', `%${filters.country}%`)
    }

    if (filters.discipline) {
      query = query.contains('disciplines', [filters.discipline])
    }

    if (filters.minPrice) {
      query = query.gte('price_per_day', parseFloat(filters.minPrice))
    }

    if (filters.maxPrice) {
      query = query.lte('price_per_day', parseFloat(filters.maxPrice))
    }

    if (filters.accommodation) {
      query = query.eq('amenities->accommodation', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching gyms:', error)
    } else {
      const gymsRaw = (data || [])

      // Fetch review stats for these gyms (client-side aggregate)
      const ids = gymsRaw.map((g: any) => g.id).filter(Boolean)
      let statsByGym: Record<string, { avg: number; count: number }> = {}
      if (ids.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('gym_id, rating')
          .in('gym_id', ids)

        const byGym: Record<string, number[]> = {}
        reviews?.forEach((r: any) => {
          if (!r?.gym_id || typeof r.rating !== 'number') return
          if (!byGym[r.gym_id]) byGym[r.gym_id] = []
          byGym[r.gym_id].push(r.rating)
        })

        Object.entries(byGym).forEach(([gymId, ratings]) => {
          const avg = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0
          statsByGym[gymId] = { avg, count: ratings.length }
        })
      }

      // Process data
      const processedGyms = gymsRaw.map((gym: any) => {
        // Sort images by order column to ensure consistent ordering
        const sortedImages = (gym.images || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        const stats = statsByGym[gym.id]
        return {
          ...gym,
          images: sortedImages,
          average_rating: stats?.avg || 0,
          review_count: stats?.count || 0,
        }
      })

      setGyms(processedGyms)
    }
    setLoading(false)
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: '',
      discipline: '',
      country: filters.country,
      minPrice: '',
      maxPrice: '',
      experienceLevel: '',
      accommodation: false,
      checkin: filters.checkin,
      checkout: filters.checkout,
    })
  }

  const gymsCountText = useMemo(() => {
    if (loading) return 'Searching…'
    return `${gyms.length} gyms`
  }, [gyms.length, loading])

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating * 2) / 2
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1
          const isFull = rounded >= starValue
          const isHalf = !isFull && rounded >= starValue - 0.5
          if (isFull) {
            return <Star key={i} className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
          }
          if (isHalf) {
            return (
              <span key={i} className="relative inline-flex w-3 h-3">
                <Star className="absolute inset-0 w-3 h-3 text-gray-300 fill-gray-200" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
                </span>
              </span>
            )
          }
          return <Star key={i} className="w-3 h-3 text-gray-300 fill-gray-200" />
        })}
      </div>
    )
  }

  const getFallbackRating = (gymId: string): number => {
    // Deterministic fallback rating between 3.5 and 5.0 (half-star increments)
    const str = String(gymId || 'gym')
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    const step = hash % 4 // 3.5, 4.0, 4.5, 5.0
    return Math.min(5.0, 3.5 + step * 0.5)
  }

  const ratingLabel = (rating: number) => {
    if (rating >= 4.8) return 'Exceptional'
    if (rating >= 4.3) return 'Very good'
    if (rating >= 3.8) return 'Good'
    if (rating >= 3.3) return 'Pleasant'
    return 'Okay'
  }

  const FiltersPanel = (
    <Card className="md:sticky md:top-4">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            type="button"
            className="md:hidden p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="City or Country"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discipline">Discipline</Label>
          <Select
            id="discipline"
            value={filters.discipline}
            onChange={(e) => handleFilterChange('discipline', e.target.value)}
          >
            <option value="">All Disciplines</option>
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Price Range (per day)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            id="experienceLevel"
            value={filters.experienceLevel}
            onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
          >
            <option value="">All Levels</option>
            {EXPERIENCE_LEVELS.map(level => (
              <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.accommodation}
              onChange={(e) => handleFilterChange('accommodation', e.target.checked)}
              className="rounded"
            />
            <span>Accommodation Included</span>
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={clearFilters}
          >
            Clear
          </Button>
          <Button
            className="flex-1 md:hidden bg-[#003580] hover:bg-[#003580]/90"
            onClick={() => setMobileFiltersOpen(false)}
          >
            Show results
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Filters Sidebar */}
          <aside className="hidden md:block w-80 flex-shrink-0">
            {FiltersPanel}
          </aside>

          {/* Results */}
          <main className="flex-1">
            {/* Mobile sticky header */}
            <div className="md:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-base font-semibold text-gray-900 leading-tight">Explore gyms</h1>
                  <p className="text-xs text-gray-600 mt-0.5">{gymsCountText}</p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-3"
                  onClick={() => setMobileFiltersOpen(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden md:block mb-4">
              <h1 className="text-2xl font-bold">
                {gyms.length} Gyms Found
              </h1>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <div className="aspect-video bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : gyms.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No gyms found. Try adjusting your filters.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {gyms.map(gym => (
                  <Link key={gym.id} href={`/gyms/${gym.id}${filters.checkin && filters.checkout ? `?checkin=${filters.checkin}&checkout=${filters.checkout}` : ''}`}>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden">
                      {/* Mobile: horizontal card. Desktop: vertical card. */}
                      <div className="flex md:block">
                        <div className="relative w-40 sm:w-48 md:w-full md:aspect-video aspect-[4/3] bg-gray-200 flex-shrink-0 overflow-hidden">
                          {gym.images.length > 0 ? (
                            <Image
                              src={gym.images[0].url}
                              alt={gym.name}
                              fill
                              sizes="(max-width: 768px) 160px, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 md:p-4 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-[15px] md:text-lg mb-0.5 line-clamp-1 text-gray-900">{gym.name}</h3>
                              <p className="text-xs md:text-sm text-gray-600 line-clamp-1">
                                {gym.city}, {gym.country}
                              </p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <Check className="w-3 h-3 text-green-600" />
                                <span className="text-[10px] text-gray-600 font-medium">Verified</span>
                              </div>
                            </div>

                            {(() => {
                              const hasReviews = (gym.review_count || 0) > 0 && (gym.average_rating || 0) > 0
                              const rawRating = hasReviews ? (gym.average_rating as number) : getFallbackRating(gym.id)
                              const displayRating = Math.round(rawRating * 2) / 2
                              const displayCount = hasReviews ? (gym.review_count as number) : 0

                              return (
                                <div className="flex-shrink-0 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="bg-[#003580] text-white px-2 py-1 rounded text-xs font-bold">
                                      {displayRating.toFixed(1)}
                                    </div>
                                    <span className="text-[10px] text-gray-700">
                                      {hasReviews ? ratingLabel(displayRating) : 'Exceptional'}
                                    </span>
                                    {hasReviews && (
                                      <span className="hidden sm:inline text-[10px] text-gray-500">
                                        {displayCount} verified reviews
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center justify-end gap-2">
                                    {renderStars(displayRating)}
                                    <span className="text-[10px] text-gray-500">{displayRating.toFixed(1)}</span>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap mt-3">
                            {gym.disciplines.slice(0, 2).map(d => (
                              <span key={d} className="text-[10px] md:text-xs bg-blue-50 text-[#003580] px-2 py-1 rounded">
                                {d}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-end justify-between mt-3">
                            <div className="text-right ml-auto">
                              {(() => {
                                const duration = (filters.checkin && filters.checkout)
                                  ? Math.floor((new Date(filters.checkout).getTime() - new Date(filters.checkin).getTime()) / (1000 * 60 * 60 * 24))
                                  : 0

                                const estimatedPrice = duration > 0 ? calculateEstimatedPrice(duration, {
                                  daily: gym.price_per_day,
                                  weekly: gym.price_per_week,
                                  monthly: gym.price_per_month
                                }) : null

                                return (
                                  <div>
                                    <div className="text-[10px] text-gray-500">
                                      {estimatedPrice ? 'Estimated total' : 'Starting from'}
                                    </div>
                                    <div className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                                      {estimatedPrice ? estimatedPrice.toFixed(0) : gym.price_per_day} {gym.currency}
                                    </div>
                                    <div className="text-[11px] text-gray-600">
                                      {estimatedPrice ? `for ${duration} nights` : '/ session'}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filters bottom sheet */}
      {mobileFiltersOpen && (
        <>
          <button
            type="button"
            aria-label="Close filters"
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden animate-slide-up bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[85vh] overflow-y-auto">
            {FiltersPanel}
          </div>
        </>
      )}
    </div>
  )
}
