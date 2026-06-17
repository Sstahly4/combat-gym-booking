-- Training Intensity Tiers — Once Daily (Flexible Choice) vs Twice Daily (Full Access).
-- Add optional "once daily" price tracks to variants and seasonal tiers.
-- NULL means "not configured" and the app must fall back to full-access pricing.

BEGIN;

ALTER TABLE public.package_variants
  ADD COLUMN IF NOT EXISTS once_daily_price_per_day NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_week NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_month NUMERIC(10, 2) NULL;

ALTER TABLE public.package_seasonal_rates
  ADD COLUMN IF NOT EXISTS once_daily_price_per_day NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_week NUMERIC(10, 2) NULL,
  ADD COLUMN IF NOT EXISTS once_daily_price_per_month NUMERIC(10, 2) NULL;

-- Non-negative guardrails for once-daily columns.
ALTER TABLE public.package_variants DROP CONSTRAINT IF EXISTS package_variants_once_daily_price_nonneg;
ALTER TABLE public.package_variants
  ADD CONSTRAINT package_variants_once_daily_price_nonneg CHECK (
    (once_daily_price_per_day IS NULL OR once_daily_price_per_day >= 0)
    AND (once_daily_price_per_week IS NULL OR once_daily_price_per_week >= 0)
    AND (once_daily_price_per_month IS NULL OR once_daily_price_per_month >= 0)
  );

ALTER TABLE public.package_seasonal_rates DROP CONSTRAINT IF EXISTS package_seasonal_rates_once_daily_price_nonneg;
ALTER TABLE public.package_seasonal_rates
  ADD CONSTRAINT package_seasonal_rates_once_daily_price_nonneg CHECK (
    (once_daily_price_per_day IS NULL OR once_daily_price_per_day >= 0)
    AND (once_daily_price_per_week IS NULL OR once_daily_price_per_week >= 0)
    AND (once_daily_price_per_month IS NULL OR once_daily_price_per_month >= 0)
  );

-- Ensure training_access defaults don't break production: training packages already default to twice_daily.
-- (See migration 070_package_training_access.sql)

COMMIT;

