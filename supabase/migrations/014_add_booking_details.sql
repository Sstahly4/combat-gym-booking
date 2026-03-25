-- Add room type to package variants (for accommodation options)
ALTER TABLE package_variants 
ADD COLUMN room_type text CHECK (room_type IN ('private', 'shared'));

-- Add cancellation policy to packages (number of days before check-in for free cancellation)
ALTER TABLE packages 
ADD COLUMN cancellation_policy_days integer;

-- Add meal plan details to packages (JSONB to store which meals are included)
ALTER TABLE packages 
ADD COLUMN meal_plan_details jsonb;

-- Example meal_plan_details structure:
-- {
--   "breakfast": true/false,
--   "lunch": true/false,
--   "dinner": true/false,
--   "meals_per_day": 2,
--   "description": "2 meals per day (lunch and dinner)"
-- }
