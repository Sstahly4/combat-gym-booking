-- Pending affiliates: admin assigns tier only; partner completes setup via invite link.

ALTER TABLE public.affiliates
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN code DROP NOT NULL;

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

ALTER TABLE public.affiliates DROP CONSTRAINT IF EXISTS affiliates_code_format;
ALTER TABLE public.affiliates
  ADD CONSTRAINT affiliates_code_format
  CHECK (code IS NULL OR code ~ '^[a-z0-9]{1,20}$');

COMMENT ON COLUMN public.affiliates.setup_completed_at IS
  'When the affiliate finished the self-serve invite onboarding form.';
