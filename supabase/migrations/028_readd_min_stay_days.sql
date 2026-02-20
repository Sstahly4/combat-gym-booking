-- Re-add min_stay_days column to packages
-- This was dropped in migration 027 but is needed for gym owners to set
-- custom minimum stay requirements per package.
--
-- Defaults: training = 1 day, accommodation/all_inclusive = 7 days
-- Gym owners can override (e.g. min 3 days for a training camp)

ALTER TABLE packages
ADD COLUMN min_stay_days INTEGER DEFAULT 7;

-- Backfill based on package type
UPDATE packages
SET min_stay_days = CASE
  WHEN type = 'training' THEN 1
  ELSE 7
END;

-- Make NOT NULL after backfill
ALTER TABLE packages
ALTER COLUMN min_stay_days SET NOT NULL;
