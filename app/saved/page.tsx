'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrency } from '@/lib/contexts/currency-context'
import { Card, CardContent } from '@/components/ui/card'
import { SaveButton } from '@/components/save-button'
import { Check, Star, Heart } from 'lucide-react'
import { getGuestSaves } from '@/lib/guest-saves'

type GymRow = {
  gym_id: string
  gym: any
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth()
  const { convertPrice, formatPrice } = useCurrency()
  const [rows, setRows] = useState<GymRow[]>([])
  const [loading, setLoading] = useState(true)
  const isGuest = !authLoading && !user

  useEffect(() => {
    if (authLoading) return
    if (user) {
      fetchAuthSaved()
    } else {
      fetchGuestSaved()
    }
  }, [user, authLoading])

  const fetchAuthSaved = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_gyms')
      .select('id, gym_id, created_at, gym:gyms(*, images:gym_images(url, variants, order))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setRows((data || []).map((r: any) => ({ gym_id: r.gym_id, gym: r.gym })))
    }
    setLoading(false)
  }

  const fetchGuestSaved = async () => {
    const ids = getGuestSaves()
    if (ids.length === 0) {
      setRows([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from('gyms')
      .select('*, images:gym_images(url, variants, order)')
      .in('id', ids)

    if (data) {
      // Preserve saved order (most-recent-first matches localStorage order)
      const ordered = ids
        .map((id) => ({ gym_id: id, gym: data.find((g: any) => g.id === id) }))
        .filter((r) => r.gym)
      setRows(ordered)
    }
    setLoading(false)
  }

  const removeFromList = (gymId: string) => {
    setRows((prev) => prev.filter((r) => r.gym_id !== gymId))
  }

  const getFallbackRating = (gymId: string): number => {
    const str = String(gymId || 'gym')
    let hash = 0
    for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    const step = hash % 4
    return Math.min(5.0, 3.5 + step * 0.5)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1
      const isFull = rating >= starValue
      const isHalf = !isFull && rating >= starValue - 0.5
      if (isFull) return <Star key={i} className="w-3 h-3 text-[#febb02] fill-[#febb02]" />
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
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-white border border-gray-200">
                <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Gyms</h1>
        <p className="text-gray-600 mb-6">Gyms you've saved for later.</p>

        {/* Guest sign-in nudge */}
        {isGuest && rows.length > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Sign in</span> to keep your saved gyms across devices and sessions.
            </p>
            <Link
              href="/auth/signin?redirect=/saved"
              className="ml-4 flex-shrink-0 rounded-lg bg-[#003580] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d66]"
            >
              Sign in
            </Link>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No saved gyms yet</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              When you save a gym from the homepage or search, it will appear here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-[#003580] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d66]"
            >
              Browse gyms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rows.map(({ gym_id, gym }) => {
              if (!gym) return null
              const images = gym.images && Array.isArray(gym.images)
                ? [...gym.images].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                : []
              const avg = typeof gym.averageRating === 'number' ? gym.averageRating
                : (gym.reviews?.length
                  ? gym.reviews.reduce((s: number, r: any) => s + r.rating, 0) / gym.reviews.length
                  : getFallbackRating(gym_id))
              const display = Math.round(avg * 2) / 2
              const hasReviews = (typeof gym.reviewCount === 'number' && gym.reviewCount > 0)
                || (gym.reviews && gym.reviews.length > 0)

              return (
                <Link
                  key={gym_id}
                  href={`/gyms/${gym_id}`}
                  className="block"
                >
                  <Card className="h-full border border-gray-200 shadow-sm rounded-lg overflow-hidden group/card flex flex-col hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden flex-shrink-0">
                      {images.length > 0 ? (
                        <Image
                          src={images[0].url}
                          alt={gym.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gray-100 text-sm">
                          No Image
                        </div>
                      )}
                      <SaveButton
                        gymId={gym_id}
                        initialSaved
                        onSaveChange={(_, saved) => !saved && removeFromList(gym_id)}
                      />
                    </div>
                    <CardContent className="p-3 md:p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1 group-hover/card:underline mb-1">
                        {gym.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 mb-1 line-clamp-1">
                        {gym.city}, {gym.country}
                      </p>
                      <div className="flex items-center gap-1 mb-2 md:mb-3">
                        <Check className="w-3 h-3 text-green-600" />
                        <span className="text-[10px] md:text-xs text-gray-600 font-medium">Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 mb-4 md:mb-6 flex-wrap">
                        <div className="bg-[#003580] text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-bold">
                          {display.toFixed(1)}
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-700">
                          {hasReviews ? 'Very good' : 'Exceptional'}
                        </span>
                        {hasReviews && (
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {(gym.reviewCount ?? gym.reviews?.length ?? 0)} verified reviews
                          </span>
                        )}
                        <div className="w-full" />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">{renderStars(display)}</div>
                          <span className="text-[10px] md:text-xs text-gray-500">{display.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex justify-end items-end mt-auto pt-2">
                        <div className="text-right">
                          <p className="text-[10px] md:text-xs text-gray-500 mb-0.5">Starting from</p>
                          <p className="text-base md:text-lg font-bold text-gray-900 leading-tight">
                            {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
