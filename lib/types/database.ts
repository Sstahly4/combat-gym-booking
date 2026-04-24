import type { CancellationPolicySnapshot } from '@/lib/booking/cancellation-policy'

export type UserRole = 'fighter' | 'owner' | 'admin'
/** Listing accountability: role of the account holder at the property (not the same as user `role`). */
export type AccountHolderPropertyRole = 'owner' | 'manager' | 'authorised_operator'
export type GymStatus = 'pending' | 'approved' | 'rejected'
export type VerificationStatus = 'draft' | 'verified' | 'trusted'
export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'declined' | 'cancelled'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  /** Legal identity for disputes / ops (not necessarily the gym trading name). */
  legal_first_name: string | null
  legal_last_name: string | null
  /** Direct mobile for the account holder (not gym reception). */
  account_holder_phone: string | null
  role_at_property: AccountHolderPropertyRole | null
  country_of_residence: string | null
  /** Owner email toggles (see lib/manage/owner-notification-prefs). */
  owner_notification_prefs?: {
    email_bookings: boolean
    email_cancellations: boolean
    email_payouts: boolean
    email_security: boolean
    email_marketing: boolean
  } | null
  /** BCP-47 tag for UI localization (e.g. en, en-AU, th). */
  preferred_language?: string | null
  /** Recovery / backup contact email (not auth). */
  backup_email?: string | null
  /** True for synthetic owner accounts created by an admin to back a pre-listed
   *  gym. Cleared once the real owner finishes the claim flow (sets email). */
  placeholder_account?: boolean
  /** False until a placeholder owner sets their own password via /api/manage/account/complete-claim. */
  claim_password_set?: boolean
  /** Cached verdict of validatePasswordRules at the user's last sign-in.
   *  False → show a "please update your password" prompt (bell for owners). */
  password_meets_current_policy?: boolean
  /** Original synthetic email for the placeholder account (kept for reference). */
  placeholder_email?: string | null
  created_at: string
  updated_at: string
}

export interface Gym {
  id: string
  owner_id: string
  status: GymStatus
  verification_status: VerificationStatus
  is_live: boolean
  name: string
  /** Optional strings matched by gym_suggest (abbreviations, former names, etc.). */
  search_aliases?: string[]
  description: string | null
  city: string
  country: string
  /** Owner-indicated: gym offers bookable accommodation */
  offers_accommodation?: boolean
  /** Admin pre-listed this gym for handoff to a real owner via a claim link. */
  is_pre_listed?: boolean
  /** Set when this row was created via admin CSV bulk import (rollback + idempotency). */
  bulk_import_batch_id?: string | null
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
  /** Tier label for cancellation copy; numeric window is on packages.cancellation_policy_days */
  cancellation_policy_tone?: 'flexible' | 'moderate' | 'strict'
  stripe_connect_verified: boolean
  /** Stripe Connect Account.charges_enabled (from account.updated) */
  stripe_charges_enabled?: boolean | null
  /** Stripe Connect Account.payouts_enabled */
  stripe_payouts_enabled?: boolean | null
  /** Stripe Connect Account.details_submitted */
  stripe_details_submitted?: boolean | null
  stripe_requirements_currently_due?: string[] | null
  stripe_requirements_pending_verification?: string[] | null
  stripe_disabled_reason?: string | null
  last_stripe_account_sync_at?: string | null
  payout_disabled_notified_at?: string | null
  google_maps_link: string | null
  instagram_link: string | null
  facebook_link: string | null
  admin_approved: boolean
  verified_at: string | null
  trusted_at: string | null
  nearby_attractions?: Array<{ name: string; distance: number }> | null
  /** IANA timezone for schedules and reports. */
  timezone?: string | null
  /** Public reception / front-desk phone shown on listing (not owner personal phone). */
  public_contact_phone?: string | null
  /** Default spots per day used by the owner availability calendar (NULL = unconfigured). */
  default_daily_capacity?: number | null
  created_at: string
  updated_at: string
}

/** Sparse per-date availability override (owner calendar). See migration 041. */
export interface GymDailyAvailability {
  gym_id: string
  date: string
  capacity_override: number | null
  price_override: number | null
  is_closed: boolean
  min_stay_override: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export type GymPromotionKind = 'early_bird' | 'last_minute' | 'long_stay' | 'custom'

export interface GymPromotion {
  id: string
  gym_id: string
  kind: GymPromotionKind
  title: string
  description: string | null
  discount_percent: number
  starts_at: string | null
  ends_at: string | null
  min_nights: number | null
  is_active: boolean
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
  | 'TYPE_ONE_TIME_EVENT'

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
    extras?: Array<{
      label: string
      type: 'percentage' | 'fixed'
      value: string
    }>
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
  // One-time event fields
  event_date?: string | null
  event_end_date?: string | null
  max_attendees?: number | null
  created_at: string
  updated_at: string
  variants?: PackageVariant[]
}

export interface PackageVariant {
  id: string
  package_id: string
  accommodation_id?: string | null
  name: string
  description: string | null
  price_per_day: number | null
  price_per_week: number | null
  price_per_month: number | null
  room_type: 'private' | 'shared' | null
  images: string[]
  // Used as ticket tier capacity for TYPE_ONE_TIME_EVENT packages
  capacity: number | null
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

export interface Offer {
  id: string
  label: string
  title: string
  description: string
  image_url: string | null
  cta_text: string
  cta_url: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
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
  /** Policy agreed at checkout (deadline, refund %, tone) — matches PaymentIntent metadata */
  cancellation_policy_snapshot?: CancellationPolicySnapshot | null
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
  owner_reply?: string | null
  owner_replied_at?: string | null
  owner_replied_by?: string | null
  created_at: string
  manual_review?: boolean // MVP only - remove before shipping
  gym_id?: string // For manual reviews (MVP only)
  reviewer_name?: string | null // MVP only - for manual reviews
}

export type OwnerOnboardingSessionState = 'in_progress' | 'completed' | 'abandoned'

export interface OwnerOnboardingSession {
  id: string
  owner_id: string
  gym_id: string | null
  state: OwnerOnboardingSessionState
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OwnerOnboardingStep {
  id: string
  session_id: string
  step_key: string
  completed_at: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface OwnerInviteToken {
  id: string
  token: string
  gym_id: string | null
  email: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OwnerNotificationType =
  | 'booking_created'
  | 'booking_cancelled'
  | 'review_posted'
  | 'payout_paid'

export interface OwnerNotification {
  id: string
  user_id: string
  gym_id: string | null
  type: OwnerNotificationType
  title: string
  body: string | null
  link_href: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface SecurityEvent {
  id: string
  user_id: string
  event_type: string
  metadata: Record<string, any>
  created_at: string
}
