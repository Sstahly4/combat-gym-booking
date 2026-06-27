-- Owner-only click tracking + WhatsApp/sheet outreach delivery timestamp.
ALTER TABLE public.gym_claim_tokens
  ADD COLUMN IF NOT EXISTS owner_first_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outreach_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gym_claim_tokens.owner_first_opened_at IS
  'Set once when a non-admin user successfully redeems /claim/<token>. Admin smoke-tests do not set this.';

COMMENT ON COLUMN public.gym_claim_tokens.outreach_sent_at IS
  'Set when outreach confirms the claim URL was delivered (e.g. WhatsApp bot via mark-sent API).';

CREATE INDEX IF NOT EXISTS idx_gym_claim_tokens_owner_first_opened_at
  ON public.gym_claim_tokens(owner_first_opened_at)
  WHERE owner_first_opened_at IS NOT NULL;
