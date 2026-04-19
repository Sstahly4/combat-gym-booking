-- Milestone 4 closeout + cross-cutting hardening.
-- Adds: telemetry events, MFA recovery codes (hashed), payout-change hold workflow.
-- Trusted-device storage is intentionally out of scope until the product surface ships.

-- 1. Owner-portal telemetry ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_telemetry_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  gym_id      UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_owner_telemetry_events_event_type
  ON public.owner_telemetry_events(event_type);
CREATE INDEX IF NOT EXISTS idx_owner_telemetry_events_user_id
  ON public.owner_telemetry_events(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_telemetry_events_gym_id
  ON public.owner_telemetry_events(gym_id);
CREATE INDEX IF NOT EXISTS idx_owner_telemetry_events_created_at
  ON public.owner_telemetry_events(created_at DESC);

ALTER TABLE public.owner_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Owners can read their own events; admins can read everything.
DROP POLICY IF EXISTS "Owners read their own telemetry" ON public.owner_telemetry_events;
CREATE POLICY "Owners read their own telemetry"
  ON public.owner_telemetry_events
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all telemetry" ON public.owner_telemetry_events;
CREATE POLICY "Admins read all telemetry"
  ON public.owner_telemetry_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Inserts are server-side only (service role bypasses RLS).
DROP POLICY IF EXISTS "Authenticated users may insert their own events"
  ON public.owner_telemetry_events;
CREATE POLICY "Authenticated users may insert their own events"
  ON public.owner_telemetry_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);


-- 2. MFA recovery codes ----------------------------------------------------
-- Each row is a single one-time recovery code, stored as a salted hash.
-- We never store the plaintext.
CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id
  ON public.mfa_recovery_codes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_hash
  ON public.mfa_recovery_codes(user_id, code_hash);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can see only that their own codes exist (count + consumed_at), never
-- read code_hash. Mutations go through the API layer (service role / RPC).
DROP POLICY IF EXISTS "Users see their own recovery code rows" ON public.mfa_recovery_codes;
CREATE POLICY "Users see their own recovery code rows"
  ON public.mfa_recovery_codes
  FOR SELECT
  USING (user_id = auth.uid());


-- 3. Payout-change hold workflow on gyms -----------------------------------
-- When external bank account / details change, set a hold so owners are
-- nudged to re-confirm. Cleared by webhook once Stripe re-verifies.
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS payouts_hold_active   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_hold_reason   TEXT,
  ADD COLUMN IF NOT EXISTS payouts_hold_set_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payouts_hold_cleared_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gyms.payouts_hold_active IS
  'True while a payout change requires owner re-confirmation. Set/cleared by Stripe webhook.';
