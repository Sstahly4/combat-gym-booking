-- Pivot to Standardized Marketplace: 4 Canonical Offer Types
-- Move from flexible "package" model to standardized "offer" model

-- Add canonical offer type constraint
ALTER TABLE packages 
ADD COLUMN offer_type TEXT CHECK (offer_type IN (
  'TYPE_TRAINING_ONLY',
  'TYPE_TRAINING_ACCOM', 
  'TYPE_ALL_INCLUSIVE',
  'TYPE_CUSTOM_EXP'
));

-- Set default for existing packages (migrate based on current type)
UPDATE packages 
SET offer_type = CASE
  WHEN type = 'training' THEN 'TYPE_TRAINING_ONLY'
  WHEN type = 'accommodation' THEN 'TYPE_TRAINING_ACCOM'
  WHEN type = 'all_inclusive' THEN 'TYPE_ALL_INCLUSIVE'
  ELSE 'TYPE_TRAINING_ONLY' -- Default fallback
END
WHERE offer_type IS NULL;

-- Make offer_type required for new packages
ALTER TABLE packages 
ALTER COLUMN offer_type SET NOT NULL;

-- Add duration constraints (allowed durations for this offer)
ALTER TABLE packages 
ADD COLUMN allowed_durations INTEGER[] DEFAULT ARRAY[7, 14, 30];

-- Add custom duration flag (requires admin review)
ALTER TABLE packages 
ADD COLUMN has_custom_duration BOOLEAN DEFAULT false;

-- Add availability settings
ALTER TABLE packages 
ADD COLUMN available_year_round BOOLEAN DEFAULT true;

-- Add blackout dates (JSONB array of date ranges)
ALTER TABLE packages 
ADD COLUMN blackout_dates JSONB DEFAULT '[]'::jsonb;

-- Example blackout_dates structure:
-- [
--   { "start": "2024-12-24", "end": "2024-12-26", "reason": "Holiday closure" },
--   { "start": "2025-01-01", "end": "2025-01-01", "reason": "New Year" }
-- ]

-- Add booking mode (request-to-book vs instant)
ALTER TABLE packages 
ADD COLUMN booking_mode TEXT DEFAULT 'request_to_book' CHECK (booking_mode IN ('request_to_book', 'instant'));

-- Add admin override flag
ALTER TABLE packages 
ADD COLUMN admin_override BOOLEAN DEFAULT false;

-- Add admin notes (for manual packages that don't fit 4 types)
ALTER TABLE packages 
ADD COLUMN admin_notes TEXT;

-- Create index for offer type queries
CREATE INDEX idx_packages_offer_type ON packages(offer_type);

-- Create index for availability queries
CREATE INDEX idx_packages_available_year_round ON packages(available_year_round) WHERE available_year_round = true;
