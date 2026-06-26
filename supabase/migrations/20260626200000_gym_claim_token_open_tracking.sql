-- Authoritative per-token open tracking for claim-link funnel analytics.
-- `first_opened_at` is set once when /claim/<token> succeeds (not inferred from gym-level telemetry).
-- `target_email` records the real owner address the admin intended to send the link to.

ALTER TABLE public.gym_claim_tokens
  ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_email TEXT;

COMMENT ON COLUMN public.gym_claim_tokens.first_opened_at IS
  'Set once when /claim/<token> succeeds for this specific token. Source of truth for link opens.';
COMMENT ON COLUMN public.gym_claim_tokens.target_email IS
  'Real owner email the admin provided when issuing the link (not the synthetic placeholder auth email).';

CREATE INDEX IF NOT EXISTS idx_gym_claim_tokens_first_opened_at
  ON public.gym_claim_tokens(first_opened_at)
  WHERE first_opened_at IS NOT NULL;
