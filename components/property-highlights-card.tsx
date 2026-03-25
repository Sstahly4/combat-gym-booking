'use client'

import { Card, CardContent } from '@/components/ui/card'
import { generatePropertyHighlights } from '@/lib/utils/property-highlights'
import { useBooking } from '@/lib/contexts/booking-context'
import { GymMap } from '@/components/gym-map'
import type { Gym } from '@/lib/types/database'
import { MapPin, Bed, Dumbbell, Building2, UtensilsCrossed, Star, Calendar, Users, Wifi, Car } from 'lucide-react'

interface PropertyHighlightsCardProps {
  gym: Gym
  averageRating: number
  reviewCount?: number
  googleMapsKey?: string
}

export function PropertyHighlightsCard({ gym, averageRating, reviewCount = 0, googleMapsKey = '' }: PropertyHighlightsCardProps) {
  // Get dates from booking context (reacts to user selections)
  const { checkin, checkout } = useBooking()
  
  const highlightsData = generatePropertyHighlights({
    gym,
    averageRating,
    reviewCount,
    checkin,
    checkout
  })

  // Icon mapping
  const getIcon = (iconType: string) => {
    const iconMap: Record<string, JSX.Element> = {
      location: <MapPin className="w-4 h-4 text-gray-700" />,
      bed: <Bed className="w-4 h-4 text-gray-700" />,
      dumbbell: <Dumbbell className="w-4 h-4 text-gray-700" />,
      building: <Building2 className="w-4 h-4 text-gray-700" />,
      utensils: <UtensilsCrossed className="w-4 h-4 text-gray-700" />,
      star: <Star className="w-4 h-4 text-gray-700" />,
      calendar: <Calendar className="w-4 h-4 text-gray-700" />,
      users: <Users className="w-4 h-4 text-gray-700" />,
      wifi: <Wifi className="w-4 h-4 text-gray-700" />,
      car: <Car className="w-4 h-4 text-gray-700" />,
    }
    return iconMap[iconType] || <span className="w-4 h-4" />
  }

  return (
    <Card className="border border-gray-200 shadow-sm bg-white">
      <CardContent className="p-4 md:p-5 space-y-4 md:space-y-5">
        {/* Property highlights */}
        <div>
          <h3 className="font-bold text-sm md:text-base mb-2 md:mb-3 text-gray-900">Property highlights</h3>
          <div className="space-y-2.5 md:space-y-3">
            {highlightsData.mainHighlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2 md:gap-2.5">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(highlight.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">{highlight.title}</div>
                  {highlight.description && (
                    <div className="text-[10px] md:text-xs text-gray-600 mt-0.5 leading-relaxed">{highlight.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakfast info */}
        {highlightsData.breakfastInfo && (
          <div>
            <h3 className="font-bold text-sm md:text-base mb-1.5 md:mb-2 text-gray-900">Breakfast info</h3>
            <p className="text-xs md:text-sm text-gray-700">{highlightsData.breakfastInfo}</p>
          </div>
        )}

        {/* Rooms with */}
        {highlightsData.roomsWith && highlightsData.roomsWith.length > 0 && (
          <div>
            <h3 className="font-bold text-sm md:text-base mb-2 text-gray-900">Rooms with:</h3>
            <div className="space-y-2 md:space-y-2.5">
              {highlightsData.roomsWith.map((item, index) => (
                <div key={index} className="flex items-start gap-2 md:gap-2.5">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(item.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm text-gray-700">{item.title}</div>
                    {item.description && (
                      <div className="text-[10px] md:text-xs text-gray-600 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loyal customers */}
        {highlightsData.loyalCustomers && (
          <div>
            <h3 className="font-bold text-sm md:text-base mb-1.5 md:mb-2 text-gray-900">Loyal customers</h3>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{highlightsData.loyalCustomers}</p>
          </div>
        )}

        {/* Map Section - Mobile only, at bottom */}
        <div className="md:hidden border-t border-gray-200 pt-4 mt-4">
          <div id="gym-map-section">
            <GymMap 
              gym={gym} 
              googleMapsKey={googleMapsKey || (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY : '') || ''} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
