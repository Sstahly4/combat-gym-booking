'use client'

import {
  Activity,
  Baby,
  Building2,
  CircleDot,
  Clock,
  Dumbbell,
  Droplets,
  FileText,
  Flame,
  Flower2,
  Gauge,
  HandPlatter,
  Heart,
  Languages,
  Link2,
  Package,
  Plane,
  Shield,
  ShoppingBag,
  Snowflake,
  Stethoscope,
  Thermometer,
  TreePine,
  Trophy,
  UserRound,
  Users,
  UtensilsCrossed,
  Weight,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Custom amenity artwork — folder name kept as `amenites` on disk. */
export const GYM_AMENITY_IMAGE_SRC: Partial<Record<string, string>> = {
  parking: '/icons/amenites/free_parking.png',
  showers: '/icons/amenites/showers.png',
  changing_rooms: '/icons/amenites/changing_room.png',
  locker_room: '/icons/amenites/changing_room.png',
  heavy_bags: '/icons/amenites/boxing_heavy_bags.png',
  boxing_ring: '/icons/amenites/boxing-ring.png',
  hand_wraps_available: '/icons/amenites/hand_wraps.png',
  free_weights: '/icons/amenites/dumbells.png',
  weight_room: '/icons/amenites/bench_press_barbell.png',
}

export type GymAmenityIconSize = 'sm' | 'md' | 'lg'

const LUCIDE_CLASS: Record<GymAmenityIconSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const IMAGE_PX: Record<GymAmenityIconSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
}

function lucideAmenityIcon(amenityKey: string, size: GymAmenityIconSize): JSX.Element {
  const iconClass = cn(LUCIDE_CLASS[size], 'text-gray-700 shrink-0')

  const iconMap: Record<string, JSX.Element> = {
    accommodation: <Building2 className={iconClass} />,
    wifi: <Wifi className={iconClass} />,
    parking: <Building2 className={iconClass} />,
    showers: <Droplets className={iconClass} />,
    locker_room: <Users className={iconClass} />,
    security: <Shield className={iconClass} />,
    air_conditioning: <Thermometer className={iconClass} />,
    swimming_pool: <Droplets className={iconClass} />,
    sauna: <Thermometer className={iconClass} />,
    massage: <HandPlatter className={iconClass} />,
    laundry: <Droplets className={iconClass} />,
    airport_transfer: <Plane className={iconClass} />,
    twenty_four_hour: <Clock className={iconClass} />,
    group_classes: <Users className={iconClass} />,
    private_classes: <UserRound className={iconClass} />,
    pro_shop: <ShoppingBag className={iconClass} />,
    physiotherapy: <Heart className={iconClass} />,
    meals: <UtensilsCrossed className={iconClass} />,
    english_speaking: <Languages className={iconClass} />,
    beginner_friendly: <Users className={iconClass} />,
    kids_classes: <Baby className={iconClass} />,
    competition_prep: <Trophy className={iconClass} />,
    ice_bath: <Snowflake className={iconClass} />,
    steam_room: <Wind className={iconClass} />,
    hot_tub: <Droplets className={iconClass} />,
    yoga_studio: <Flower2 className={iconClass} />,
    outdoor_training: <TreePine className={iconClass} />,
    weight_room: <Weight className={iconClass} />,
    cardio_equipment: <Activity className={iconClass} />,
    boxing_ring: <CircleDot className={iconClass} />,
    mma_cage: <Gauge className={iconClass} />,
    wrestling_mats: <Dumbbell className={iconClass} />,
    heavy_bags: <CircleDot className={iconClass} />,
    speed_bags: <Zap className={iconClass} />,
    pad_work_area: <HandPlatter className={iconClass} />,
    clinch_area: <Users className={iconClass} />,
    free_weights: <Weight className={iconClass} />,
    rental_equipment: <Package className={iconClass} />,
    headgear_available: <Shield className={iconClass} />,
    hand_wraps_available: <Link2 className={iconClass} />,
    towel_service: <Droplets className={iconClass} />,
    water_station: <Droplets className={iconClass} />,
    changing_rooms: <Users className={iconClass} />,
    first_aid: <Stethoscope className={iconClass} />,
    fire_safety: <Flame className={iconClass} />,
    wheelchair_accessible: <Users className={iconClass} />,
    visa_assistance: <FileText className={iconClass} />,
  }

  return iconMap[amenityKey] ?? <span className="text-green-600 text-base leading-none">✓</span>
}

export function GymAmenityIcon({
  amenityKey,
  size = 'lg',
  className,
}: {
  amenityKey: string
  size?: GymAmenityIconSize
  className?: string
}) {
  const src = GYM_AMENITY_IMAGE_SRC[amenityKey]
  const px = IMAGE_PX[size]

  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={px}
        height={px}
        className={cn('shrink-0 object-contain', className)}
        aria-hidden
      />
    )
  }

  return lucideAmenityIcon(amenityKey, size)
}

export function GymDisciplineIcon({
  size = 'lg',
  className,
}: {
  size?: GymAmenityIconSize
  className?: string
}) {
  return (
    <Dumbbell
      className={cn(LUCIDE_CLASS[size], 'text-[#003580] shrink-0', className)}
      aria-hidden
    />
  )
}
