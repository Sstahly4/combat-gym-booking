-- Request-to-Book Flow: Standardized Marketplace Status Machine
-- Status Flow: Pending → Gym_Confirmed → Paid → Completed

-- First, add new statuses to the enum
-- Note: We'll need to drop and recreate the constraint since PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction easily

-- Step 1: Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Step 2: Add new status constraint with all statuses (old + new)
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  -- Legacy statuses (for backward compatibility)
  'pending_payment',
  'pending_confirmation',
  'awaiting_approval',
  'confirmed',
  'declined',
  'completed',
  'cancelled',
  -- New Request-to-Book statuses
  'pending',           -- Guest sent request, waiting for gym response
  'gym_confirmed',     -- Gym accepted the request, waiting for payment
  'paid',              -- Payment captured, booking confirmed
  'completed'          -- Booking completed (already exists, but keeping for clarity)
));

-- Update default status to 'pending' for new bookings (request-to-book default)
ALTER TABLE bookings 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add fields to support request-to-book flow
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS request_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gym_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMP WITH TIME ZONE;

-- Create index for pending requests (gym owners need to see these)
CREATE INDEX IF NOT EXISTS idx_bookings_status_pending ON bookings(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_bookings_status_gym_confirmed ON bookings(status) WHERE status = 'gym_confirmed';

-- Add comment for documentation
COMMENT ON COLUMN bookings.status IS 'Booking status: pending (request sent), gym_confirmed (gym accepted), paid (payment captured), completed (stay finished). Legacy statuses supported for backward compatibility.';
