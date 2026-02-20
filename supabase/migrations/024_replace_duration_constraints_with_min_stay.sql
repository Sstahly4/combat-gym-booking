-- Replace duration constraints with min_stay_days
-- Remove allowed_durations and has_custom_duration
-- Add min_stay_days field

-- Add min_stay_days column
ALTER TABLE packages 
ADD COLUMN min_stay_days INTEGER DEFAULT 7;

-- Migrate existing data: use minimum of allowed_durations if exists, otherwise default to 7
UPDATE packages
SET min_stay_days = CASE
  WHEN allowed_durations IS NOT NULL AND array_length(allowed_durations, 1) > 0 THEN
    (SELECT MIN(unnest) FROM unnest(allowed_durations) AS unnest)
  ELSE 7
END;

-- Make min_stay_days NOT NULL
ALTER TABLE packages 
ALTER COLUMN min_stay_days SET NOT NULL;

-- Drop old duration constraint columns
ALTER TABLE packages 
DROP COLUMN IF EXISTS allowed_durations,
DROP COLUMN IF EXISTS has_custom_duration;

-- Add pricing fields for 7-day, 15-day, 30-day rates
ALTER TABLE packages
ADD COLUMN price_7_day NUMERIC,
ADD COLUMN price_15_day NUMERIC,
ADD COLUMN price_30_day NUMERIC;

-- Migrate existing pricing data if available
-- Use price_per_week for 7-day, price_per_month for 30-day if they exist
UPDATE packages
SET 
  price_7_day = CASE 
    WHEN price_per_week IS NOT NULL THEN price_per_week
    WHEN price_per_day IS NOT NULL THEN price_per_day * 7
    ELSE NULL
  END,
  price_30_day = CASE
    WHEN price_per_month IS NOT NULL THEN price_per_month
    WHEN price_per_day IS NOT NULL THEN price_per_day * 30
    ELSE NULL
  END;

-- Create index for min_stay_days queries
CREATE INDEX IF NOT EXISTS idx_packages_min_stay_days ON packages(min_stay_days);
