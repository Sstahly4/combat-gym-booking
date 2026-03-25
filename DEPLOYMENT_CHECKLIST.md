# Deployment Checklist - Marketplace Engine v2

## ✅ Completed Features

### 1. Database Schema
- [x] Migration 019: Added `currency` column to packages
- [x] Migration 020: Added `pricing_config` JSONB column
- [x] Migration 021: Canonical offer types (4 types) with constraints
- [x] Migration 022: Standalone accommodations table + package_accommodations linking table
- [x] Migration 023: Request-to-Book status flow (pending → gym_confirmed → paid → completed)

### 2. Offer Stepper (Guided Onboarding)
- [x] Step 1: Offer Type Selection (4 canonical types)
- [x] Step 2: Basic Info (name, sport, description, currency)
- [x] Step 3: Duration Constraints (7/14/30 days + custom)
- [x] Step 4: Conditional Pricing & Accommodation Linking
  - [x] TYPE_TRAINING_ONLY: Price/week, Price/month
  - [x] TYPE_TRAINING_ACCOM: Training price + accommodation linking
  - [x] TYPE_ALL_INCLUSIVE: Flat fee + accommodation linking
  - [x] TYPE_CUSTOM_EXP: Fixed price
- [x] Step 5: Availability & Blackout Dates
- [x] Step 6: Review & Publish
- [x] Live Preview Pane (updates in real-time)

### 3. Accommodation Manager
- [x] Standalone CRUD for room variants
- [x] Image upload (up to 10 images)
- [x] CSV import/export
- [x] Active/inactive toggle
- [x] Amenities management

### 4. Package-Accommodation Linking
- [x] `package_accommodations` table created
- [x] Linking UI in offer stepper (Step 4)
- [x] Save linked accommodations on package creation/update
- [x] Load linked accommodations when editing
- [x] Support for TYPE_TRAINING_ACCOM and TYPE_ALL_INCLUSIVE

### 5. Request-to-Book Flow
- [x] Status machine: pending → gym_confirmed → paid → completed
- [x] Timestamp fields: request_submitted_at, gym_confirmed_at, payment_captured_at
- [x] API endpoints: `/api/bookings/[id]/accept-request`, `/api/bookings/[id]/decline-request`
- [x] Email notifications: acceptance and decline emails
- [x] Booking creation checks `booking_mode` and sets initial status
- [x] Webhook updated to handle new status flow

### 6. Integration
- [x] PackagesSection component integrates stepper + accommodation manager
- [x] Gym edit page uses new PackagesSection
- [x] Admin override UI for manual package editing
- [x] Toggle between new stepper and legacy manager (admin only)

## 🔍 Pre-Deployment Verification

### Database Migrations
Run these migrations in order:
1. `019_add_currency_to_packages.sql`
2. `020_add_pricing_config_to_packages.sql`
3. `021_canonical_offer_types.sql`
4. `022_standalone_accommodations.sql`
5. `023_request_to_book_status_flow.sql`

### Code Verification
- [x] Build passes: `pnpm run build`
- [x] No TypeScript errors
- [x] No linter errors
- [x] Accommodation linking saves to `package_accommodations` table
- [x] Booking creation respects `booking_mode` from package
- [x] Request-to-Book flow sets `request_submitted_at` timestamp

### Testing Checklist
- [ ] Create a package with TYPE_TRAINING_ACCOM and link accommodations
- [ ] Create a package with TYPE_ALL_INCLUSIVE and link accommodations
- [ ] Verify linked accommodations appear in `package_accommodations` table
- [ ] Create a booking with `booking_mode: 'request_to_book'` → should start as `pending`
- [ ] Accept a booking request → should transition to `gym_confirmed`
- [ ] Capture payment → should transition to `paid`
- [ ] Verify email notifications are sent

## 📝 Notes

- **Accommodation Linking**: Works for TYPE_TRAINING_ACCOM and TYPE_ALL_INCLUSIVE
- **Booking Mode**: Default is `request_to_book`. Packages can override to `instant`
- **Admin Override**: Allows manual editing of packages that don't fit 4 canonical types
- **Backward Compatibility**: Legacy packages still work, but new packages use canonical types

## 🚀 Deployment Steps

1. **Run Migrations** (in Supabase SQL Editor):
   ```sql
   -- Run migrations 019-023 in order
   ```

2. **Deploy Code**:
   ```bash
   git add .
   git commit -m "Marketplace Engine v2: Canonical offer types, accommodation manager, request-to-book flow"
   git push
   ```

3. **Verify**:
   - Check that new packages can be created with stepper
   - Verify accommodation linking works
   - Test request-to-book flow end-to-end
   - Check admin override functionality

## ⚠️ Known Issues / Future Work

- [ ] UI for gym owners to accept/decline booking requests (currently API-only)
- [ ] Payment link generation for gym_confirmed bookings
- [ ] Display linked accommodations on public package pages
- [ ] Migration script for existing packages to canonical types (optional)
