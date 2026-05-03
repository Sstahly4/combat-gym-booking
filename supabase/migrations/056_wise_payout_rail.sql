-- Payout rail: Wise (platform outbound) vs legacy Stripe Connect per gym.
-- Wise recipient fields are populated after successful Wise API recipient creation.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS payout_rail TEXT NOT NULL DEFAULT 'wise'
    CHECK (payout_rail IN ('wise', 'stripe_connect'));

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS wise_recipient_id TEXT,
  ADD COLUMN IF NOT EXISTS wise_recipient_currency TEXT,
  ADD COLUMN IF NOT EXISTS wise_payout_ready BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.gyms.payout_rail IS 'wise: platform pays gym via Wise recipient; stripe_connect: gym uses Stripe Connect';
COMMENT ON COLUMN public.gyms.wise_recipient_id IS 'Wise recipient/account id after create (v1+v2 compatible)';
COMMENT ON COLUMN public.gyms.wise_recipient_currency IS 'Target currency for Wise payouts (e.g. THB, USD, EUR)';
COMMENT ON COLUMN public.gyms.wise_payout_ready IS 'True when recipient is saved and validated for outbound payouts';

-- Existing Connect gyms stay on Stripe rail; others default to Wise per product default.
UPDATE public.gyms
SET payout_rail = 'stripe_connect'
WHERE stripe_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gyms_payout_rail ON public.gyms (payout_rail);
