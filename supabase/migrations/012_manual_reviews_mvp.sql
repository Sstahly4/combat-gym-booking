-- MVP ONLY: Allow manual reviews to be created by admins
-- TODO: REMOVE THIS MIGRATION AND ALL MANUAL REVIEW FUNCTIONALITY BEFORE SHIPPING
-- This allows admins to manually add verified reviews for MVP purposes

-- Make booking_id nullable for manual reviews
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;

-- Add manual_review flag to identify admin-created reviews
ALTER TABLE reviews ADD COLUMN manual_review BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;

-- Update RLS to allow admins to create manual reviews
CREATE POLICY "Admins can create manual reviews (MVP ONLY)"
  ON reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    AND manual_review = true
  );

-- Allow admins to view all reviews including manual ones
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR (
      EXISTS (
        SELECT 1 FROM bookings
        JOIN gyms ON gyms.id = bookings.gym_id
        WHERE bookings.id = reviews.booking_id AND gyms.status = 'approved'
      )
    )
    OR (
      manual_review = true AND
      EXISTS (
        SELECT 1 FROM gyms
        WHERE gyms.id = reviews.gym_id AND gyms.status = 'approved'
      )
    )
  );
