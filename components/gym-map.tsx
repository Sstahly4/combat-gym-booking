'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, MapPin, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { Gym } from '@/lib/types/database'
import { gymImageCardSrc } from '@/lib/images/gym-image-variants'

interface GymMapProps {
  gym: Gym & { images?: { url: string; variants?: { w400?: string; w800?: string; w1200?: string } | null }[] }
  googleMapsKey: string
}

function buildPlaceQuery(gym: GymMapProps['gym']): string | null {
  if (gym.address) return gym.address
  if (gym.name && gym.city) return `${gym.name}, ${gym.city}, ${gym.country}`
  if (gym.latitude && gym.longitude) return `${gym.latitude},${gym.longitude}`
  return null
}

function MapPlaceholder({
  placeQuery,
  onOpen,
  className = 'h-48 md:h-64',
}: {
  placeQuery: string
  onOpen: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full border rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 relative cursor-pointer group text-left ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
        <div className="rounded-full bg-white/90 p-3 shadow-sm border border-slate-200">
          <MapPin className="w-6 h-6 text-[#003580]" />
        </div>
        <p className="text-xs md:text-sm text-slate-600 text-center line-clamp-2 max-w-[90%]">
          {placeQuery}
        </p>
        <span className="text-xs font-medium text-[#003580] group-hover:underline">Show on map</span>
      </div>
    </button>
  )
}

function MapEmbed({
  mapUrl,
  className,
  onLoad,
}: {
  mapUrl: string
  className?: string
  onLoad?: () => void
}) {
  return (
    <iframe
      width="100%"
      height="100%"
      frameBorder="0"
      scrolling="no"
      marginHeight={0}
      marginWidth={0}
      src={mapUrl}
      className={className}
      onLoad={onLoad}
      title="Gym location map"
    />
  )
}

export function GymMap({ gym, googleMapsKey }: GymMapProps) {
  const [open, setOpen] = useState(false)
  const [previewEmbedActive, setPreviewEmbedActive] = useState(false)
  const [modalEmbedActive, setModalEmbedActive] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [modalLoading, setModalLoading] = useState(true)
  const previewBoxRef = useRef<HTMLDivElement>(null)
  const { convertPrice, formatPrice } = useCurrency()

  const apiKey =
    googleMapsKey ||
    (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '') ||
    ''

  const placeQuery = useMemo(() => buildPlaceQuery(gym), [gym])

  const mapUrl = useMemo(() => {
    if (!apiKey || !placeQuery) return null
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeQuery)}&zoom=16&maptype=roadmap`
  }, [apiKey, placeQuery])

  // Lazy-load preview iframe when the map block scrolls near the viewport (all breakpoints).
  useEffect(() => {
    if (!mapUrl || previewEmbedActive) return
    const node = previewBoxRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPreviewEmbedActive(true)
          observer.disconnect()
        }
      },
      // Bottom-only margin: enough to reduce spinner visibility without firing
      // during fast mid-page scroll (500px caused main-thread jank with Maps JS).
      { rootMargin: '0px 0px 200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [mapUrl, previewEmbedActive])

  useEffect(() => {
    if (open) setModalEmbedActive(true)
  }, [open])

  if (!apiKey) {
    return (
      <div className="mt-6 border rounded-lg h-64 bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Map unavailable - API key missing. Please restart your dev server.</p>
      </div>
    )
  }

  if (!placeQuery || !mapUrl) {
    return (
      <div className="mt-6 border rounded-lg h-64 bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Location information unavailable</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-0 md:mt-6">
        <div
          ref={previewBoxRef}
          className="border rounded-lg overflow-hidden min-h-[12rem] h-48 md:h-64 bg-gray-100 relative cursor-pointer group"
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        >
          {previewEmbedActive ? (
            <>
              {previewLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                  <div className="w-12 h-12 rounded-full border-4 border-[#003580] border-t-transparent animate-spin" />
                </div>
              )}
              <MapEmbed
                mapUrl={mapUrl}
                className="w-full h-full pointer-events-none"
                onLoad={() => setPreviewLoading(false)}
              />
            </>
          ) : (
            <MapPlaceholder placeQuery={placeQuery} onOpen={() => setOpen(true)} className="h-full border-0 rounded-none" />
          )}
          {previewEmbedActive && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
              <Button
                variant="secondary"
                className="shadow-lg text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 pointer-events-auto md:flex"
              >
                Show on map
              </Button>
            </div>
          )}
        </div>

        <div className="md:hidden mt-3 space-y-2">
          <p className="text-sm text-gray-900">
            {gym.address || `${gym.city}, ${gym.country}`}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">—</span>
            <span className="text-sm text-green-600 font-medium">Excellent location</span>
          </div>
          <Button
            variant="outline"
            className="w-full border-[#003580] text-[#003580] hover:bg-[#003580] hover:text-white text-sm font-medium mt-2"
            onClick={() => setOpen(true)}
          >
            Show on map
          </Button>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (isOpen) {
            setModalLoading(true)
            setModalEmbedActive(true)
          }
        }}
      >
        <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-[100vw] !h-[100vh] p-0 overflow-hidden bg-white !m-0 !rounded-none">
          <div className="relative w-full h-full">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-white rounded-full shadow-lg hover:bg-gray-100 border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            <div className="md:hidden absolute bottom-0 left-0 right-0 z-50 p-4 pb-6">
              <Card className="shadow-2xl border border-gray-200 overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-3 flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {gym.images && gym.images.length > 0 && (
                        <img
                          src={gymImageCardSrc(gym.images[0])}
                          alt={gym.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-[#003580] mb-1 line-clamp-1">{gym.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-1">{gym.address || `${gym.city}, ${gym.country}`}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-lg font-bold text-[#003580]">
                            {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                          </p>
                          <p className="text-[10px] text-gray-500">per session</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold text-xs px-4 py-2 h-8 flex items-center gap-1"
                          onClick={() => setOpen(false)}
                        >
                          View
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="hidden md:block absolute top-2 left-2 z-50 w-96 max-h-[85vh] overflow-y-auto">
              <Card className="shadow-xl border-0 overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {gym.images && gym.images.length > 0 && (
                        <img
                          src={gymImageCardSrc(gym.images[0])}
                          alt={gym.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-[#003580] mb-1 line-clamp-2">{gym.name}</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#003580] text-white px-1.5 py-0.5 rounded text-xs font-bold">8.4</div>
                          <span className="text-xs text-gray-600">Very good</span>
                        </div>
                        <div className="text-xs text-gray-600">8.9 Location</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t" />
                  <div className="p-4">
                    <div className="text-sm text-gray-700 mb-3">
                      <p className="font-medium">Training Session</p>
                      <p className="text-gray-600">1 session, 1 adult</p>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-2xl font-bold text-[#003580]">
                          {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                        </p>
                        <p className="text-xs text-gray-600 mb-2">Includes taxes and charges</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#003580] hover:bg-[#003580]/90 text-white font-semibold whitespace-nowrap flex items-center gap-1 self-start"
                        onClick={() => setOpen(false)}
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="border-t" />
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-500">{gym.address || `${gym.city}, ${gym.country}`}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {modalEmbedActive && modalLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
                <div className="w-16 h-16 rounded-full border-4 border-[#003580] border-t-transparent animate-spin" />
              </div>
            )}

            {modalEmbedActive && (
              <MapEmbed
                mapUrl={mapUrl}
                className="w-full h-full border-0"
                onLoad={() => setModalLoading(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
