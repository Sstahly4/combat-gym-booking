-- Add TYPE_ONE_TIME_EVENT offer type for seminars, workshops, and one-time events

-- Drop the auto-generated inline check constraint from migration 021
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_offer_type_check;

-- Recreate as a named constraint with the new type included
ALTER TABLE packages
ADD CONSTRAINT packages_offer_type_check
CHECK (offer_type IN (
  'TYPE_TRAINING_ONLY',
  'TYPE_TRAINING_ACCOM',
  'TYPE_ALL_INCLUSIVE',
  'TYPE_CUSTOM_EXP',
  'TYPE_ONE_TIME_EVENT'
));

-- Event start datetime (required for one-time events)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;

-- Event end datetime (optional — supports multi-day seminars)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMPTZ;

-- Optional overall attendee cap across all ticket tiers
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_attendees INTEGER;

-- Per-tier capacity on package_variants (used for ticket tiers on one-time events)
ALTER TABLE package_variants ADD COLUMN IF NOT EXISTS capacity INTEGER;

-- Index to efficiently query upcoming events
CREATE INDEX IF NOT EXISTS idx_packages_event_date
  ON packages(event_date)
  WHERE offer_type = 'TYPE_ONE_TIME_EVENT';
