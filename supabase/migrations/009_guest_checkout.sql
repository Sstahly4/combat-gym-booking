-- Enable guest checkout (Booking.com model)
-- Make user_id nullable for guest bookings
ALTER TABLE bookings 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add guest booking fields
ALTER TABLE bookings
  ADD COLUMN guest_email text,
  ADD COLUMN guest_phone text,
  ADD COLUMN guest_name text,
  ADD COLUMN booking_reference text UNIQUE,
  ADD COLUMN booking_pin text;

-- Create index for booking reference lookups
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_guest_email ON bookings(guest_email);

-- Update RLS policies to allow guest bookings
-- Allow anyone to create bookings (guest checkout)
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Allow access to bookings by reference + PIN or by user_id
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
-- Also drop the policy from initial schema if it exists with different name
DROP POLICY IF EXISTS "Owners can view bookings for their gyms" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

CREATE POLICY "Users can view their own bookings or guest bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL  -- Allow viewing guest bookings (PIN/reference checked in app layer)
  );

-- Re-add owner and admin policies
CREATE POLICY "Owners can view bookings for their gyms"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gyms 
      WHERE gyms.id = bookings.gym_id 
      AND gyms.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update update policy
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
