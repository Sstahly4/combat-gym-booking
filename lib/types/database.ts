export type UserRole = 'fighter' | 'owner' | 'admin'
export type GymStatus = 'pending' | 'approved' | 'rejected'
export type VerificationStatus = 'draft' | 'verified' | 'trusted'
// Booking Status Types
// Legacy statuses (for backward compatibility)
export type LegacyBookingStatus = 'pending_payment' | 'pending_confirmation' | 'awaiting_approval' | 'confirmed' | 'declined' | 'cancelled'
// New Request-to-Book statuses (standardized marketplace)
export type RequestToBookStatus = 'pending' | 'gym_confirmed' | 'paid' | 'completed'
// Combined type
export type BookingStatus = LegacyBookingStatus | RequestToBookStatus
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Gym {
  id: string
  owner_id: string
  status: GymStatus
  verification_status: VerificationStatus
  name: string
  description: string | null
  city: string
  country: string
  address: string | null
  latitude: number | null
  longitude: number | null
  disciplines: string[]
  amenities: Record<string, any>
  price_per_day: number
  price_per_week: number | null
  price_per_month: number | null
  accommodation_price_per_day: number | null
  accommodation_price_per_week: number | null
  accommodation_price_per_month: number | null
  meals_price_per_day: number | null
  meals_price_per_week: number | null
  meals_price_per_month: number | null
  currency: string
  stripe_account_id: string | null
  stripe_connect_verified: boolean
  google_maps_link: string | null
  instagram_link: string | null
  facebook_link: string | null
  admin_approved: boolean
  verified_at: string | null
  trusted_at: string | null
  nearby_attractions?: Array<{ name: string; distance: number }> | null
  created_at: string
  updated_at: string
}

export interface GymImage {
  id: string
  gym_id: string
  url: string
  order: number
  created_at: string
}

// Canonical Offer Types (Standardized Marketplace)
export type CanonicalOfferType = 
  | 'TYPE_TRAINING_ONLY'
  | 'TYPE_TRAINING_ACCOM'
  | 'TYPE_ALL_INCLUSIVE'
  | 'TYPE_CUSTOM_EXP'

export interface Package {
  id: string
  gym_id: string
  name: string
  description: string | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  includes_accommodation: boolean
  accommodation_name: string | null
  includes_meals: boolean
  sport: string
  type: 'training' | 'accommodation' | 'all_inclusive' // Legacy field
  offer_type: CanonicalOfferType // New canonical type
  image: string | null
  min_stay_days: number // Minimum stay in days (default: 7 for accom/all-inclusive, 1 for training)
  cancellation_policy_days: number | null
  meal_plan_details: {
    breakfast?: boolean
    lunch?: boolean
    dinner?: boolean
    meals_per_day?: number
    description?: string
  } | null
  pricing_config?: {
    mode: 'fixed' | 'rate'
    durations?: Array<{
      days: number
      price: number
      discountLabel?: string
    }>
    rates?: {
      daily?: number | null
      weekly?: number | null
      monthly?: number | null
      minStay?: number
    }
  } | null
  available_year_round?: boolean
  blackout_dates?: Array<{
    start: string
    end: string
    reason?: string
  }>
  booking_mode?: 'request_to_book' | 'instant'
  admin_override?: boolean
  admin_notes?: string
  created_at: string
  updated_at: string
  variants?: PackageVariant[]
}

export interface PackageVariant {
  id: string
  package_id: string
  name: string
  description: string | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  room_type: 'private' | 'shared' | null
  images: string[]
  created_at: string
  updated_at: string
}

// Standalone Accommodation (independent of packages)
export interface Accommodation {
  id: string
  gym_id: string
  name: string
  description: string | null
  room_type: 'private' | 'shared' | 'dorm' | null
  capacity: number | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  currency: string
  images: string[]
  amenities: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Link table for packages and accommodations
export interface PackageAccommodation {
  id: string
  package_id: string
  accommodation_id: string
  is_default: boolean
  created_at: string
}

export interface Booking {
  id: string
  user_id: string | null  // Nullable for guest bookings
  gym_id: string
  package_id: string | null
  package_variant_id: string | null
  // Request-to-Book timestamps
  request_submitted_at?: string | null
  gym_confirmed_at?: string | null
  payment_captured_at?: string | null
  start_date: string
  end_date: string
  discipline: string
  experience_level: ExperienceLevel
  notes: string | null
  status: BookingStatus
  total_price: number
  platform_fee: number
  stripe_payment_intent_id: string | null
  guest_email: string | null
  guest_phone: string | null
  guest_name: string | null
  booking_reference: string | null
  booking_pin: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string | null // Nullable for manual reviews (MVP only)
  rating: number
  comment: string | null
  created_at: string
  manual_review?: boolean // MVP only - remove before shipping
  gym_id?: string // For manual reviews (MVP only)
  reviewer_name?: string | null // MVP only - for manual reviews
}
