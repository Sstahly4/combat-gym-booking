-- Add pricing_config JSONB column to packages table
-- This supports both fixed packages (discrete durations with fixed prices) 
-- and rate-based packages (daily/weekly/monthly rates that calculate)
ALTER TABLE packages 
ADD COLUMN pricing_config JSONB;

-- Example pricing_config structure:
-- Fixed mode:
-- {
--   "mode": "fixed",
--   "durations": [
--     { "days": 7, "price": 12000, "discountLabel": "Early Bird" },
--     { "days": 30, "price": 30000 }
--   ]
-- }
--
-- Rate-based mode:
-- {
--   "mode": "rate",
--   "rates": {
--     "daily": 500,
--     "weekly": 3000,
--     "monthly": 10000,
--     "minStay": 7
--   }
-- }
