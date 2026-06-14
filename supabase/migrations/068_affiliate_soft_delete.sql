-- Soft-delete affiliates: retire live referral code, keep bookings and payout history.

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retired_code VARCHAR(20);

COMMENT ON COLUMN public.affiliates.deleted_at IS
  'When the affiliate was removed; referral link stops working immediately.';
COMMENT ON COLUMN public.affiliates.retired_code IS
  'Former referral code after soft-delete. Historical bookings/clicks keep the string.';

-- Allow retiring code while historical rows keep affiliate_code text.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_affiliate_code_fkey;
ALTER TABLE public.affiliate_clicks DROP CONSTRAINT IF EXISTS affiliate_clicks_affiliate_code_fkey;

CREATE INDEX IF NOT EXISTS idx_affiliates_retired_code
  ON public.affiliates (retired_code)
  WHERE retired_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_affiliates_deleted_at
  ON public.affiliates (deleted_at)
  WHERE deleted_at IS NOT NULL;
