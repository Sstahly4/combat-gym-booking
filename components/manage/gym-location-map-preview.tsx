'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

function parseCoord(value: string): number | null {
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : null
}

export type LocationMapQueryLevel = 'pin' | 'address' | 'city' | 'country'

export type LocationMapQuery = {
  query: string
  level: LocationMapQueryLevel
}

/** Match public gym page — pin, street, then city/country (country alone still maps). */
export function buildLocationPlaceQuery({
  address,
  city,
  country,
  latitude,
  longitude,
}: {
  address: string
  city: string
  country: string
  latitude: string
  longitude: string
}): LocationMapQuery | null {
  const lat = parseCoord(latitude)
  const lng = parseCoord(longitude)
  if (lat !== null && lng !== null) {
    return { query: `${lat},${lng}`, level: 'pin' }
  }

  const street = address.trim()
  const cityTrim = city.trim()
  const countryTrim = country.trim()

  if (street) return { query: street, level: 'address' }
  if (cityTrim && countryTrim) return { query: `${cityTrim}, ${countryTrim}`, level: 'city' }
  if (cityTrim) return { query: cityTrim, level: 'city' }
  if (countryTrim) return { query: countryTrim, level: 'country' }

  return null
}

function zoomForLevel(level: LocationMapQueryLevel): number {
  switch (level) {
    case 'pin':
    case 'address':
      return 16
    case 'city':
      return 11
    case 'country':
      return 5
  }
}

function osmEmbedUrl(lat: number, lng: number, level: LocationMapQueryLevel): string {
  const padLng = level === 'country' ? 8 : level === 'city' ? 0.12 : 0.009
  const padLat = level === 'country' ? 6 : level === 'city' ? 0.09 : 0.007
  const bbox = `${lng - padLng},${lat - padLat},${lng + padLng},${lat + padLat}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`
}

function googleEmbedUrl(apiKey: string, query: string, level: LocationMapQueryLevel): string {
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=${zoomForLevel(level)}&maptype=roadmap`
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
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number } | null>(null)

  const lat = parseCoord(latitude)
  const lng = parseCoord(longitude)
  const hasCoords = lat !== null && lng !== null

  const place = useMemo(
    () => buildLocationPlaceQuery({ address, city, country, latitude, longitude }),
    [address, city, country, latitude, longitude],
  )

  const placeLabel = useMemo(
    () => [address, city, country].map((part) => part.trim()).filter(Boolean).join(', '),
    [address, city, country],
  )

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

  useEffect(() => {
    if (!place || hasCoords || googleMapsKey) {
      setGeocoded(null)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/geo/address-search?q=${encodeURIComponent(place.query)}`)
          const data = (await res.json()) as {
            results?: Array<{ lat: string; lon: string }>
          }
          if (cancelled) return
          const hit = data.results?.[0]
          const hitLat = hit?.lat ? parseFloat(hit.lat) : NaN
          const hitLng = hit?.lon ? parseFloat(hit.lon) : NaN
          if (Number.isFinite(hitLat) && Number.isFinite(hitLng)) {
            setGeocoded({ lat: hitLat, lng: hitLng })
          } else {
            setGeocoded(null)
          }
        } catch {
          if (!cancelled) setGeocoded(null)
        }
      })()
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [googleMapsKey, hasCoords, place])

  const mapUrl = useMemo(() => {
    if (!place) return null

    if (googleMapsKey) {
      return googleEmbedUrl(googleMapsKey, place.query, place.level)
    }

    if (hasCoords && lat !== null && lng !== null) {
      return osmEmbedUrl(lat, lng, place.level)
    }

    if (geocoded) {
      return osmEmbedUrl(geocoded.lat, geocoded.lng, place.level)
    }

    return null
  }, [geocoded, googleMapsKey, hasCoords, lat, lng, place])

  const showLoading = Boolean(place && !mapUrl)

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="mb-4">
        <p className="text-base font-semibold text-gray-900">Map preview</p>
        <p className="mt-1 text-sm text-gray-500">Updates as you edit — same map guests see on your listing.</p>
      </div>

      <div className="relative aspect-[4/3] min-h-[14rem] overflow-hidden rounded-3xl bg-gray-100 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 sm:min-h-[18rem]">
        {mapUrl ? (
          <iframe
            title="Gym location map preview"
            src={mapUrl}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : showLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <MapPin className="h-5 w-5 text-[#003580] animate-pulse" aria-hidden />
            </span>
            <p className="text-sm font-medium text-gray-800">{place?.query}</p>
            <p className="text-sm text-gray-500">Loading map…</p>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <MapPin className="h-5 w-5 text-gray-500" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800">No location yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Search for your gym or enter a city and country to see the map.
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

      {hasCoords && lat !== null && lng !== null ? (
        <p className="mt-1 text-xs text-gray-500 tabular-nums">
          Pin: {lat.toFixed(5)}, {lng.toFixed(5)}
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
