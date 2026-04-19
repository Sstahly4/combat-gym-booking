-- Gym-level cancellation tone (wizard / settings); packages still carry the numeric window.
ALTER TABLE public.gyms
ADD COLUMN IF NOT EXISTS cancellation_policy_tone TEXT NOT NULL DEFAULT 'flexible'
  CHECK (cancellation_policy_tone IN ('flexible', 'moderate', 'strict'));

COMMENT ON COLUMN public.gyms.cancellation_policy_tone IS 'Marketing / tier label for cancellation; numeric days live on packages.';

-- Evidence snapshot at payment consent (mirrors Stripe PaymentIntent metadata).
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot JSONB;

COMMENT ON COLUMN public.bookings.cancellation_policy_snapshot IS 'Policy agreed at checkout: deadline, refund %, tone — used for capture timing and disputes.';
