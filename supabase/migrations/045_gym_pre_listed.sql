-- 045_gym_pre_listed.sql
--
-- Adds an explicit `is_pre_listed` flag on gyms so the admin can mark a gym as
-- "this was created on behalf of a real owner — surface it in the claim-link
-- workflow so we can hand it over". Without this flag, every admin-owned gym
-- (including internal test gyms) would either pollute the orphan list or be
-- invisible to the handoff workflow.
--
-- Lifecycle:
--   1. Admin creates a gym while logged in as themselves — it's owned by an
--      admin profile, `is_pre_listed = false`. Stays out of the claim list.
--   2. Admin flips `is_pre_listed = true` on /admin/gyms. The orphan-gyms page
--      now shows it under "Pre-listed (awaiting first claim link)".
--   3. Admin clicks "Generate claim link" — existing /api/admin/gyms/:id/claim-link
--      endpoint auto-mints a placeholder owner and reassigns the gym. From that
--      point on the gym is owned by a placeholder profile and the legacy
--      `placeholder_account = true` filter takes over.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS is_pre_listed BOOLEAN NOT NULL DEFAULT false;

-- Partial index so the orphan-gyms admin endpoint can scan only flagged rows.
CREATE INDEX IF NOT EXISTS gyms_is_pre_listed_idx
  ON public.gyms (is_pre_listed)
  WHERE is_pre_listed = true;

COMMENT ON COLUMN public.gyms.is_pre_listed IS
  'True when admin pre-created this gym for handoff to a real owner via a claim link. Surfaces in /admin/orphan-gyms even before a placeholder has been minted. Auto-cleared when the gym is reassigned to a placeholder owner during claim-link generation.';
