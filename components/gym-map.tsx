'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrency } from '@/lib/contexts/currency-context'
import type { Gym } from '@/lib/types/database'

interface GymMapProps {
  gym: Gym & { images?: { url: string }[] }
  googleMapsKey: string
}

export function GymMap({ gym, googleMapsKey }: GymMapProps) {
  const [open, setOpen] = useState(false)
  const [isMapLoading, setIsMapLoading] = useState(true)
  const { convertPrice, formatPrice } = useCurrency()

  // Try to get key from prop first, then fallback to env var (for client-side)
  const apiKey = googleMapsKey || (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '') || ''

  if (!apiKey) {
    return (
      <div className="mt-6 border rounded-lg h-64 bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Map unavailable - API key missing. Please restart your dev server.</p>
      </div>
    )
  }

  // Priority: 1. Manual address (most reliable), 2. Name + city, 3. Coordinates
  let placeQuery: string | null = null
  
  if (gym.address) {
    // Use the manually entered address (most reliable)
    placeQuery = gym.address
  } else if (gym.name && gym.city) {
    // Fallback to name + city
    placeQuery = `${gym.name}, ${gym.city}, ${gym.country}`
  } else if (gym.latitude && gym.longitude) {
    // Last resort: coordinates
    placeQuery = `${gym.latitude},${gym.longitude}`
  }

  if (!placeQuery) {
    return (
      <div className="mt-6 border rounded-lg h-64 bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">Location information unavailable</p>
      </div>
    )
  }

  // Add parameters to minimize UI elements (though "View on larger map" can't be fully removed via embed API)
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(placeQuery)}&zoom=16&maptype=roadmap`
  
  const handleMapLoad = () => {
    setIsMapLoading(false)
  }

  return (
    <>
      {/* Map Trigger / Preview */}
      <div className="mt-0 md:mt-6">
        <div 
          className="border rounded-lg overflow-hidden h-48 md:h-64 bg-gray-100 relative cursor-pointer group"
          onClick={() => setOpen(true)}
        >
          {/* Loading Spinner */}
          {isMapLoading && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="w-12 h-12 rounded-full border-4 border-[#003580] border-t-transparent animate-spin" />
            </div>
          )}
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={mapUrl}
            className="w-full h-full pointer-events-none" // Disable interaction on preview
            onLoad={handleMapLoad}
            style={{ opacity: isMapLoading ? 0 : 1, transition: 'opacity 0.3s' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
            <Button variant="secondary" className="hidden md:flex shadow-lg text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 pointer-events-auto">
              Show on map
            </Button>
          </div>
        </div>
        
        {/* Mobile: Address and Location Text Below Map */}
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

      {/* Full Screen Map Modal */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) {
          setIsMapLoading(true) // Reset loading state when modal opens
        }
      }}>
        <DialogContent className="!max-w-[100vw] !max-h-[100vh] !w-[100vw] !h-[100vh] p-0 overflow-hidden bg-white !m-0 !rounded-none">
          <div className="relative w-full h-full">
            {/* Close Button - Top Right */}
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-50 p-2.5 bg-white rounded-full shadow-lg hover:bg-gray-100 border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>

            {/* Mobile: Gym Card Floating at Bottom */}
            <div className="md:hidden absolute bottom-0 left-0 right-0 z-50 p-4 pb-6">
              <Card className="shadow-2xl border border-gray-200 overflow-hidden bg-white">
                <CardContent className="p-0">
                  {/* Compact Mobile Card: Image + Name + Price */}
                  <div className="p-3 flex gap-3">
                    {/* Smaller Square Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {gym.images && gym.images.length > 0 && (
                        <img 
                          src={gym.images[0].url} 
                          alt={gym.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {/* Name + Price */}
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

            {/* Desktop: Gym Details Overlay (Top Left) */}
            <div className="hidden md:block absolute top-2 left-2 z-50 w-96 max-h-[85vh] overflow-y-auto">
              <Card className="shadow-xl border-0 overflow-hidden bg-white">
                <CardContent className="p-0">
                  {/* Top Section: Image + Name + Ratings */}
                  <div className="p-4 flex gap-3">
                    {/* Square Image */}
                    <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                      {gym.images && gym.images.length > 0 && (
                        <img 
                          src={gym.images[0].url} 
                          alt={gym.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {/* Name + Ratings */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-[#003580] mb-1 line-clamp-2">{gym.name}</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#003580] text-white px-1.5 py-0.5 rounded text-xs font-bold">8.4</div>
                          <span className="text-xs text-gray-600">Very good</span>
                          <span className="text-xs text-gray-500">• 2191 reviews</span>
                        </div>
                        <div className="text-xs text-gray-600">8.9 Location</div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t"></div>

                  {/* Booking Details + Pricing Section */}
                  <div className="p-4">
                    <div className="text-sm text-gray-700 mb-3">
                      <p className="font-medium">Training Session</p>
                      <p className="text-gray-600">1 session, 1 adult</p>
                    </div>
                    
                    {/* Price with View Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <p className="text-2xl font-bold text-[#003580]">
                            {formatPrice(convertPrice(gym.price_per_day, gym.currency))}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">Includes taxes and charges</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600">✓</span>
                          <span className="text-gray-700">Free cancellation</span>
                        </div>
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

                  {/* Divider */}
                  <div className="border-t"></div>

                  {/* Address - Lighter Grey */}
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-500">{gym.address || `${gym.city}, ${gym.country}`}</p>
                  </div>

                  {/* Top Attractions - Grey background with white rounded box */}
                  <div className="bg-gray-100 px-2 py-2">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Top attractions</h4>
                      <div className="space-y-1.5 text-sm">
                        {(gym.nearby_attractions && Array.isArray(gym.nearby_attractions) && gym.nearby_attractions.length > 0) ? (
                          gym.nearby_attractions.slice(0, 5).map((attraction: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-gray-700">
                              <span>{attraction.name || attraction}</span>
                              <span className="text-gray-500">{attraction.distance || '1.5 km'}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex justify-between text-gray-700">
                              <span>Beach Access</span>
                              <span className="text-gray-500">0.8 km</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>City Center</span>
                              <span className="text-gray-500">2.1 km</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Airport</span>
                              <span className="text-gray-500">15 km</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading Spinner for Full Screen Map */}
            {isMapLoading && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-40">
                <div className="w-16 h-16 rounded-full border-4 border-[#003580] border-t-transparent animate-spin" />
              </div>
            )}

            {/* The Map - Full Screen */}
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, opacity: isMapLoading ? 0 : 1, transition: 'opacity 0.3s' }}
              src={mapUrl}
              allowFullScreen
              onLoad={handleMapLoad}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
