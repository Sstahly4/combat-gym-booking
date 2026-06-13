-- One-time secure links for affiliates to submit their own payout details.

CREATE TABLE IF NOT EXISTS public.affiliate_intake_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates (id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_intake_tokens_affiliate_id
  ON public.affiliate_intake_tokens (affiliate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_intake_tokens_hash
  ON public.affiliate_intake_tokens (token_hash)
  WHERE completed_at IS NULL AND revoked_at IS NULL;

COMMENT ON TABLE public.affiliate_intake_tokens IS
  'Hashed one-time tokens for affiliate payout detail intake — plaintext shown to admin once.';

ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS payout_details_submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.affiliates.payout_details_submitted_at IS
  'When the affiliate completed the secure payout intake form.';

ALTER TABLE public.affiliate_intake_tokens ENABLE ROW LEVEL SECURITY;

-- No public RLS access — intake routes use service role after token validation.
