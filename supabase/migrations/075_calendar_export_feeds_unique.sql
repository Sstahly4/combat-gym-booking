-- Ensure one feed row per (gym_id, package_variant_id) scope.
-- Note: NULLs are distinct in unique constraints, so we use two partial unique indexes.

CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_export_feeds_gym_null_variant
  ON public.calendar_export_feeds(gym_id)
  WHERE package_variant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_export_feeds_gym_variant
  ON public.calendar_export_feeds(gym_id, package_variant_id)
  WHERE package_variant_id IS NOT NULL;

