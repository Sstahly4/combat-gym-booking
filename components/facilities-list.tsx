'use client'

import { useState, useEffect } from 'react'
import { MapPin, Dumbbell, Wifi, Car, Droplets, UtensilsCrossed, Users, Shield, Clock, Building2, Star, Waves, Thermometer, HandPlatter, Plane, Coffee, ShoppingBag, Apple, Heart, Trophy, Languages, Snowflake, Wind, Flower2, TreePine, Weight, Activity, Target, Gauge, Bike, Stethoscope, Laptop, Printer, CreditCard, Package, Map, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FacilitiesListProps {
  amenities: Record<string, boolean>
  disciplines: string[]
}

const INITIAL_SHOW_COUNT_MOBILE = 4
const INITIAL_SHOW_COUNT_DESKTOP = 9

export function FacilitiesList({ amenities, disciplines }: FacilitiesListProps) {
  const [showAll, setShowAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get all active amenities
  const activeAmenities = Object.entries(amenities)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)

  // Combine amenities and disciplines
  const allFacilities = [
    ...activeAmenities.map(key => ({ type: 'amenity' as const, key })),
    ...disciplines.map(d => ({ type: 'discipline' as const, key: d }))
  ]

  const initialCount = isMobile ? INITIAL_SHOW_COUNT_MOBILE : INITIAL_SHOW_COUNT_DESKTOP
  const facilitiesToShow = showAll ? allFacilities : allFacilities.slice(0, initialCount)
  const hasMore = allFacilities.length > initialCount

  // Map amenities to icons
  const getAmenityIcon = (amenityKey: string) => {
    const iconMap: Record<string, JSX.Element> = {
      wifi: <Wifi className="w-5 h-5 text-gray-700" />,
      parking: <Car className="w-5 h-5 text-gray-700" />,
      showers: <Droplets className="w-5 h-5 text-gray-700" />,
      accommodation: <Building2 className="w-5 h-5 text-gray-700" />,
      equipment: <Dumbbell className="w-5 h-5 text-gray-700" />,
      meals: <UtensilsCrossed className="w-5 h-5 text-gray-700" />,
      locker_room: <Users className="w-5 h-5 text-gray-700" />,
      security: <Shield className="w-5 h-5 text-gray-700" />,
      air_conditioning: <Thermometer className="w-5 h-5 text-gray-700" />,
      swimming_pool: <Waves className="w-5 h-5 text-gray-700" />,
      sauna: <Thermometer className="w-5 h-5 text-gray-700" />,
      massage: <HandPlatter className="w-5 h-5 text-gray-700" />,
      laundry: <Droplets className="w-5 h-5 text-gray-700" />,
      airport_transfer: <Plane className="w-5 h-5 text-gray-700" />,
      twenty_four_hour: <Clock className="w-5 h-5 text-gray-700" />,
      personal_training: <Dumbbell className="w-5 h-5 text-gray-700" />,
      group_classes: <Users className="w-5 h-5 text-gray-700" />,
      pro_shop: <ShoppingBag className="w-5 h-5 text-gray-700" />,
      nutritionist: <Apple className="w-5 h-5 text-gray-700" />,
      physiotherapy: <Heart className="w-5 h-5 text-gray-700" />,
      recovery_facilities: <Heart className="w-5 h-5 text-gray-700" />,
      restaurant: <UtensilsCrossed className="w-5 h-5 text-gray-700" />,
      cafe: <Coffee className="w-5 h-5 text-gray-700" />,
      english_speaking: <Languages className="w-5 h-5 text-gray-700" />,
      beginner_friendly: <Users className="w-5 h-5 text-gray-700" />,
      competition_prep: <Trophy className="w-5 h-5 text-gray-700" />,
      ice_bath: <Snowflake className="w-5 h-5 text-gray-700" />,
      steam_room: <Wind className="w-5 h-5 text-gray-700" />,
      hot_tub: <Waves className="w-5 h-5 text-gray-700" />,
      yoga_studio: <Flower2 className="w-5 h-5 text-gray-700" />,
      crossfit_area: <TreePine className="w-5 h-5 text-gray-700" />,
      outdoor_training: <TreePine className="w-5 h-5 text-gray-700" />,
      weight_room: <Weight className="w-5 h-5 text-gray-700" />,
      cardio_equipment: <Activity className="w-5 h-5 text-gray-700" />,
      boxing_ring: <Target className="w-5 h-5 text-gray-700" />,
      mma_cage: <Gauge className="w-5 h-5 text-gray-700" />,
      wrestling_mats: <Dumbbell className="w-5 h-5 text-gray-700" />,
      climbing_wall: <TreePine className="w-5 h-5 text-gray-700" />,
      bike_storage: <Bike className="w-5 h-5 text-gray-700" />,
      towel_service: <Droplets className="w-5 h-5 text-gray-700" />,
      water_station: <Droplets className="w-5 h-5 text-gray-700" />,
      changing_rooms: <Users className="w-5 h-5 text-gray-700" />,
      first_aid: <Stethoscope className="w-5 h-5 text-gray-700" />,
      fire_safety: <Shield className="w-5 h-5 text-gray-700" />,
      wheelchair_accessible: <Users className="w-5 h-5 text-gray-700" />,
      wifi_lounge: <Laptop className="w-5 h-5 text-gray-700" />,
      co_working_space: <Laptop className="w-5 h-5 text-gray-700" />,
      printing_facilities: <Printer className="w-5 h-5 text-gray-700" />,
      atm: <CreditCard className="w-5 h-5 text-gray-700" />,
      vending_machines: <Package className="w-5 h-5 text-gray-700" />,
      bike_rental: <Bike className="w-5 h-5 text-gray-700" />,
      scooter_rental: <Bike className="w-5 h-5 text-gray-700" />,
      tour_booking: <Map className="w-5 h-5 text-gray-700" />,
      visa_assistance: <FileText className="w-5 h-5 text-gray-700" />,
    }
    return iconMap[amenityKey] || <span className="text-green-600 text-base">✓</span>
  }

  const getFacilityName = (facility: { type: 'amenity' | 'discipline', key: string }) => {
    if (facility.type === 'discipline') {
      return facility.key
    }
    return facility.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getFacilityIcon = (facility: { type: 'amenity' | 'discipline', key: string }) => {
    if (facility.type === 'discipline') {
      return <Dumbbell className="w-5 h-5 text-[#003580]" />
    }
    return getAmenityIcon(facility.key)
  }

  if (allFacilities.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3 text-gray-900">Most popular facilities</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        {facilitiesToShow.map((facility) => (
          <div key={`${facility.type}-${facility.key}`} className="flex items-center gap-3 py-1.5">
            {getFacilityIcon(facility)}
            <span className="text-sm text-gray-700">{getFacilityName(facility)}</span>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-[#003580] hover:text-[#003580] hover:bg-[#003580]/10 p-0 h-auto font-normal"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                See less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                See more facilities ({allFacilities.length - initialCount} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
