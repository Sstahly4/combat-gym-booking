-- Gym claim tokens: admin-issued, regeneratable, single-use links that let a
-- real owner take over a gym account that was pre-created by the platform.
--
-- Flow:
--   1. Admin pre-creates a gym whose owner is a synthetic Supabase user
--      (profiles.placeholder_account = true, claim_password_set = false).
--   2. Admin issues a claim link via /api/admin/gyms/:id/claim-link.
--   3. Owner opens /claim/<token> → server verifies, signs the synthetic user
--      in, marks the token claimed, redirects to /manage.
--   4. Hard prompt forces them to set a real password (claim_password_set = true).
--   5. Soft prompt nudges them to update their placeholder email.

CREATE TABLE IF NOT EXISTS public.gym_claim_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id      UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  -- SHA-256 of the plaintext token (we never store plaintext).
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  claimed_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_gym_claim_tokens_gym_id
  ON public.gym_claim_tokens(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_claim_tokens_expires_at
  ON public.gym_claim_tokens(expires_at);

-- Convenience partial index: only one *active* token per gym at a time
-- (active = not claimed AND not revoked AND not expired). Enforced at the
-- app layer when generating (we revoke prior actives), but this index keeps
-- lookups fast for "do we have an active token?".
CREATE INDEX IF NOT EXISTS idx_gym_claim_tokens_active
  ON public.gym_claim_tokens(gym_id)
  WHERE claimed_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.gym_claim_tokens ENABLE ROW LEVEL SECURITY;

-- Admins manage everything; nobody else can see/touch tokens.
DROP POLICY IF EXISTS "Admins manage gym claim tokens" ON public.gym_claim_tokens;
CREATE POLICY "Admins manage gym claim tokens"
  ON public.gym_claim_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_gym_claim_tokens_updated_at ON public.gym_claim_tokens;
-- (No updated_at column on this table by design — claim/revoke are explicit.)


-- Profile flags: surface "this account is a placeholder pending claim" and
-- "this account has not yet set their own password" so the manage UI can
-- show hard/soft prompts.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS placeholder_account BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_password_set  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS placeholder_email   TEXT;

COMMENT ON COLUMN public.profiles.placeholder_account IS
  'True for synthetic owner accounts created by an admin to back a pre-listed gym. Cleared once claim flow is complete.';
COMMENT ON COLUMN public.profiles.claim_password_set IS
  'False until a placeholder owner sets their own password via /api/manage/account/complete-claim.';
COMMENT ON COLUMN public.profiles.placeholder_email IS
  'Original synthetic auth email for the placeholder Supabase user (format is code-defined, e.g. claim+<gym_id>@claim.combatbooking.local). Not a mailbox you send owner comms through; claim links go to the real owner separately. Cleared when the owner sets a real email.';
