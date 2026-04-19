'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BookingProvider } from '@/lib/contexts/booking-context'
import { GymGallery } from '@/components/gym-gallery'
import { GymGalleryMobileWrapper } from '@/components/gym-gallery-mobile-wrapper'
import { GymDescription } from '@/components/gym-description'
import { PackagesList } from '@/components/packages-list'
import { MapPin, ExternalLink } from 'lucide-react'
import { ManageBreadcrumbs } from '@/components/manage/manage-breadcrumbs'
import { formatLandmarksText } from '@/lib/utils/landmarks'
import type { Gym, GymImage, Package } from '@/lib/types/database'

type PreviewGym = Gym & {
  images: GymImage[]
  packages: Package[]
  reviews: unknown[]
  owner?: { full_name: string | null }
}

export function GymListingPreviewInner() {
  const searchParams = useSearchParams()
  const gymId = searchParams.get('gym_id')
  const [data, setData] = useState<{ gym: PreviewGym } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gymId) {
      setLoading(false)
      setError('Missing gym. Open this page from the sidebar or add ?gym_id=.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/manage/gym/${gymId}/preview-data`, { cache: 'no-store' })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setError(json.error || 'Could not load listing')
          setData(null)
          return
        }
        setData(json)
        setError(null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load')
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
      <div className="px-4 py-10 max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !data?.gym) {
    return (
      <div className="px-4 py-10 max-w-2xl mx-auto">
        <p className="text-gray-700 mb-4">{error || 'Listing not available.'}</p>
        <Link href="/manage" className="text-[#003580] font-medium underline">
          Back to dashboard
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
      <div className="min-h-full bg-white pb-12">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
          <ManageBreadcrumbs
            items={[
              { label: 'Dashboard', href: '/manage' },
              { label: 'Listing preview' },
            ]}
          />
        </div>
        <div className="border-b border-gray-200 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing preview</p>
              <p className="text-sm text-slate-700">
                This is how your gym page is shaping up. Guests see the live site only when your listing is
                approved and live.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/manage/gym/edit?id=${gym.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#003580] px-3 py-2 text-sm font-medium text-white hover:bg-[#002a66]"
              >
                Edit gym
              </Link>
              {canShowPublicLink ? (
                <a
                  href={`/gyms/${gym.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Open public page
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {isDraft ? (
          <div className="bg-amber-50 border-b border-amber-200 py-2">
            <div className="max-w-6xl mx-auto px-4">
              <p className="text-xs md:text-sm text-amber-900 font-medium">
                Draft listing — not visible to the public until verification and go-live are complete.
              </p>
            </div>
          </div>
        ) : null}

        <div className="bg-white border-b border-gray-200 py-4 md:py-6">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-900">{gym.name || 'Untitled gym'}</h1>
                <div className="flex flex-wrap items-center gap-2 text-gray-600 mt-1 text-sm">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>
                    {gym.city || 'City'}, {gym.country || 'Country'}
                  </span>
                  {gym.address ? <span className="text-gray-500">· {gym.address}</span> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden w-full">
          {images.length > 0 ? (
            <GymGalleryMobileWrapper images={images} gymName={gym.name} />
          ) : (
            <div className="mx-4 mt-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">No photos yet</p>
              <p className="text-xs text-gray-500 mt-1">Add images in Edit gym → Photos</p>
              <Link href={`/manage/gym/edit?id=${gym.id}&section=images`} className="text-sm text-[#003580] font-medium mt-3 inline-block">
                Add photos
              </Link>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8">
          <div className="hidden md:block">
            {images.length > 0 ? (
              <GymGallery images={images} gymName={gym.name} />
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                <p className="text-gray-700 font-medium">No photos yet</p>
                <p className="text-sm text-gray-500 mt-1">Add a gallery so travelers can see your gym.</p>
                <Link
                  href={`/manage/gym/edit?id=${gym.id}&section=images`}
                  className="inline-block mt-4 text-sm font-medium text-[#003580] underline"
                >
                  Go to Photos
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

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">Packages</h2>
            {packages.length > 0 ? (
              <PackagesList packages={packages} gym={gym} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
                <p className="text-gray-700 font-medium">No packages yet</p>
                <p className="text-sm text-gray-500">Create at least one package so guests can book.</p>
                <div className="flex justify-center gap-3">
                  <div className="h-24 w-40 rounded-lg bg-gray-200/80 animate-pulse" />
                  <div className="h-24 w-40 rounded-lg bg-gray-200/80 animate-pulse hidden sm:block" />
                </div>
                <Link
                  href={`/manage/gym/edit?id=${gym.id}&section=packages`}
                  className="inline-block text-sm font-medium text-[#003580] underline"
                >
                  Add packages
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </BookingProvider>
  )
}
