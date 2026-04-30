-- First-run partner dashboard tour (admin claim-link / pre-listed handoff only).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS claim_dashboard_tour_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS claim_dashboard_tour_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.profiles.claim_dashboard_tour_pending IS
  'When true, the owner sees the claim-listing dashboard tour on next /manage visit (set when claim password flow completes). Cleared when they finish or skip the tour.';
COMMENT ON COLUMN public.profiles.claim_dashboard_tour_completed_at IS
  'Timestamp when the claim dashboard tour was finished or skipped; tour UI does not show again.';
