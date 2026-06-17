-- Once-daily training price track on packages (training-only / no room variant).

BEGIN;

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS once_daily_price_per_day NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_week NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_month NUMERIC(10, 2) NULL;

ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_once_daily_price_nonneg;
ALTER TABLE public.packages
  ADD CONSTRAINT packages_once_daily_price_nonneg CHECK (
    (once_daily_price_per_day IS NULL OR once_daily_price_per_day >= 0)
    AND (once_daily_price_per_week IS NULL OR once_daily_price_per_week >= 0)
    AND (once_daily_price_per_month IS NULL OR once_daily_price_per_month >= 0)
  );

COMMIT;
