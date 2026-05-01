'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCurrency } from '@/lib/contexts/currency-context'
import { useBooking } from '@/lib/contexts/booking-context'
import { SaveButton } from '@/components/save-button'
import { ResponsiveGymImage } from '@/components/responsive-gym-image'
import { Star, MapPin } from 'lucide-react'
import { getGuestSaves } from '@/lib/guest-saves'

type GymRow = {
  gym_id: string
  gym: any
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth()
  const { convertPrice, formatPrice } = useCurrency()
  const { checkin, checkout } = useBooking()
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
      if (isFull) return <Star key={i} className="h-3 w-3 text-[#febb02] fill-[#febb02]" />
      if (isHalf) {
        return (
          <span key={i} className="relative inline-flex h-3 w-3">
            <Star className="absolute inset-0 h-3 w-3 text-gray-300 fill-gray-200" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-3 w-3 text-[#febb02] fill-[#febb02]" />
            </span>
          </span>
        )
      }
      return <Star key={i} className="h-3 w-3 text-gray-300 fill-gray-200" />
    })
  }

  const gymHref = (gymId: string) =>
    `/gyms/${gymId}${checkin && checkout ? `?checkin=${checkin}&checkout=${checkout}` : ''}`

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white pb-16 pt-8 md:pb-12 md:pt-10">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 h-9 w-56 animate-pulse rounded-md bg-gray-100" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="h-24 w-28 flex-shrink-0 animate-pulse rounded-lg bg-gray-100 sm:h-28 sm:w-32" />
                <div className="min-w-0 flex-1 space-y-2 py-0.5">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-50" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-16 pt-8 md:pb-12 md:pt-10">
      <div className="mx-auto max-w-3xl px-4">
        <header className={rows.length === 0 ? 'pt-12 md:pt-16' : 'mb-8 border-b border-gray-100 pb-6'}>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">
            Saved gyms
          </h1>
          {rows.length > 0 && (
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              {rows.length} {rows.length === 1 ? 'property' : 'properties'} you’re watching
            </p>
          )}
        </header>

        {isGuest && rows.length > 0 && (
          <div className="mb-8 flex flex-col gap-3 rounded-xl border border-[#003580]/20 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm leading-relaxed text-gray-800">
              <span className="font-medium text-gray-900">Sign in</span> to sync saved gyms across
              your devices.
            </p>
            <Link
              href="/auth/signin?redirect=/saved"
              className="inline-flex flex-shrink-0 items-center justify-center rounded-lg bg-[#003580] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002d66]"
            >
              Sign in
            </Link>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="mt-12 max-w-md md:mt-14">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-gray-950">
              Start saving gyms you like
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {isGuest
                ? 'Tap the heart on any gym to save it on this device. Log in when you want to keep saved gyms across devices.'
                : 'Tap the heart on any gym to save it here and compare options before you book.'}
            </p>
            <Link
              href="/search"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#003580] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#002d66]"
            >
              Explore gyms
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {rows.map(({ gym_id, gym }, idx) => {
              if (!gym) return null
              const images =
                gym.images && Array.isArray(gym.images)
                  ? [...gym.images].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                  : []
              const avg =
                typeof gym.averageRating === 'number'
                  ? gym.averageRating
                  : gym.reviews?.length
                    ? gym.reviews.reduce((s: number, r: any) => s + r.rating, 0) /
                      gym.reviews.length
                    : getFallbackRating(gym_id)
              const display = Math.round(avg * 2) / 2
              const hasReviews =
                (typeof gym.reviewCount === 'number' && gym.reviewCount > 0) ||
                (gym.reviews && gym.reviews.length > 0)
              const reviewCount = gym.reviewCount ?? gym.reviews?.length ?? 0

              return (
                <li key={gym_id}>
                  <Link
                    href={gymHref(gym_id)}
                    className="flex gap-4 p-4 transition-colors hover:bg-gray-50/80 sm:gap-5 sm:p-5"
                  >
                    <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-36">
                      {images.length > 0 ? (
                        <ResponsiveGymImage
                          image={images[0]}
                          alt={gym.name}
                          sizes="(max-width: 640px) 112px, 144px"
                          priority={idx < 3}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                          No photo
                        </div>
                      )}
                      <SaveButton
                        gymId={gym_id}
                        initialSaved
                        onSaveChange={(_, saved) => !saved && removeFromList(gym_id)}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                      <div>
                        <h3 className="font-semibold leading-snug text-gray-900 line-clamp-2 sm:text-base">
                          {gym.name}
                        </h3>
                        <p className="mt-1 flex items-start gap-1 text-sm text-gray-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <span className="line-clamp-2">
                            {gym.city}, {gym.country}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold tabular-nums text-gray-900">
                            {display.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-0.5">{renderStars(display)}</span>
                          {hasReviews ? (
                            <span className="text-sm text-gray-500">
                              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No reviews yet</span>
                          )}
                          {(gym.verification_status === 'verified' ||
                            gym.verification_status === 'trusted') && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2 text-right sm:text-left">
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-base font-semibold tabular-nums text-gray-900 sm:text-lg">
                          {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                          <span className="text-sm font-normal text-gray-500"> / night</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
