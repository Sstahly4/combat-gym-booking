-- Stripe Connect account snapshot for owner payout UX (Milestone 4)
BEGIN;

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN,
  ADD COLUMN IF NOT EXISTS stripe_requirements_currently_due JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_requirements_pending_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS last_stripe_account_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_disabled_notified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gyms.stripe_charges_enabled IS 'Last seen Stripe Connect Account.charges_enabled';
COMMENT ON COLUMN public.gyms.stripe_payouts_enabled IS 'Last seen Stripe Connect Account.payouts_enabled';
COMMENT ON COLUMN public.gyms.stripe_details_submitted IS 'Last seen Stripe Connect Account.details_submitted';
COMMENT ON COLUMN public.gyms.stripe_requirements_currently_due IS 'Stripe requirements.currently_due';
COMMENT ON COLUMN public.gyms.stripe_requirements_pending_verification IS 'Stripe requirements.pending_verification';
COMMENT ON COLUMN public.gyms.stripe_disabled_reason IS 'Stripe requirements.disabled_reason';
COMMENT ON COLUMN public.gyms.last_stripe_account_sync_at IS 'When account.updated snapshot was last applied';
COMMENT ON COLUMN public.gyms.payout_disabled_notified_at IS 'When owner was last emailed about payouts being disabled';

COMMIT;
