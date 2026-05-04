-- Speed webhook / ops lookups by Wise (or other) transfer reference.
CREATE INDEX IF NOT EXISTS idx_gym_platform_payouts_external_reference
  ON public.gym_platform_payouts (external_reference)
  WHERE external_reference IS NOT NULL;

-- At most one in-flight payout row per external transfer id (e.g. Wise transfer id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_gym_platform_payouts_extref_pending_unique
  ON public.gym_platform_payouts (external_reference)
  WHERE external_reference IS NOT NULL
    AND status IN ('pending', 'processing');
