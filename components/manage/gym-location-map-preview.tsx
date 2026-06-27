'use client'

import { useMemo } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

function parseCoord(value: string): number | null {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : null
}

export function GymLocationMapPreview({
  address,
  city,
  country,
  latitude,
  longitude,
  googleMapsLink,
  className,
}: {
  address: string
  city: string
  country: string
  latitude: string
  longitude: string
  googleMapsLink: string
  className?: string
}) {
  const lat = parseCoord(latitude)
  const lng = parseCoord(longitude)
  const hasCoords = lat !== null && lng !== null

  const placeLabel = useMemo(
    () => [address, city, country].map((part) => part.trim()).filter(Boolean).join(', '),
    [address, city, country],
  )

  const embedUrl = useMemo(() => {
    if (!hasCoords) return null
    const padLng = 0.009
    const padLat = 0.007
    const bbox = `${lng - padLng},${lat - padLat},${lng + padLng},${lat + padLat}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`
  }, [hasCoords, lat, lng])

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="mb-4">
        <p className="text-base font-semibold text-gray-900">Map preview</p>
        <p className="mt-1 text-sm text-gray-500">
          Guests use this area on your public listing. Search above or adjust the pin to place it accurately.
        </p>
      </div>

      <div className="relative aspect-[4/3] min-h-[14rem] overflow-hidden rounded-3xl bg-gray-100 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 sm:min-h-[18rem]">
        {embedUrl ? (
          <iframe
            title="Gym location map preview"
            src={embedUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <MapPin className="h-5 w-5 text-gray-500" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">No map pin yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Search for your address on the left, or enter latitude and longitude under advanced options.
              </p>
            </div>
          </div>
        )}
      </div>

      {placeLabel ? (
        <p className="mt-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">Shown as:</span> {placeLabel}
        </p>
      ) : null}

      {hasCoords ? (
        <p className="mt-1 text-xs text-gray-500 tabular-nums">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      ) : null}

      {googleMapsLink.trim() ? (
        <a
          href={googleMapsLink.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#003580] hover:underline"
        >
          Open Google Maps listing
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  )
}
