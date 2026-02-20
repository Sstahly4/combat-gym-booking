-- Rollback interpolation pricing: revert to simple day/week/month rates
-- This migration drops the price_7_day, price_15_day, price_30_day columns
-- and the min_stay_days column added in migration 024.
--
-- Before dropping, we ensure any data set only in the new columns
-- is preserved in the legacy price_per_day / price_per_week / price_per_month fields.

-- Step 1: Migrate any data from new columns back to legacy fields
UPDATE packages
SET 
  price_per_week = COALESCE(price_per_week, price_7_day),
  price_per_month = COALESCE(price_per_month, price_30_day),
  price_per_day = COALESCE(price_per_day, CASE WHEN price_7_day IS NOT NULL THEN ROUND(price_7_day / 7.0, 2) ELSE NULL END)
WHERE 
  price_per_week IS NULL 
  OR price_per_month IS NULL 
  OR price_per_day IS NULL;

-- Step 2: Drop the interpolation pricing columns
ALTER TABLE packages
DROP COLUMN IF EXISTS price_7_day,
DROP COLUMN IF EXISTS price_15_day,
DROP COLUMN IF EXISTS price_30_day;

-- Step 3: Drop min_stay_days column
ALTER TABLE packages
DROP COLUMN IF EXISTS min_stay_days;

-- Step 4: Drop the index that was created for min_stay_days
DROP INDEX IF EXISTS idx_packages_min_stay_days;
