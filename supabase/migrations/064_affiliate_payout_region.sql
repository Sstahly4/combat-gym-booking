-- Affiliate payout region: AU bank transfer vs international PayPal.

CREATE TYPE public.affiliate_payout_region AS ENUM ('au', 'international');

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS payout_region public.affiliate_payout_region NOT NULL DEFAULT 'au';

COMMENT ON COLUMN public.affiliates.payout_region IS
  'au = BSB/account intake only; international = PayPal email only. Set by admin at onboarding.';
