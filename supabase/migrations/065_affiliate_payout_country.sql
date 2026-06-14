-- Store affiliate-selected payout country from secure intake form.

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS payout_country VARCHAR(100);

COMMENT ON COLUMN public.affiliates.payout_country IS
  'Country selected on payout intake (e.g. Australia, United Kingdom). Drives bank vs PayPal rail.';

COMMENT ON COLUMN public.affiliates.payout_region IS
  'Derived from payout_country: au = bank transfer; international = PayPal.';
