# MVP Removal Guide - Manual Reviews

## ⚠️ IMPORTANT: Remove Before Shipping

This guide outlines all manual review functionality that must be removed before shipping the product. Manual reviews are MVP-only and should be replaced with verified reviews from actual bookings.

## Files to Modify/Remove

### 1. Database Migration (Remove)
- **File**: `supabase/migrations/012_manual_reviews_mvp.sql`
- **Action**: Delete this migration file
- **Note**: You may want to keep the migration but remove the manual review policies, or create a new migration to revert changes

### 2. TypeScript Types (Update)
- **File**: `lib/types/database.ts`
- **Action**: Remove `manual_review` and `gym_id` from `Review` interface
- **Action**: Make `booking_id` required again (remove `| null`)

### 3. Admin Page (Remove Section)
- **File**: `app/admin/page.tsx`
- **Action**: Remove the entire "Manual Reviews (MVP Only)" section
- **Action**: Remove `allGyms` state and `showManualReview`, `manualReviewForm` states
- **Action**: Remove `handleCreateManualReview` function
- **Action**: Remove manual review imports (`Input`, `Label`, `Textarea`, `Select`)

### 4. Gym Page Query (Update)
- **File**: `app/gyms/[id]/page.tsx`
- **Action**: Remove the manual reviews fetch query
- **Action**: Remove the code that combines booking reviews and manual reviews
- **Action**: Keep only the booking-based reviews

### 5. Database Schema (Revert)
- **Action**: Create a new migration to:
  - Make `booking_id` NOT NULL again
  - Remove `manual_review` column
  - Remove `gym_id` column from reviews table
  - Remove admin policies for manual reviews

## What to Keep

✅ **Keep all existing reviews** - Manual reviews will remain in the database and continue to display
✅ **Keep the review display logic** - Reviews already show "Verified Guest" which works for both types
✅ **Keep booking-based review creation** - This is the production flow

## Testing Checklist

After removal:
- [ ] Admin page no longer shows manual review section
- [ ] Only booking-based reviews can be created
- [ ] Existing manual reviews still display correctly
- [ ] No TypeScript errors
- [ ] Database constraints are correct

## Notes

- Manual reviews created during MVP will remain in the database
- They will continue to display as "Verified Guest" 
- No user-facing changes needed - reviews display the same way
- This is a backend/admin-only removal
