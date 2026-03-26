# Gym Verification System

## Overview

A comprehensive verification system to prevent fake gyms and ensure only legitimate, verified gyms are visible and bookable on the platform.

## Verification Tiers

### 1. Draft (Default)
- **Status**: Gym created, not visible to public
- **Owner Access**: Can preview their own gym
- **Requirements**: None (gym just created)
- **Visibility**: Hidden from search, not bookable

### 2. Verified (Live)
- **Status**: All requirements met, admin approved
- **Visibility**: Visible in search, bookable
- **Requirements**:
  - ✅ Stripe Connect fully enabled (KYC + bank account verified)
  - ✅ Google Maps listing link (matches gym address)
  - ✅ Active Instagram or Facebook page
  - ✅ Manual admin approval

### 3. Trusted
- **Status**: Proven track record
- **Visibility**: Visible in search, bookable, higher ranking
- **Requirements**:
  - All "Verified" requirements
  - X completed bookings (configurable)
  - No disputes
  - Good ratings
- **Benefits**: Badge display, higher search ranking

## Implementation Details

### Database Schema
- `verification_status`: 'draft' | 'verified' | 'trusted'
- `stripe_connect_verified`: boolean
- `google_maps_link`: text
- `instagram_link`: text
- `facebook_link`: text
- `admin_approved`: boolean
- `verified_at`: timestamp
- `trusted_at`: timestamp

### Key Features

1. **Draft Mode Preview**
   - Owners can preview their draft gyms
   - Public users see "Gym Not Available" message
   - Draft notice banner for owners

2. **Verification Checklist Component**
   - Shows all requirements with checkmarks
   - Real-time Stripe Connect status check
   - Links to update missing information
   - Status badges (Draft/Verified/Trusted)

3. **Admin Verification**
   - Admin panel shows verification status
   - "Verify Gym" button checks all requirements
   - Only verifies if all requirements met
   - Clear error messages for missing requirements

4. **Search Filtering**
   - Only verified/trusted gyms appear in search
   - Homepage carousels only show verified gyms
   - Draft gyms completely hidden from public

5. **Stripe Connect Integration**
   - Automatic verification check when account created
   - API endpoint to check verification status
   - Updates `stripe_connect_verified` flag automatically

## User Flow

### For Gym Owners:
1. Create gym → Status: Draft
2. Add Google Maps link (required)
3. Add Instagram/Facebook link (required)
4. Set up Stripe Connect (KYC + bank account)
5. Wait for admin approval
6. Gym becomes Verified → Live and bookable

### For Admins:
1. View gym in admin panel
2. See verification status and requirements
3. Click "Verify Gym" button
4. System checks all requirements automatically
5. If all met → Gym verified, status updated
6. If missing → Error message with details

## Security Features

- ✅ Draft gyms not visible to public
- ✅ Owner-only preview access
- ✅ Stripe Connect KYC verification required
- ✅ Google Maps link validation (must match address)
- ✅ Social media verification (active pages)
- ✅ Manual admin approval required
- ✅ All requirements checked before verification

## Future Enhancements (Optional)

- Business license upload (manual request)
- Live video walkthrough (manual request)
- Auto-promotion to "Trusted" after X bookings
- Dispute tracking system
- Rating threshold for "Trusted" status

## Files Modified/Created

### Database
- `supabase/migrations/015_gym_verification_system.sql`

### Types
- `lib/types/database.ts` - Added verification fields

### Components
- `components/verification-checklist.tsx` - Verification status display
- `components/search-form.tsx` - Updated date picker

### Pages
- `app/manage/onboarding/page.tsx` - Collects verification links
- `app/manage/gym/edit/page.tsx` - Edits verification links
- `app/manage/page.tsx` - Shows verification checklist
- `app/admin/gyms/page.tsx` - Admin verification interface
- `app/gyms/[id]/page.tsx` - Draft preview for owners
- `app/search/page.tsx` - Only shows verified gyms
- `app/page.tsx` - Only shows verified gyms

### API Routes
- `app/api/gyms/[id]/verify/route.ts` - Admin verification endpoint
- `app/api/gyms/[id]/check-stripe-status/route.ts` - Stripe status check
- `app/api/stripe/create-account/route.ts` - Auto-updates verification status

## Testing Checklist

- [ ] Gym created in draft status
- [ ] Draft gym not visible in search
- [ ] Owner can preview draft gym
- [ ] Public user sees "Not Available" for draft
- [ ] Verification checklist shows requirements
- [ ] Stripe Connect status updates correctly
- [ ] Admin can verify gym when all requirements met
- [ ] Admin sees error if requirements not met
- [ ] Verified gyms appear in search
- [ ] Only verified gyms on homepage
