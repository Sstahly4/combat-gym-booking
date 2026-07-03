'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { GymGallery } from '@/components/gym-gallery'
import { GymGalleryMobileWrapper } from '@/components/gym-gallery-mobile-wrapper'
import { GymDescription } from '@/components/gym-description'
import { PackagesList } from '@/components/packages-list'
import { listingSectionClass } from '@/components/manage/gym-edit-section'
import { manageGymEditHref } from '@/lib/navigation/manage-gym-edit-return'
import { formatLandmarksText } from '@/lib/utils/landmarks'
import { ExternalLink, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Gym, GymImage, Package } from '@/lib/types/database'

type PreviewGym = Gym & {
  images: GymImage[]
  packages: Package[]
  reviews: unknown[]
  owner?: { full_name: string | null }
}

export function GymListingPreviewEmbed({ gymId }: { gymId: string }) {
  const [data, setData] = useState<{ gym: PreviewGym } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/manage/gym/${gymId}/preview-data`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error || 'Could not load preview')
          setData(null)
          return
        }
        setData(json)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load preview')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [gymId])

  if (loading) {
    return (
      <div className={cn(listingSectionClass, 'overflow-hidden p-0')}>
        <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-3">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-4 p-5">
          <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-gray-100" />
          <div className="aspect-[16/10] animate-pulse rounded-xl bg-gray-100" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error || !data?.gym) {
    return (
      <div className={cn(listingSectionClass, 'p-6 text-sm text-gray-600')}>
        <p>{error || 'Preview unavailable.'}</p>
        <Link href={manageGymEditHref(gymId, { section: 'basic' })} className="mt-3 inline-block font-medium text-[#003580]">
          Back to property details
        </Link>
      </div>
    )
  }

  const gym = data.gym
  const packages = Array.isArray(gym.packages) ? gym.packages : []
  const images = gym.images || []
  const landmarks =
    gym.nearby_attractions && Array.isArray(gym.nearby_attractions) && gym.nearby_attractions.length > 0
      ? gym.nearby_attractions
      : []
  const landmarksText = formatLandmarksText(landmarks)
  const isDraft = gym.verification_status === 'draft'
  const canShowPublicLink = gym.status === 'approved' && gym.is_live

  return (
    <BookingProvider>
      <div className={cn(listingSectionClass, 'overflow-hidden p-0')}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">Guest view</p>
            <p className="text-xs text-gray-500">
              {isDraft
                ? 'Draft listing — not public until verification is complete.'
                : canShowPublicLink
                  ? 'Matches your live listing layout.'
                  : 'Preview of your public page.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canShowPublicLink ? (
              <a
                href={`/gyms/${gym.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                Open live page
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <div className="max-h-[min(78vh,56rem)] overflow-y-auto overscroll-contain bg-white">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{gym.name || 'Untitled gym'}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <span>
                {gym.city || 'City'}, {gym.country || 'Country'}
              </span>
              {gym.address ? <span className="text-gray-500">· {gym.address}</span> : null}
            </div>
          </div>

          <div className="md:hidden">
            {images.length > 0 ? (
              <GymGalleryMobileWrapper images={images} gymName={gym.name} />
            ) : (
              <div className="mx-4 my-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No photos yet —{' '}
                <Link href={manageGymEditHref(gym.id, { section: 'images' })} className="font-medium text-[#003580]">
                  add photos
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-8 px-4 py-6 sm:px-6">
            <div className="hidden md:block">
              {images.length > 0 ? (
                <GymGallery images={images} gymName={gym.name} />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                  <p className="text-sm text-gray-600">No photos yet.</p>
                  <Link
                    href={manageGymEditHref(gym.id, { section: 'images' })}
                    className="mt-2 inline-block text-sm font-medium text-[#003580]"
                  >
                    Add photos
                  </Link>
                </div>
              )}
            </div>

            <GymDescription
              gymName={gym.name}
              description={gym.description}
              landmarksText={landmarksText}
              amenities={gym.amenities}
              disciplines={gym.disciplines}
            />

            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Packages</h3>
              {packages.length > 0 ? (
                <PackagesList packages={packages} gym={gym} />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-600">No packages yet.</p>
                  <Link
                    href={manageGymEditHref(gym.id, { section: 'packages' })}
                    className="mt-2 inline-block text-sm font-medium text-[#003580]"
                  >
                    Create an offer
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BookingProvider>
  )
}
