/**
 * Gym-level amenities (JSONB on `gyms.amenities`).
 * Category catalog inspired by Airbnb host amenity picker — opt-in toggles, no defaults.
 */

export type GymAmenityCategoryId =
  | 'basics'
  | 'facility'
  | 'training_areas'
  | 'equipment'
  | 'classes'
  | 'gear_retail'
  | 'recovery'
  | 'safety_access'
  | 'services'
  | 'outdoor'
  | 'travel'

export type GymAmenityCategory = {
  id: GymAmenityCategoryId
  label: string
  description: string
}

export const GYM_AMENITY_CATEGORIES: GymAmenityCategory[] = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Essentials guests expect at any training gym.',
  },
  {
    id: 'facility',
    label: 'Facility & comfort',
    description: 'Showers, climate, connectivity, and day-to-day comfort.',
  },
  {
    id: 'training_areas',
    label: 'Training areas',
    description: 'Rings, cages, mats, and dedicated training zones.',
  },
  {
    id: 'equipment',
    label: 'Equipment',
    description: 'Bags, weights, cardio, and conditioning gear.',
  },
  {
    id: 'classes',
    label: 'Classes & coaching',
    description: 'How you teach and who you welcome.',
  },
  {
    id: 'gear_retail',
    label: 'Gear & retail',
    description: 'Rentals, pro shop, and what fighters can buy on site.',
  },
  {
    id: 'recovery',
    label: 'Recovery & wellness',
    description: 'Massage, ice baths, sauna, and mobility spaces.',
  },
  {
    id: 'safety_access',
    label: 'Safety & accessibility',
    description: 'First aid, security, and inclusive access.',
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Extras that make a camp stay easier.',
  },
  {
    id: 'outdoor',
    label: 'Outdoor',
    description: 'Open-air and off-mat training options.',
  },
  {
    id: 'travel',
    label: 'Travel & stay',
    description: 'Transfers, visas, and accommodation support.',
  },
]

export const GYM_AMENITY_LABELS: Record<string, string> = {
  // Basics
  drinking_water: 'Drinking water',
  restrooms: 'Restrooms',
  seating_area: 'Seating / rest area',
  mirrors: 'Training mirrors',
  fans: 'Fans / ventilation',
  towel_service: 'Towel service',
  water_station: 'Water station',
  wifi: 'Wi‑Fi',

  // Facility & comfort
  accommodation: 'On-site accommodation',
  air_conditioning: 'Air conditioning',
  parking: 'Parking',
  showers: 'Showers',
  locker_room: 'Locker room',
  changing_rooms: 'Changing rooms',
  meals: 'Meals / kitchen access',
  laundry: 'Laundry',
  cafe: 'Café / snack bar',
  lounge: 'Lounge / common area',
  reception: 'Front desk / reception',
  bike_storage: 'Bike storage',

  // Training areas
  boxing_ring: 'Boxing ring',
  mma_cage: 'MMA cage',
  wrestling_mats: 'Wrestling / grappling mats',
  pad_work_area: 'Pads / mitt work area',
  clinch_area: 'Clinch / Muay Thai ropes area',
  weight_room: 'Dedicated weights area',
  yoga_studio: 'Yoga / mobility space',
  open_mat_area: 'Open mat area',
  sparring_area: 'Controlled sparring area',

  // Equipment
  heavy_bags: 'Heavy bags',
  speed_bags: 'Speed bags',
  double_end_bag: 'Double-end bag',
  uppercut_bag: 'Uppercut bag',
  banana_bag: 'Banana / teardrop bag',
  floor_to_ceiling: 'Floor-to-ceiling balls',
  jump_ropes: 'Jump ropes',
  free_weights: 'Free weights',
  cardio_equipment: 'Cardio machines',
  kettlebells: 'Kettlebells',
  battle_ropes: 'Battle ropes',
  agility_ladder: 'Agility ladder',
  sled_push: 'Sled / prowler',
  resistance_bands: 'Resistance bands',

  // Classes & coaching
  group_classes: 'Group classes',
  private_classes: 'Private / 1-on-1 classes',
  beginner_friendly: 'Beginner friendly',
  competition_prep: 'Competition prep',
  english_speaking: 'English-speaking coaches',
  kids_classes: 'Kids / youth classes',
  women_only_classes: 'Women-only classes',
  open_mat: 'Open mat sessions',
  sparring_sessions: 'Sparring sessions',

  // Gear & retail
  rental_equipment: 'Equipment rental (gloves, shin guards, etc.)',
  headgear_available: 'Headgear available',
  hand_wraps_available: 'Hand wraps for sale / included',
  pro_shop: 'Pro shop / gear sales',
  mouthguard_sales: 'Mouthguards for sale',
  gear_storage: 'Gear storage for members',

  // Recovery & wellness
  massage: 'Massage',
  physiotherapy: 'Physio / sports therapy',
  ice_bath: 'Ice bath / cold plunge',
  sauna: 'Sauna',
  steam_room: 'Steam room',
  hot_tub: 'Hot tub / jacuzzi',
  swimming_pool: 'Pool (cross-training)',
  stretching_area: 'Stretching / mobility corner',
  sports_nutrition: 'Sports nutrition / supplements',

  // Safety & accessibility
  first_aid: 'First aid',
  fire_safety: 'Fire safety (extinguishers, signage)',
  security: 'On-site security / staff',
  wheelchair_accessible: 'Wheelchair accessible',
  aed_available: 'AED on site',
  cctv: 'CCTV / security cameras',
  controlled_sparring: 'Supervised sparring only',

  // Services
  equipment_storage: 'Long-term equipment storage',
  locker_rental: 'Locker rental',
  fight_ticket_help: 'Fight night / event tickets',
  local_orientation: 'New-guest orientation tour',
  video_analysis: 'Fight video / technique review',

  // Outdoor
  outdoor_training: 'Outdoor training area',
  beach_training: 'Beach training',
  hill_sprints: 'Hill / road conditioning',
  open_air_ring: 'Open-air ring / platform',

  // Travel & stay
  twenty_four_hour: '24/7 access',
  airport_transfer: 'Airport transfer (available)',
  visa_assistance: 'Visa / stay guidance',
  scooter_rental: 'Scooter / bike rental help',
  partner_accommodation: 'Partner accommodation nearby',
}

/** Keys grouped by category for the amenity picker UI. */
export const GYM_AMENITY_BY_CATEGORY: Record<GymAmenityCategoryId, string[]> = {
  basics: [
    'drinking_water',
    'restrooms',
    'seating_area',
    'mirrors',
    'fans',
    'towel_service',
    'water_station',
    'wifi',
  ],
  facility: [
    'accommodation',
    'air_conditioning',
    'parking',
    'showers',
    'locker_room',
    'changing_rooms',
    'meals',
    'laundry',
    'cafe',
    'lounge',
    'reception',
    'bike_storage',
  ],
  training_areas: [
    'boxing_ring',
    'mma_cage',
    'wrestling_mats',
    'pad_work_area',
    'clinch_area',
    'weight_room',
    'yoga_studio',
    'open_mat_area',
    'sparring_area',
  ],
  equipment: [
    'heavy_bags',
    'speed_bags',
    'double_end_bag',
    'uppercut_bag',
    'banana_bag',
    'floor_to_ceiling',
    'jump_ropes',
    'free_weights',
    'cardio_equipment',
    'kettlebells',
    'battle_ropes',
    'agility_ladder',
    'sled_push',
    'resistance_bands',
  ],
  classes: [
    'group_classes',
    'private_classes',
    'beginner_friendly',
    'competition_prep',
    'english_speaking',
    'kids_classes',
    'women_only_classes',
    'open_mat',
    'sparring_sessions',
  ],
  gear_retail: [
    'rental_equipment',
    'headgear_available',
    'hand_wraps_available',
    'pro_shop',
    'mouthguard_sales',
    'gear_storage',
  ],
  recovery: [
    'massage',
    'physiotherapy',
    'ice_bath',
    'sauna',
    'steam_room',
    'hot_tub',
    'swimming_pool',
    'stretching_area',
    'sports_nutrition',
  ],
  safety_access: [
    'first_aid',
    'fire_safety',
    'security',
    'wheelchair_accessible',
    'aed_available',
    'cctv',
    'controlled_sparring',
  ],
  services: [
    'equipment_storage',
    'locker_rental',
    'fight_ticket_help',
    'local_orientation',
    'video_analysis',
  ],
  outdoor: ['outdoor_training', 'beach_training', 'hill_sprints', 'open_air_ring'],
  travel: [
    'twenty_four_hour',
    'airport_transfer',
    'visa_assistance',
    'scooter_rental',
    'partner_accommodation',
  ],
}

/** Flat display order (category order, then key order within each category). */
export const GYM_AMENITY_ORDER: string[] = GYM_AMENITY_CATEGORIES.flatMap(
  (cat) => GYM_AMENITY_BY_CATEGORY[cat.id],
)

export const DEFAULT_GYM_AMENITIES: Record<string, boolean> = Object.fromEntries(
  GYM_AMENITY_ORDER.map((k) => [k, false]),
) as Record<string, boolean>

export function mergeGymAmenitiesFromDb(
  db: Record<string, unknown> | null | undefined,
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_GYM_AMENITIES }
  if (!db || typeof db !== 'object') return out
  for (const key of GYM_AMENITY_ORDER) {
    const v = db[key]
    if (typeof v === 'boolean') out[key] = v
  }
  // Preserve legacy keys stored before a catalog expansion.
  for (const [key, value] of Object.entries(db)) {
    if (typeof value === 'boolean' && !(key in out)) out[key] = value
  }
  return out
}

export function labelGymAmenity(key: string): string {
  return GYM_AMENITY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function amenityCategoryForKey(key: string): GymAmenityCategoryId | null {
  for (const cat of GYM_AMENITY_CATEGORIES) {
    if (GYM_AMENITY_BY_CATEGORY[cat.id].includes(key)) return cat.id
  }
  return null
}

export function countEnabledAmenities(amenities: Record<string, boolean>): number {
  return GYM_AMENITY_ORDER.filter((k) => amenities[k]).length
}

export function enabledAmenityKeys(
  amenities: Record<string, unknown> | null | undefined,
): string[] {
  const merged = mergeGymAmenitiesFromDb(amenities)
  return GYM_AMENITY_ORDER.filter((k) => merged[k])
}

export function searchGymAmenityKeys(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return GYM_AMENITY_ORDER.filter((key) => {
    const label = labelGymAmenity(key).toLowerCase()
    return label.includes(q) || key.replace(/_/g, ' ').includes(q)
  })
}

/** Human-readable labels for enabled amenities, in catalog display order. */
export function enabledGymAmenityLabels(
  amenities: Record<string, unknown> | null | undefined,
  max = 4,
): string[] {
  const keys = enabledAmenityKeys(amenities)
  return keys.slice(0, max).map(labelGymAmenity)
}
