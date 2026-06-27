-- Who opened the claim link first: admin smoke-test vs gym owner (heuristic at redeem time).
ALTER TABLE public.gym_claim_tokens
  ADD COLUMN IF NOT EXISTS first_opened_by TEXT
  CHECK (first_opened_by IS NULL OR first_opened_by IN ('admin', 'owner'));

COMMENT ON COLUMN public.gym_claim_tokens.first_opened_by IS
  'Set with first_opened_at. admin = opened within 5 minutes of issue (typical smoke-test); owner = later open.';
