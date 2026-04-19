'use client'

import { useState, useEffect } from 'react'
import {
  Dumbbell,
  Wifi,
  Car,
  Droplets,
  UtensilsCrossed,
  Users,
  Shield,
  Clock,
  Building2,
  Waves,
  Thermometer,
  HandPlatter,
  Plane,
  ShoppingBag,
  Heart,
  Trophy,
  Languages,
  Snowflake,
  Wind,
  Flower2,
  TreePine,
  Weight,
  Activity,
  Target,
  Gauge,
  Stethoscope,
  Flame,
  Package,
  FileText,
  ChevronDown,
  ChevronUp,
  UserRound,
  Baby,
  Zap,
  Link2,
  CircleDot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { labelGymAmenity } from '@/lib/constants/gym-amenities'

interface FacilitiesListProps {
  amenities: Record<string, boolean>
  disciplines: string[]
}

const INITIAL_SHOW_COUNT_MOBILE = 4
const INITIAL_SHOW_COUNT_DESKTOP = 9

export function FacilitiesList({ amenities, disciplines }: FacilitiesListProps) {
  const [showAll, setShowAll] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeAmenities = Object.entries(amenities)
    .filter(([_, value]) => value)
    .map(([key, _]) => key)

  const allFacilities = [
    ...activeAmenities.map((key) => ({ type: 'amenity' as const, key })),
    ...disciplines.map((d) => ({ type: 'discipline' as const, key: d })),
  ]

  const initialCount = isMobile ? INITIAL_SHOW_COUNT_MOBILE : INITIAL_SHOW_COUNT_DESKTOP
  const facilitiesToShow = showAll ? allFacilities : allFacilities.slice(0, initialCount)
  const hasMore = allFacilities.length > initialCount

  const getAmenityIcon = (amenityKey: string) => {
    const iconMap: Record<string, JSX.Element> = {
      accommodation: <Building2 className="w-5 h-5 text-gray-700" />,
      wifi: <Wifi className="w-5 h-5 text-gray-700" />,
      parking: <Car className="w-5 h-5 text-gray-700" />,
      showers: <Droplets className="w-5 h-5 text-gray-700" />,
      locker_room: <Users className="w-5 h-5 text-gray-700" />,
      security: <Shield className="w-5 h-5 text-gray-700" />,
      air_conditioning: <Thermometer className="w-5 h-5 text-gray-700" />,
      swimming_pool: <Waves className="w-5 h-5 text-gray-700" />,
      sauna: <Thermometer className="w-5 h-5 text-gray-700" />,
      massage: <HandPlatter className="w-5 h-5 text-gray-700" />,
      laundry: <Droplets className="w-5 h-5 text-gray-700" />,
      airport_transfer: <Plane className="w-5 h-5 text-gray-700" />,
      twenty_four_hour: <Clock className="w-5 h-5 text-gray-700" />,
      group_classes: <Users className="w-5 h-5 text-gray-700" />,
      private_classes: <UserRound className="w-5 h-5 text-gray-700" />,
      pro_shop: <ShoppingBag className="w-5 h-5 text-gray-700" />,
      physiotherapy: <Heart className="w-5 h-5 text-gray-700" />,
      meals: <UtensilsCrossed className="w-5 h-5 text-gray-700" />,
      english_speaking: <Languages className="w-5 h-5 text-gray-700" />,
      beginner_friendly: <Users className="w-5 h-5 text-gray-700" />,
      kids_classes: <Baby className="w-5 h-5 text-gray-700" />,
      competition_prep: <Trophy className="w-5 h-5 text-gray-700" />,
      ice_bath: <Snowflake className="w-5 h-5 text-gray-700" />,
      steam_room: <Wind className="w-5 h-5 text-gray-700" />,
      hot_tub: <Waves className="w-5 h-5 text-gray-700" />,
      yoga_studio: <Flower2 className="w-5 h-5 text-gray-700" />,
      outdoor_training: <TreePine className="w-5 h-5 text-gray-700" />,
      weight_room: <Weight className="w-5 h-5 text-gray-700" />,
      cardio_equipment: <Activity className="w-5 h-5 text-gray-700" />,
      boxing_ring: <Target className="w-5 h-5 text-gray-700" />,
      mma_cage: <Gauge className="w-5 h-5 text-gray-700" />,
      wrestling_mats: <Dumbbell className="w-5 h-5 text-gray-700" />,
      heavy_bags: <CircleDot className="w-5 h-5 text-gray-700" />,
      speed_bags: <Zap className="w-5 h-5 text-gray-700" />,
      pad_work_area: <Target className="w-5 h-5 text-gray-700" />,
      clinch_area: <Users className="w-5 h-5 text-gray-700" />,
      free_weights: <Weight className="w-5 h-5 text-gray-700" />,
      rental_equipment: <Package className="w-5 h-5 text-gray-700" />,
      headgear_available: <Shield className="w-5 h-5 text-gray-700" />,
      hand_wraps_available: <Link2 className="w-5 h-5 text-gray-700" />,
      towel_service: <Droplets className="w-5 h-5 text-gray-700" />,
      water_station: <Droplets className="w-5 h-5 text-gray-700" />,
      changing_rooms: <Users className="w-5 h-5 text-gray-700" />,
      first_aid: <Stethoscope className="w-5 h-5 text-gray-700" />,
      fire_safety: <Flame className="w-5 h-5 text-gray-700" />,
      wheelchair_accessible: <Users className="w-5 h-5 text-gray-700" />,
      visa_assistance: <FileText className="w-5 h-5 text-gray-700" />,
    }
    return iconMap[amenityKey] || <span className="text-green-600 text-base">✓</span>
  }

  const getFacilityName = (facility: { type: 'amenity' | 'discipline'; key: string }) => {
    if (facility.type === 'discipline') {
      return facility.key
    }
    return labelGymAmenity(facility.key)
  }

  const getFacilityIcon = (facility: { type: 'amenity' | 'discipline'; key: string }) => {
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
