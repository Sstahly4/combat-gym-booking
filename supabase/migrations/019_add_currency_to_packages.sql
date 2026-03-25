-- Add currency column to packages table
-- Packages can have their own currency, defaulting to the gym's currency
ALTER TABLE packages 
ADD COLUMN currency TEXT DEFAULT 'USD';

-- Update existing packages to use gym's currency
UPDATE packages 
SET currency = (
  SELECT currency FROM gyms WHERE gyms.id = packages.gym_id
)
WHERE currency IS NULL;

-- Make currency NOT NULL after backfilling
ALTER TABLE packages 
ALTER COLUMN currency SET NOT NULL,
ALTER COLUMN currency SET DEFAULT 'USD';
