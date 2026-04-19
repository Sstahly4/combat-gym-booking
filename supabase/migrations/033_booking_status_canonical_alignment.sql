-- Milestone 3A: align bookings.status to canonical lifecycle
-- Canonical statuses: pending, confirmed, paid, completed, declined, cancelled

BEGIN;

-- 1) Backfill legacy values into canonical equivalents.
UPDATE public.bookings
SET status = CASE
  WHEN status IN ('pending_payment', 'pending_confirmation', 'awaiting_approval') THEN 'pending'
  WHEN status = 'gym_confirmed' THEN 'confirmed'
  ELSE status
END
WHERE status IN ('pending_payment', 'pending_confirmation', 'awaiting_approval', 'gym_confirmed');

-- 2) Remove old status constraints (names vary by migration history).
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_status;

-- 3) Enforce canonical statuses only.
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending', 'confirmed', 'paid', 'completed', 'declined', 'cancelled'));

-- 4) Refresh status indexes for canonical query patterns.
DROP INDEX IF EXISTS idx_bookings_status_pending;
DROP INDEX IF EXISTS idx_bookings_status_gym_confirmed;
DROP INDEX IF EXISTS idx_bookings_status_paid;

CREATE INDEX IF NOT EXISTS idx_bookings_status_pending
ON public.bookings(status)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bookings_status_confirmed
ON public.bookings(status)
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_bookings_status_paid
ON public.bookings(status)
WHERE status = 'paid';

COMMENT ON COLUMN public.bookings.status IS 'Canonical booking status: pending, confirmed, paid, completed, declined, cancelled.';

COMMIT;
