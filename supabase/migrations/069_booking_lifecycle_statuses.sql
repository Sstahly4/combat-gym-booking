-- Expand bookings.status for OTA-style funnel + terminal lifecycle tracking.
-- Existing rows keep canonical values; new granular statuses are written as flows mature.
-- Idempotent: safe to re-run if a prior attempt partially applied.

-- Drop known constraint names from earlier migrations.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS check_booking_status;

-- Drop any remaining CHECK on bookings.status (handles rename / partial applies).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bookings'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check
CHECK (status IN (
  -- legacy canonical (retained)
  'pending',
  'confirmed',
  'paid',
  'completed',
  'declined',
  'cancelled',
  -- funnel / pre-booking
  'checkout_initiated',
  'payment_failed',
  'abandoned',
  'pending_confirmation',
  -- terminal detail
  'cancelled_by_traveller',
  'cancelled_by_gym',
  'no_show',
  'refunded',
  'disputed'
));

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

UPDATE public.bookings
SET status_updated_at = COALESCE(status_updated_at, updated_at, created_at)
WHERE status_updated_at IS NULL;

COMMENT ON COLUMN public.bookings.status IS
  'Booking lifecycle: funnel (checkout_initiated, payment_failed, abandoned, pending_confirmation), active (confirmed, paid), terminal (completed, cancelled_*, no_show, refunded, disputed). Legacy pending/declined/cancelled retained.';

COMMENT ON COLUMN public.bookings.status_updated_at IS
  'Last time status changed — use for abandon timeouts and funnel analytics.';

CREATE INDEX IF NOT EXISTS idx_bookings_status_funnel
ON public.bookings(status)
WHERE status IN ('pending', 'checkout_initiated', 'payment_failed', 'abandoned', 'pending_confirmation');

CREATE INDEX IF NOT EXISTS idx_bookings_status_cancelled_detail
ON public.bookings(status)
WHERE status IN ('cancelled', 'declined', 'cancelled_by_traveller', 'cancelled_by_gym', 'no_show', 'refunded', 'disputed');
