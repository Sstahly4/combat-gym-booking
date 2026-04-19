/**
 * Gym-level amenities (JSONB on `gyms.amenities`).
 * Curated for combat-sports gyms — training gear, classes, and recovery — not generic hotels.
 */

export const GYM_AMENITY_LABELS: Record<string, string> = {
  // Facility & comfort
  accommodation: 'On-site accommodation',
  wifi: 'Wi‑Fi',
  air_conditioning: 'Air conditioning',
  parking: 'Parking',
  showers: 'Showers',
  locker_room: 'Locker room',
  changing_rooms: 'Changing rooms',
  meals: 'Meals / kitchen access',
  water_station: 'Water station',
  first_aid: 'First aid',
  fire_safety: 'Fire safety (extinguishers, signage)',
  security: 'On-site security / staff',
  wheelchair_accessible: 'Wheelchair accessible',
  laundry: 'Laundry',
  towel_service: 'Towel service',

  // Classes & coaching
  group_classes: 'Group classes',
  private_classes: 'Private / 1-on-1 classes',
  beginner_friendly: 'Beginner friendly',
  competition_prep: 'Competition prep',
  english_speaking: 'English-speaking coaches',
  kids_classes: 'Kids / youth classes',

  // Training areas & equipment
  boxing_ring: 'Boxing ring',
  mma_cage: 'MMA cage',
  wrestling_mats: 'Wrestling / grappling mats',
  heavy_bags: 'Heavy bags',
  speed_bags: 'Speed bags',
  pad_work_area: 'Pads / mitt work area',
  clinch_area: 'Clinch / Muay Thai ropes area',
  free_weights: 'Free weights',
  cardio_equipment: 'Cardio machines',
  weight_room: 'Dedicated weights area',
  outdoor_training: 'Outdoor training area',

  // Gear & retail
  rental_equipment: 'Equipment rental (gloves, shin guards, etc.)',
  headgear_available: 'Headgear available',
  hand_wraps_available: 'Hand wraps for sale / included',
  pro_shop: 'Pro shop / gear sales',

  // Recovery & wellness
  massage: 'Massage',
  physiotherapy: 'Physio / sports therapy',
  ice_bath: 'Ice bath / cold plunge',
  sauna: 'Sauna',
  steam_room: 'Steam room',
  hot_tub: 'Hot tub / jacuzzi',
  yoga_studio: 'Yoga / mobility space',
  swimming_pool: 'Pool (cross-training)',

  // Operations & travel
  twenty_four_hour: '24/7 access',
  airport_transfer: 'Airport transfer (available)',
  visa_assistance: 'Visa / stay guidance',
}

/** Stable display order (not alphabetical). */
export const GYM_AMENITY_ORDER = Object.keys(GYM_AMENITY_LABELS) as string[]

export const DEFAULT_GYM_AMENITIES: Record<string, boolean> = Object.fromEntries(
  GYM_AMENITY_ORDER.map((k) => [k, false])
) as Record<string, boolean>

export function mergeGymAmenitiesFromDb(
  db: Record<string, unknown> | null | undefined
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...DEFAULT_GYM_AMENITIES }
  if (!db || typeof db !== 'object') return out
  for (const key of GYM_AMENITY_ORDER) {
    const v = db[key]
    if (typeof v === 'boolean') out[key] = v
  }
  return out
}

export function labelGymAmenity(key: string): string {
  return GYM_AMENITY_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
