-- Persist guest-selected training intensity on each booking.

BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS training_tier TEXT NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_training_tier_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_training_tier_check CHECK (
    training_tier IS NULL OR training_tier IN ('once_daily', 'twice_daily')
  );

COMMENT ON COLUMN public.bookings.training_tier IS
  'Guest-selected training intensity at checkout: once_daily (flexible) or twice_daily (full access).';

COMMIT;
