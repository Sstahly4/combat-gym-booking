-- Add training_schedule column to gyms table
-- This allows gyms to specify multiple training sessions per day with optional types
-- Structure: { "monday": [{ "time": "06:00", "type": "Morning Run" }, { "time": "18:00", "type": "Sparring" }], ... }

ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS training_schedule JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "monday": [
--     { "time": "06:00", "type": "Morning Run" },
--     { "time": "09:00", "type": "Muay Thai" },
--     { "time": "18:00", "type": "Sparring" }
--   ],
--   "tuesday": [
--     { "time": "09:00", "type": "BJJ" },
--     { "time": "18:00" }
--   ],
--   ...
-- }
