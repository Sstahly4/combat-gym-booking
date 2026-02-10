# CombatBooking.com - AI Context Document

## Project Overview

**CombatBooking.com** is a Booking.com-inspired MVP web application for booking combat sports training camps (Muay Thai, MMA, BJJ, Boxing, Wrestling, Kickboxing). The platform connects fighters/trainees with gyms worldwide, starting with Thailand, Bali, and Australia.

**Core Concept**: Users can discover, filter, and request bookings at combat sports gyms. Gym owners manage their profiles and bookings. The platform takes a commission on successful bookings via Stripe Connect.

## Current Goals

1. **MVP Completion**: Build a clean, reliable MVP to prove demand for booking combat sports gyms internationally
2. **Booking.com UX**: Match Booking.com's familiar UI/UX patterns (filters, search, property cards, booking flow)
3. **Conversion Optimization**: Focus on trust-building elements (reviews, ratings, clear pricing, maps, detailed gym pages)
4. **Professional Polish**: Ensure consistent design, proper loading states, and smooth user flows
5. **Guest Checkout**: Allow bookings without requiring user accounts (Booking.com-style implicit identity)
6. **Package-Based Model**: Support bundled offers (Training Only, Training + Accommodation, All Inclusive) with accommodation variants

## Key Technical Decisions

### Tech Stack
- **Framework**: Next.js 14+ (App Router) - Server Components for SEO/performance
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage for gym images
- **Payments**: Stripe Connect (for gym owners) + Stripe Elements (for payments)
- **Maps**: Google Maps Embed API (with API key restrictions)
- **Language**: TypeScript throughout

### Architecture Decisions

1. **Server Components First**: Pages fetch data on server for better performance and SEO
2. **Client Components Only When Needed**: Interactive features (modals, forms, currency) are client components
3. **Middleware Simplification**: Middleware only refreshes Supabase session, redirects handled client-side
4. **Currency System**: Client-side context with localStorage persistence, hardcoded exchange rates for MVP
5. **Image Storage**: Supabase Storage bucket `gym-images` with public read access
6. **RLS Policies**: Database-level security, users can only see/edit their own data

## Constraints & Exclusions

### Explicitly NOT Building:
- ❌ Fighter profiles (no user profiles beyond basic auth)
- ❌ Instant booking calendars
- ❌ Messaging/chat system
- ❌ Mobile app
- ❌ AI features
- ❌ Real-time notifications (email only for MVP)

### MVP Scope:
- ✅ Public gym directory with filters
- ✅ Gym profile pages with galleries
- ✅ Booking request flow (not instant booking)
- ✅ Stripe payments with platform commission
- ✅ Reviews (only after completed bookings)
- ✅ Admin panel for gym approval
- ✅ Basic search and filtering

## Important Things to Remember

### Authentication Flow
1. **Regular Registration** (`/auth/signup`): 
   - User signs up with email, name, password
   - Automatically assigned `fighter` role (no role selection)
   - Redirects to homepage (`/`)
2. **"List Your Gym"** (`/auth/signup?intent=owner`):
   - User signs up with email, name, password
   - Automatically assigned `owner` role (partner account)
   - Redirects to `/manage/onboarding` to create gym
   - **Email verification**: Required before gym creation (checked in onboarding)
   - **Gym creation**: Creates gym in `draft` status (not visible, not bookable)
3. **Sign In**: Redirects based on role (Owner → `/manage`, Fighter → `/`, Admin → `/admin`)
4. **Middleware**: Only refreshes session, doesn't handle redirects (prevents loops)

### Gym Verification Flow
1. **Gym Creation**: Owner creates gym → Status: `draft` (not visible to public)
2. **Verification Requirements**:
   - Google Maps listing link (must match gym address)
   - Instagram or Facebook page link
   - Stripe Connect fully enabled (KYC + bank account verified)
   - Admin approval
3. **Owner Actions**:
   - Can preview draft gym (draft notice banner shown)
   - Updates verification links in gym edit page
   - Sets up Stripe Connect (auto-verifies when complete)
   - Views verification checklist on dashboard
4. **Admin Verification**:
   - Admin views gym in admin panel
   - Clicks "Verify Gym" button
   - System automatically checks all requirements
   - If all met → Gym status: `verified` (visible, bookable)
   - If missing → Error message with details
5. **Public Visibility**: Only verified/trusted gyms appear in search and can be booked

### Database Schema
- **profiles**: User roles (fighter, owner, admin) - created via trigger on auth signup
- **gyms**: 
  - Status field (pending, approved, rejected) - legacy field for compatibility
  - **Verification system**: `verification_status` (draft, verified, trusted) - controls visibility and bookability
  - **Verification fields**: `stripe_connect_verified`, `google_maps_link`, `instagram_link`, `facebook_link`, `admin_approved`, `verified_at`, `trusted_at`
  - Includes `nearby_attractions` JSONB for cached landmarks
  - **Additional optional fields**: `opening_hours` (JSONB), `training_schedule` (JSONB - array of sessions per day with time and optional type), `trainers` (JSONB array), `accommodation_details` (JSONB array), `faq` (JSONB array)
  - **Amenities**: Comprehensive 25+ amenities system stored as JSONB object (accommodation, wifi, equipment, showers, parking, meals, locker_room, security, air_conditioning, swimming_pool, sauna, massage, laundry, airport_transfer, twenty_four_hour, personal_training, group_classes, pro_shop, nutritionist, physiotherapy, recovery_facilities, restaurant, cafe, english_speaking, beginner_friendly, competition_prep)
  - Only verified/trusted gyms are visible in search and bookable
- **gym_images**: Links to Supabase Storage URLs, includes `order` column for image sequencing (first image is main photo)
- **packages**: Gym offers (Training Only, Training + Accommodation, All Inclusive) with pricing per day/week/month
- **package_variants**: Accommodation options for packages that include accommodation, with images array
- **bookings**: Status tracking (pending_payment → pending_confirmation → confirmed/declined → completed). Supports guest checkout (user_id nullable, guest_email, guest_name, guest_phone, booking_reference, booking_pin). Blocks bookings for draft gyms
- **booking_access_tokens**: Magic link tokens for accessing bookings without accounts (hashed, single-use, expiring)
- **reviews**: Only allowed after booking status = 'completed'

### Key Features Implemented

#### Homepage (`app/page.tsx`)
- Hero section with "Book your dream camp" CTA
- Search bar (location, dates, discipline) - yellow Booking.com style with date range picker
- Trending Destinations section (2-top, 3-bottom masonry grid)
- **Multiple carousel sections** for increased visual volume and scroll depth:
  - Popular Training Camps (renamed from Featured Gyms)
  - Browse by sport type (dynamic, shows only sports with available gyms, includes dates and real counts)
  - Muay Thai Gyms
  - Boxing Gyms
  - Beginner-Friendly Camps
  - Hardcore Fight Camps
  - Training Holidays
- **"How it works" section** at bottom (3-step process)
- All carousels use consistent styling with scroll buttons and skeleton loaders
- Sport type section shows real gym counts per discipline, dynamically determines most common country
- **Only verified/trusted gyms** appear in all carousels (filters by `verification_status`)

#### Gym Details Page (`app/gyms/[id]/page.tsx`)
- Breadcrumbs navigation
- Image gallery with drag-and-drop reordering support (up to 30 images)
- **Non-sticky informational sidebar**: Property highlights, reviews summary, map, opening hours
- **Main content flow**: Gallery → Description (with nearby landmarks) → Facilities & Amenities → Packages → Reviews
- **Reserve button** in header (right-aligned, smaller, no dates displayed) - disabled for draft gyms
- **Draft preview mode**: Owners can preview their draft gyms, public users see "Gym Not Available"
- **Dynamic landmarks**: Automatically calculated from address using OpenStreetMap, cached in database
- **Property highlights card**: Dynamic highlights based on dates, ratings, amenities (Booking.com style)
- Facilities with real icons (WiFi, Car, Droplets, etc.) - no grey blocks, clean modern look
- Packages list with variant selection modal (image carousel, descriptions)
- Google Maps embed in sidebar

#### Search Page (`app/search/page.tsx`)
- Filters: location, discipline, price range, amenities, check-in/check-out dates
- Grid/list view of gyms
- Dynamic pricing: Shows "Starting from $X / session" if no dates, or "Packages from $X for your dates" if dates selected
- **Only shows verified/trusted gyms** (filters by `verification_status`)
- Uses LEFT JOIN (not INNER) to show all verified gyms

#### Currency System
- Context-based (`lib/contexts/currency-context.tsx`)
- localStorage persistence
- Price format: `{CURRENCY} {amount}` (e.g., "AUD 45.00")
- Exchange rates hardcoded for MVP (17 currencies supported)
- Currency selector in header and footer

#### Footer (`components/footer.tsx`)
- Grey background (`bg-gray-50`)
- 5-column layout: Support, Discover, Terms, Partners, About
- **Partner logos section**: 7 organization logos displayed in dark grey (grayscale filter) with hover effects
- Currency selector included (no world icon)
- Consistent across all pages (in layout.tsx)

### Design System

#### Colors
- Primary Blue: `#003580` (Booking.com blue)
- Yellow Accent: `#febb02` (search bar)
- Background: White (`bg-white`) - consistent across all pages
- Footer: `bg-gray-50`
- Green: Used for verified badges and included items (tick icons)

#### Typography & Spacing
- Max-width container: `max-w-6xl mx-auto px-4`
- Consistent padding and gaps
- Desktop-first, responsive design

#### Components
- All UI components from shadcn/ui
- Custom components: 
  - `booking-modal`, `booking-section`, `gym-gallery`, `gym-map`, `featured-carousel`, `search-form`, `currency-modal`
  - `sport-type-carousel`: Horizontal carousel for sport type browsing with scroll buttons
  - `contact-support-modal`: Modal for contacting support (sends emails to admin)
  - `booking-details-modal`: Modal for viewing/updating booking details on success page
  - `review-card`, `reviews-carousel`, `reviews-link-button`: Review display components
  - `good-to-know-card`: Dynamic "Good to know" information based on package/variant data
  - `verification-checklist`: Verification status display with requirements checklist and Stripe Connect status
  - `date-range-picker`: Booking.com-style date range picker with two-month calendar popup

## Current State & Recent Work

### Recently Completed
1. ✅ **Package-based pricing model**: Training Only, Training + Accommodation, All Inclusive packages with variants
2. ✅ **Guest checkout**: Bookings without authentication (booking reference + PIN, magic links)
3. ✅ **Payment authorization flow**: Card authorized (not captured) until manual confirmation
4. ✅ **Email notifications**: Admin emails with full booking details, user confirmation emails with magic links
5. ✅ **Booking access system**: Magic link tokens for passwordless booking access
6. ✅ **Gym page restructure**: Amenities first, packages, reviews. Removed sticky sidebar, added Reserve button
7. ✅ **Property highlights**: Dynamic highlights based on dates, ratings, amenities (Booking.com style)
8. ✅ **Landmark integration**: Automatic calculation and caching of nearby landmarks using OpenStreetMap
9. ✅ **Image management**: Drag-and-drop reordering (up to 30 images), order persistence
10. ✅ **Booking summary page**: Booking.com-style checkout with gym details sidebar and user info form
11. ✅ **Payment page**: Separate payment page after booking summary with Stripe Elements
12. ✅ **Package variants**: Accommodation variants with image galleries and carousels
13. ✅ **Billing units**: Different units per package type (per session for Training Only, per week for accommodation packages)
14. ✅ **Training Only logic**: 1 day/session minimum (not 7 days like accommodation packages)
15. ✅ **Homepage enhancement**: Multiple carousel sections for increased visual volume and scroll depth
16. ✅ **Sport type browsing**: Dynamic "Browse by sport type" section with real gym counts and dates
17. ✅ **Loading states**: All loading states converted to skeleton loaders for better UX
18. ✅ **Verified badges**: Green checkmark "Verified" badge on gym cards below destination
19. ✅ **Footer logos**: Partner organization logos in dark grey with hover effects
20. ✅ **Navbar fixes**: Role-based link visibility (admin, owner, fighter, signed out)
21. ✅ **Admin gym management**: Dedicated page for admins to view/edit all gyms
22. ✅ **Contact support**: Modal and API endpoint for support requests
23. ✅ **Booking details modal**: In-page modal for viewing booking details (replaces broken link)
24. ✅ **Package images**: Main package display images (separate from variant images)
25. ✅ **Manual reviews (MVP)**: Admin can add verified reviews with varied timestamps and reviewer names
26. ✅ **Review system**: Star ratings, "See more/less" for long comments, horizontal carousel
27. ✅ **Booking details fields**: Cancellation policy, meal plan details, room type stored in database
28. ✅ **Booking confirmation page**: Comprehensive success page with trust-building elements
29. ✅ **Price summary updates**: Removed platform fee, updated styling, green ticks for included items
30. ✅ **Progress indicators**: Consistent 3-step progress bar across booking flow pages
31. ✅ **Gym verification system**: Three-tier verification (Draft, Verified, Trusted) to prevent fake gyms
32. ✅ **Verification requirements**: Stripe Connect (KYC + bank), Google Maps link, Instagram/Facebook link, admin approval
33. ✅ **Draft mode**: Gyms created in draft status, owners can preview, public cannot see or book
34. ✅ **Verification checklist**: Component showing all requirements with real-time Stripe status checks
35. ✅ **Admin verification**: One-click verification button that checks all requirements automatically
36. ✅ **Booking protection**: Draft gyms cannot be booked (blocked in UI and API)
37. ✅ **Date range picker**: Booking.com-style combined check-in/check-out with two-month calendar popup
38. ✅ **Edit gym page redesign**: Production-ready design with proper width (max-w-6xl), card-based sections, improved spacing and visual hierarchy
39. ✅ **Comprehensive amenities system**: 25+ amenities organized into categories (Basic Facilities, Accommodation & Services, Training Facilities, Services & Support, Special Features)
40. ✅ **Simplified amenities UI**: Single responsive grid with visual feedback (checked items highlighted), sorted with checked items first
41. ✅ **Training schedule system**: Multiple sessions per day support, collapsible section, optional days, time and type fields per session
42. ✅ **Searchable country selector**: All 195+ countries with real-time search, dropdown with keyboard navigation
43. ✅ **Additional optional fields**: Opening hours, trainers list, accommodation details, FAQ section for better conversion
44. ✅ **Packages section positioning**: Moved above action buttons, styled as Card component for consistency
45. ✅ **Two-step email confirmation system**: 
    - Initial booking request email (card authorized, not charged) with clear messaging
    - Confirmation email (after gym confirms and payment captured) with full booking details
    - Enhanced meal plan display (meals_per_day, meal types, descriptions)
46. ✅ **Stripe webhook integration**: Automatic booking status update and email sending on payment capture
47. ✅ **Admin booking management**: Sync with Stripe button, resend confirmation email, capture payment buttons
48. ✅ **Auto-refresh booking list**: Admin dashboard refreshes automatically after status changes
49. ✅ **Email styling simplified**: Clean design with light blue header, simple green checkmarks, consistent gray containers
50. ✅ **Payment intent search**: Sync endpoint searches Stripe for payment intents if not stored in booking

### Database Migrations
- `001_initial_schema.sql`: Core tables (profiles, gyms, gym_images, bookings, reviews)
- `002_storage.sql`: Storage bucket for gym images
- `003_gym_details_expansion.sql`: opening_hours, trainers, accommodation_details, nearby_attractions, faq (JSONB fields)
- `004_add_gym_address.sql`: Full address field for gyms
- `005_add_pricing_options.sql`: Additional pricing columns (later replaced by packages)
- `006_create_packages.sql`: Packages table (Training Only, Training + Accommodation, All Inclusive)
- `007_create_package_variants.sql`: Package variants table for accommodation options
- `008_add_variant_images.sql`: Images array column for package variants
- `009_guest_checkout.sql`: Guest booking support (nullable user_id, guest fields, booking_reference, booking_pin)
- `010_booking_access_tokens.sql`: Magic link tokens for passwordless booking access
- `011_add_package_image.sql`: Main display image column for packages
- `012_manual_reviews_mvp.sql`: Manual review system (nullable booking_id, manual_review flag, gym_id)
- `013_add_reviewer_name.sql`: Reviewer name field for reviews
- `014_add_booking_details.sql`: Cancellation policy, meal plan details (JSONB), room type for variants
- `015_gym_verification_system.sql`: Verification system (verification_status, stripe_connect_verified, google_maps_link, instagram_link, facebook_link, admin_approved, verified_at, trusted_at)

### Known Issues / TODOs
- Exchange rates are hardcoded (should use API in production)
- Some placeholder pages (contact, privacy, terms) need content
- Manual review system is MVP-only (see `MVP_REMOVAL_GUIDE.md` for removal instructions)
- Sport type carousel shows all disciplines even if some have 0 gyms (currently filtered, but could be improved)
- Homepage carousels show same gyms (will be filtered by category in future)
- Landmark caching triggered on gym approval (could be improved with background jobs)
- "Trusted" tier not yet implemented (structure ready, needs booking count and rating thresholds)
- Training schedule database field may need migration (currently stored as JSONB, works with existing structure)

### MVP-Specific Features (Remove Before Shipping)
- **Manual reviews**: Admin can add reviews without bookings (`manual_review` flag, nullable `booking_id`)
- See `MVP_REMOVAL_GUIDE.md` for detailed removal instructions

## File Structure Highlights
app/
├── page.tsx # Homepage (hero, search, destinations, multiple carousels, sport type browsing, how it works)
├── layout.tsx # Root layout (Navbar, Footer, CurrencyProvider, BookingProvider)
├── search/page.tsx # Gym search with filters
├── gyms/[id]/page.tsx # Gym details (gallery, description, facilities, packages, reviews)
├── bookings/
│ ├── page.tsx # "My Bookings" page (authenticated users + guest access)
│ ├── summary/page.tsx # Booking summary/checkout page (Booking.com style)
│ ├── [id]/payment/page.tsx # Payment page with Stripe Elements
│ ├── [id]/success/page.tsx # Booking success confirmation (comprehensive trust-building elements)
│ ├── [id]/review/page.tsx # Review submission page
│ ├── access/[token]/page.tsx # Magic link booking access
│ └── request-access/page.tsx # Request magic link via email + reference
├── auth/ # Sign in, sign up (automatic role assignment: fighter by default, owner with intent=owner)
├── manage/ # Owner dashboard
│ ├── onboarding/page.tsx # Create gym (multi-step form) - collects verification links, creates in draft status
│ ├── gym/edit/page.tsx # Edit gym profile (production-ready design, comprehensive amenities, training schedule, searchable country selector, optional fields) - admins can edit any gym
│ ├── bookings/page.tsx # Manage bookings
│ ├── stripe-connect/page.tsx # Stripe Connect setup
│ └── page.tsx # Owner dashboard (shows verification checklist)
├── admin/
│ ├── page.tsx # Admin panel (gym approval, manual reviews, triggers landmark fetching)
│ └── gyms/page.tsx # Admin gym management (view/edit all gyms, verify gyms with one-click button)
└── dashboard/page.tsx # Fighter dashboard (my bookings)
components/
├── navbar.tsx # Header with currency selector (role-based link visibility)
├── footer.tsx # Footer with links, currency, and partner logos
├── featured-carousel.tsx # Horizontal scrolling gym cards with verified badges
├── sport-type-carousel.tsx # Horizontal scrolling sport type cards with dates and counts
├── gym-gallery.tsx # Image gallery with lightbox
├── gym-map.tsx # Map preview in sidebar
├── reserve-button.tsx # Reserve button in gym header (disabled for draft gyms)
├── packages-list.tsx # Package cards with variant selection modal, package images
├── property-highlights-card.tsx # Dynamic property highlights
├── good-to-know-card.tsx # Dynamic "Good to know" based on package/variant data
├── review-card.tsx # Individual review card with star ratings, "See more/less"
├── reviews-carousel.tsx # Horizontal review carousel (3 per row)
├── reviews-link-button.tsx # "Read all reviews" scroll button
├── contact-support-modal.tsx # Contact support modal with email API
├── booking-modal.tsx # (Legacy - replaced by booking summary page)
├── search-form.tsx # Homepage search bar with date range picker
├── date-range-picker.tsx # Booking.com-style date range picker with two-month calendar
└── verification-checklist.tsx # Verification status display with requirements checklist
components/manage/
└── package-manager.tsx # Package and variant management for gym owners
lib/
├── contexts/
│ ├── currency-context.tsx # Currency state & conversion
│ └── booking-context.tsx # Global booking state (selected package, dates, guest count)
├── hooks/use-auth.ts # Auth state hook
├── supabase/ # Supabase clients (server/client)
├── types/database.ts # TypeScript interfaces (includes package image, reviewer_name, booking details fields, verification fields)
├── utils/
│ ├── landmarks.ts # OpenStreetMap landmark fetching and formatting
│ └── property-highlights.ts # Dynamic property highlights generation
├── email.ts # Email utilities (Resend HTTP API) - includes contact support emails
└── stripe.ts # Stripe client initialization
public/
├── # Static assets directory
├── # Partner logos (7 organization logos)
└── # Sport type images (Muay Thai, MMA, etc.)
## Critical Implementation Details

### Package-Based Pricing Model
1. **Package Types**:
   - `training`: Training Only (billed per day/session, minimum 1 day)
   - `accommodation`: Training + Accommodation (billed per week, minimum 1 week, rounded up)
   - `all_inclusive`: All Inclusive (billed per week, minimum 1 week, rounded up)
2. **Package Variants**: Only for packages with accommodation. Each variant has:
   - Name, description, images array, pricing (per day/week/month)
   - Displayed in modal with image carousel
3. **Pricing Display Logic**:
   - No dates selected: "Starting from $X / session" (Training Only) or "/ week" (accommodation)
   - Dates selected: Shows total price for selected duration with correct billing unit
4. **Package Selection Flow**: Gym → Package → Variant (if applicable) → Booking Summary → Payment

### Image Upload & Management Flow
1. User selects images in onboarding/edit form (up to 30 images)
2. Images uploaded to Supabase Storage (`gym-images/{gymId}/{timestamp}-{index}.{ext}`)
3. Public URLs generated and inserted into `gym_images` table with `order` column
4. **Drag-and-drop reordering**: Images can be reordered in edit page, order persisted to database
5. First image (order = 0) is the main photo shown in search results and galleries
6. Images sorted by `order` when displayed on gym pages

### Guest Checkout Flow
1. **No authentication required**: Users can book without creating an account
2. **Booking creation**: Collects `guest_email`, `guest_name`, `guest_phone` (email and name required)
3. **Booking reference**: Auto-generated unique reference (e.g., "BK-AY3")
4. **Booking PIN**: Auto-generated 6-digit PIN for additional security
5. **Magic links**: Secure tokens sent via email for passwordless booking access
6. **Access methods**:
   - Magic link from confirmation email (single-use, expires)
   - Booking reference + email fallback via `/bookings/request-access`
7. **RLS policies**: Allow `INSERT` for anyone, `SELECT` for `user_id IS NULL` (guest bookings)

### Booking Flow (Guest Checkout)
1. User selects gym → Package → Variant (if applicable)
   - **Verification check**: Only verified/trusted gyms can be booked (draft gyms blocked)
2. **Booking Summary Page** (`/bookings/summary`):
   - Left sidebar: Gym details, booking details (dates, package, variant), price summary
   - Center: User details form (name, email, phone, country, booking for, discipline, experience, notes)
   - Button: "Final Steps" (not "Request Booking")
3. **Payment Page** (`/bookings/[id]/payment`):
   - Left sidebar: Same booking summary
   - Center: Stripe PaymentElement for card details
   - Message: "Your card will be authorised now and charged once the gym confirms availability"
   - Button: "Confirm Booking"
4. **Payment Authorization**:
   - Stripe PaymentIntent created with `capture_method: 'manual'`
   - Card authorized (funds reserved, not charged)
   - Booking status: `pending_confirmation`
5. **Email Notifications**:
   - **Admin email**: Full booking details, user info, payment intent ID, action items
   - **User email**: Confirmation with booking reference, magic link, "card authorized not charged" message
6. **Manual Confirmation**:
   - Admin confirms with gym
   - Admin captures payment via `/api/bookings/[id]/capture`
   - Booking status: `confirmed`
   - Platform keeps commission, manually settles with gym (offline)
7. **After completion**: User can leave review

### Payment Flow Details
- **Payment Intent**: Created with `capture_method: 'manual'` (authorization only)
- **Idempotent**: Reuses existing PaymentIntent if booking already has one
- **Capture**: Manual via admin dashboard (not automatic)
- **Decline**: Cancels PaymentIntent, releases authorization, sets status to `declined`
- **Platform commission**: Calculated at booking creation, stored in `platform_fee` column
- **Gym payout**: Manual/offline (not automated in MVP)

### Map Integration
- Uses Google Maps Embed API
- Priority: 1) Manual address, 2) Name + city, 3) Coordinates
- API key stored in `.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
- Key must have HTTP referrer restrictions in Google Cloud Console
- Map displayed in non-sticky sidebar on gym pages

### Landmark Integration
- **OpenStreetMap Nominatim API**: Used for geocoding addresses and finding nearby landmarks
- **Caching**: Landmarks stored in `gyms.nearby_attractions` JSONB column to avoid repeated API calls
- **Trigger**: Landmarks fetched and cached when gym is approved (via `/api/gyms/[id]/fetch-landmarks`)
- **Display**: Shows in gym description (e.g., "South Bank Parklands and Fortitude Valley are within walking distance")
- **Disclaimer**: "Distance in property description is calculated using © OpenStreetMap" (only shown if landmarks found)
- **Language**: Requests English names via `accept-language=en` header
- **Performance**: Database-first approach (check cache, use if available, fetch in background if missing)

### Currency Conversion
- Exchange rates hardcoded in `currency-context.tsx`
- Conversion: Amount → USD → Target Currency
- Format: `{CURRENCY} {amount}` (e.g., "AUD 45.00")
- Persists in localStorage
- Updates all prices site-wide when changed

## Design Patterns

### Loading States
- **All loading states use skeleton loaders** (no "Loading..." text or spinners)
- Server Components: Use `loading.tsx` files for skeletons
- Client Components: Skeleton UI matching actual content structure
- Skeletons use `bg-gray-200` with `animate-pulse` for consistent feel
- Avoid full-page white "Loading..." screens

### Error Handling
- Form errors displayed inline
- Database errors logged to console
- User-friendly error messages

### Navigation
- Use `router.replace()` for auth redirects (avoids back button issues)
- Use `window.location.href` for hard refreshes when needed
- Links open in new tabs for gym cards (preserves scroll position) 

## Environment Variables Required

### Local Development
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI (stripe listen)

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# Resend (Email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev  # Default fallback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_COMMISSION_RATE=0.15
```

### Production
```env
# Supabase (same as dev, but verify URLs)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (PRODUCTION keys - different from test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard webhook settings

# Google Maps (same key, but verify API restrictions)
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# Resend (PRODUCTION - verify domain)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@combatbooking.com  # Use your verified domain

# App (PRODUCTION URL)
NEXT_PUBLIC_APP_URL=https://combatbooking.com
PLATFORM_COMMISSION_RATE=0.15
```

## Deployment Checklist: Local → Production

### ⚠️ Critical: Environment Variables to Update

1. **Stripe Keys**:
   - [ ] Switch from test keys (`pk_test_`, `sk_test_`) to live keys (`pk_live_`, `sk_live_`)
   - [ ] Update `STRIPE_WEBHOOK_SECRET` to production webhook secret (from Stripe Dashboard)
   - [ ] Verify Stripe webhook endpoint is configured in Stripe Dashboard pointing to production URL

2. **Resend Email**:
   - [ ] Update `RESEND_FROM_EMAIL` to production email (e.g., `noreply@combatbooking.com`)
   - [ ] Verify domain in Resend dashboard (add SPF, DKIM records)
   - [ ] Test email sending in production

3. **App URL**:
   - [ ] Update `NEXT_PUBLIC_APP_URL` from `http://localhost:3000` to `https://combatbooking.com`
   - [ ] Verify all email links use production URL
   - [ ] Check magic link generation uses production URL

4. **Google Maps**:
   - [ ] Verify API key restrictions (HTTP referrer) include production domain
   - [ ] Test map embeds on production

5. **Supabase**:
   - [ ] Verify production Supabase project URLs (if using separate project)
   - [ ] Check RLS policies are correct for production
   - [ ] Verify storage bucket permissions

### Stripe Webhook Setup (Production)

1. **In Stripe Dashboard**:
   - [ ] Go to Developers → Webhooks
   - [ ] Click "Add endpoint"
   - [ ] Enter production URL: `https://combatbooking.com/api/webhooks/stripe`
   - [ ] Select event: `payment_intent.succeeded`
   - [ ] Copy webhook signing secret (starts with `whsec_`)
   - [ ] Add to production `.env` as `STRIPE_WEBHOOK_SECRET`

2. **Test Webhook**:
   - [ ] Use Stripe Dashboard to send test event
   - [ ] Verify webhook is received and processed
   - [ ] Check server logs for any errors

### Database & Storage

1. **Supabase**:
   - [ ] Run all migrations on production database
   - [ ] Verify RLS policies are enabled
   - [ ] Check storage bucket is public (for gym images)
   - [ ] Test image uploads in production

2. **Data Migration** (if needed):
   - [ ] Export test data if needed
   - [ ] Import to production (if applicable)
   - [ ] Verify all gyms have correct verification status

### Domain & SSL

1. **Domain Configuration**:
   - [ ] Point domain to hosting provider
   - [ ] Configure SSL certificate (Let's Encrypt or provider SSL)
   - [ ] Verify HTTPS redirect works
   - [ ] Test all pages load correctly

2. **DNS Records** (for email):
   - [ ] Add SPF record for Resend domain
   - [ ] Add DKIM record for Resend domain
   - [ ] Verify domain in Resend dashboard

### Testing Checklist (Production)

1. **Authentication**:
   - [ ] Test sign up (fighter and owner roles)
   - [ ] Test sign in
   - [ ] Test email verification (if enabled)

2. **Gym Management**:
   - [ ] Test gym creation (onboarding)
   - [ ] Test gym editing
   - [ ] Test image upload and reordering
   - [ ] Test package creation

3. **Booking Flow**:
   - [ ] Test guest checkout (no account required)
   - [ ] Test payment authorization (use real test card)
   - [ ] Verify initial confirmation email sent
   - [ ] Test payment capture in admin dashboard
   - [ ] Verify confirmation email sent after capture
   - [ ] Test webhook triggers (or use sync button)

4. **Email System**:
   - [ ] Verify all emails send correctly
   - [ ] Check email formatting (HTML and plain text)
   - [ ] Test magic links work
   - [ ] Verify booking reference and PIN in emails

5. **Admin Features**:
   - [ ] Test gym verification
   - [ ] Test booking management
   - [ ] Test "Sync with Stripe" button
   - [ ] Test "Resend Confirmation Email" button

### Monitoring & Logging

1. **Error Tracking**:
   - [ ] Set up error monitoring (e.g., Sentry)
   - [ ] Configure email alerts for critical errors
   - [ ] Test error logging

2. **Analytics**:
   - [ ] Set up Google Analytics (if using)
   - [ ] Configure conversion tracking
   - [ ] Test event tracking

### Security Checklist

1. **Environment Variables**:
   - [ ] Never commit `.env` files to git
   - [ ] Use secure environment variable storage (Vercel, Railway, etc.)
   - [ ] Rotate secrets if exposed

2. **API Keys**:
   - [ ] Verify all API keys have proper restrictions
   - [ ] Use separate keys for production vs development
   - [ ] Enable rate limiting where possible

3. **Database**:
   - [ ] Verify RLS policies are correct
   - [ ] Check backup configuration
   - [ ] Test database restore process

### Post-Deployment

1. **Immediate Checks**:
   - [ ] Test homepage loads
   - [ ] Test search functionality
   - [ ] Test gym detail pages
   - [ ] Test booking flow end-to-end
   - [ ] Check all emails are sending

2. **Monitoring**:
   - [ ] Monitor error logs for first 24 hours
   - [ ] Check Stripe webhook delivery status
   - [ ] Verify email delivery rates
   - [ ] Monitor database performance

3. **Documentation**:
   - [ ] Update any hardcoded URLs in documentation
   - [ ] Document production-specific configurations
   - [ ] Create runbook for common issues

## Testing Checklist

- [ ] Gym creation flow (onboarding form)
- [ ] Image upload to Supabase Storage (up to 30 images)
- [ ] Image drag-and-drop reordering
- [ ] Package creation and variant management
- [ ] Gym approval (admin panel, triggers landmark fetching)
- [ ] **Gym verification system**:
  - [ ] Gym created in draft status
  - [ ] Draft gym not visible in search
  - [ ] Owner can preview draft gym
  - [ ] Public user sees "Not Available" for draft
  - [ ] Verification checklist shows requirements
  - [ ] Stripe Connect status updates correctly
  - [ ] Admin can verify gym when all requirements met
  - [ ] Admin sees error if requirements not met
  - [ ] Verified gyms appear in search
  - [ ] Draft gyms cannot be booked
- [ ] Search and filters (with date selection)
- [ ] Package selection flow (Training Only vs Accommodation)
- [ ] Variant selection modal (image carousel)
- [ ] Guest checkout flow (no authentication)
- [ ] Booking summary page
- [ ] Payment authorization (Stripe test cards)
- [ ] Email notifications (admin and user)
- [ ] Magic link booking access
- [ ] Booking reference + email fallback
- [ ] Payment capture (admin)
- [ ] Currency conversion
- [ ] Map display (all gyms)
- [ ] Landmark display and caching
- [ ] Property highlights (dynamic based on dates)
- [ ] Reviews (after completed booking)
- [ ] Date range picker (homepage search bar)

## Next Steps / Future Enhancements

1. **Filter carousels by category**: Make homepage carousels show relevant gyms (e.g., Muay Thai Gyms only shows Muay Thai gyms)
2. Real-time exchange rate API integration
3. Admin panel enhancements (better booking management UI)
4. Advanced search filters (amenities, training schedule availability)
5. User favorites/bookmarks
6. Booking calendar view for owners
7. Automated landmark refresh (background jobs/cron)
8. Stripe Connect integration for direct gym payouts (future)
9. Mobile app (future)
10. Instant booking calendars (future - currently manual confirmation)
11. **Remove MVP features**: Manual review system before shipping (see `MVP_REMOVAL_GUIDE.md`)
12. **Trusted tier implementation**: Auto-promote to "Trusted" after X completed bookings with good ratings
13. **Optional verification tools**: Business license upload, live video walkthrough (manual admin requests)
14. **Display training schedule on gym pages**: Show training schedule information to customers
15. **Amenities filtering**: Allow customers to filter gyms by amenities in search

---

## Current Design Patterns & Styling

### Homepage Carousels
- **Consistent spacing**: `pt-4 pb-4` between sections (first section `pt-12`)
- **Titles and subtitles**: Bold titles (`text-2xl font-bold mb-1`), regular subtitles (`text-gray-700 mb-6`)
- **Scroll buttons**: All carousels have left/right navigation buttons (white circular with shadow)
- **Card sizing**: 4 cards visible per viewport (`min-w-[calc(25%-12px)]`)
- **Verified badges**: Green checkmark with "Verified" text below destination on gym cards

### Sport Type Cards
- **Square/rectangular images**: `aspect-[5/4]` ratio (slightly wider than tall)
- **Real data**: Shows actual gym counts per discipline, dynamically determines country
- **Dates display**: Always shows dates (from search params or defaults) in format "6 Feb - 8 Feb, 1 adult"
- **Scroll buttons**: Same styling as gym carousels for consistency

### Booking Flow Pages
- **Progress bar**: Consistent 3-step indicator across summary, payment, and success pages
- **Price summary**: Light gray header, no platform fee, green ticks for included items
- **Gym summary box**: Includes star rating, review count (if any), bolder address, amenity icons
- **Spacing**: Consistent padding and border styling (`rounded-lg`, darker borders for depth)

### Review System
- **Star ratings**: Booking.com-style star icons (not emojis)
- **"See more/less"**: Expandable review comments for long text
- **Horizontal carousel**: 3 reviews per row, square-shaped cards
- **Reviewer names**: Manual reviews include reviewer_name field

### Navigation
- **Role-based visibility**:
  - Admin: "Admin", "Gyms", "My Bookings", "List your gym"
  - Owner: "Manage", "My Bookings", "List your gym"
  - Fighter: "My Bookings", "List your gym"
  - Signed out: "List your gym", "Register", "Sign in"
- **"My Bookings"**: Single page for all users (`/bookings`), supports guest access via PIN

---

**Last Updated**: Current session
**Project Status**: MVP in active development, preparing for launch
**Primary Focus**: Conversion optimization, UX polish, and trust-building elements

## Email System

### Two-Step Email Flow
1. **Initial Booking Request Email** (`sendUserConfirmationEmail`):
   - Sent immediately after payment authorization
   - Title: "Your booking request for [Gym] has been received"
   - Clear messaging: Card authorized but NOT charged yet
   - Explains: Gym will confirm availability, card will be charged upon confirmation
   - Includes: Booking reference, PIN, magic link, authorized amount
   - Status: "Authorized" (orange) not "Paid" (green)

2. **Confirmation Email** (`sendBookingConfirmedEmail`):
   - Sent only after gym confirms and payment is captured
   - Title: "You're On The Way! Your [Gym] Has Confirmed Your Booking"
   - Includes: Full booking details, payment info (charged amount, card details, date), meal plan details
   - Styling: Clean design with light blue header (#e6f2ff), simple green checkmarks, consistent gray containers
   - Meal plan: Shows meals_per_day, meal types (Breakfast/Lunch/Dinner), full description

### Email Triggers
- **Initial email**: Sent via `/api/bookings/[id]/notify` after payment authorization
- **Confirmation email**: Sent via:
  - `/api/bookings/[id]/capture` (manual capture)
  - `/api/bookings/[id]/sync-stripe` (sync with Stripe)
  - `/api/webhooks/stripe` (automatic webhook)
  - `/api/bookings/[id]/resend-confirmation` (manual resend)

### Idempotency
- Prevents duplicate emails by checking booking status before sending
- Initial email only sent if status is `pending_payment` or `pending_confirmation`
- Confirmation email only sent if status is not already `confirmed`

## Stripe Webhook Integration

### Webhook Endpoint
- **Route**: `/api/webhooks/stripe`
- **Event**: `payment_intent.succeeded`
- **Actions**: 
  - Finds booking by `stripe_payment_intent_id`
  - Updates booking status to `confirmed`
  - Sends confirmation email to guest
  - Includes idempotency checks

### Webhook Setup
- **Local Development**: Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- **Production**: Configure webhook endpoint in Stripe Dashboard
- **Secret**: Use Stripe CLI secret for local, Dashboard secret for production
- See `WEBHOOK_SETUP.md` for detailed instructions

### Manual Sync Endpoint
- **Route**: `/api/bookings/[id]/sync-stripe`
- **Purpose**: Manually sync booking status with Stripe payment intent
- **Features**:
  - Searches Stripe for payment intent if not stored in booking
  - Updates booking status if payment succeeded
  - Sends confirmation email if status updated
  - Detailed logging for debugging

## Admin Booking Management

### Booking Details Modal
- **Status Badges**: Visual indicators (Pending Payment, Pending Confirmation, Confirmed, etc.)
- **Action Buttons**:
  - "Capture Payment & Confirm Booking" (for pending_confirmation/awaiting_approval)
  - "Resend Confirmation Email" (for confirmed bookings)
  - "Sync with Stripe" (for any status with payment intent)
- **Auto-refresh**: Booking list refreshes automatically after status changes

### Booking Status Flow
1. `pending_payment` → Payment intent created, card not yet authorized
2. `pending_confirmation` → Card authorized, waiting for gym confirmation
3. `confirmed` → Payment captured, booking confirmed, confirmation email sent
4. `declined` → Booking declined, payment authorization released
5. `completed` → Booking completed, review allowed

## Recent Updates (Current Session)

### Edit Gym Page - Production Redesign
- **Complete UI/UX overhaul**: Redesigned with proper width (max-w-6xl), card-based sections, improved spacing and visual hierarchy
- **Comprehensive amenities system**: 25+ amenities organized into logical categories
  - Basic Facilities: wifi, parking, showers, locker_room, air_conditioning, security
  - Accommodation & Services: accommodation, meals, restaurant, cafe, laundry, airport_transfer
  - Training Facilities: equipment, swimming_pool, sauna, recovery_facilities, pro_shop
  - Services & Support: personal_training, group_classes, massage, nutritionist, physiotherapy, competition_prep
  - Special Features: twenty_four_hour, beginner_friendly, english_speaking
- **Simplified amenities UI**: Single responsive grid (2-5 columns) with visual feedback, checked items highlighted and sorted first
- **Training schedule system**: 
  - Multiple sessions per day support (time + optional type per session)
  - Collapsible section to save space (optional field)
  - Days without training can be left empty
  - Stored as JSONB: `{ day: [{ time: string, type?: string }] }`
- **Searchable country selector**: 
  - All 195+ countries with real-time search
  - Dropdown with keyboard navigation
  - Visual feedback (selected country highlighted)
  - Clear button to reset selection
- **Additional optional fields**:
  - Opening hours (per day)
  - Trainers list (name, discipline, experience)
  - Accommodation details (type, description)
  - FAQ section (question/answer pairs)
- **Section organization**: 
  - Basic Information → Location & Verification → Disciplines & Amenities → Images → Additional Details → Base Pricing → Packages → Action Buttons
  - Packages section moved above action buttons, styled as Card
  - All sections use consistent Card styling
- **Form element sizing**: Appropriate max-widths for different input types (not full-width containers)
- **Production-ready polish**: Consistent spacing, hover states, transitions, accessible focus states