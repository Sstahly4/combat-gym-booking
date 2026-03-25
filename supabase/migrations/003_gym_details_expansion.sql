-- Add detailed fields to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{"monday": "07:00-20:00", "tuesday": "07:00-20:00", "wednesday": "07:00-20:00", "thursday": "07:00-20:00", "friday": "07:00-20:00", "saturday": "08:00-18:00", "sunday": "closed"}',
ADD COLUMN IF NOT EXISTS trainers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS accommodation_details JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS nearby_attractions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]';

-- Trainers JSONB structure example:
-- [
--   { "name": "Kru Yod", "specialty": "Muay Thai", "years_experience": 15, "image_url": "..." },
--   ...
-- ]

-- Accommodation JSONB structure example:
-- [
--   { "name": "Private Room", "price": 500, "currency": "THB", "amenities": ["AC", "Wifi"] },
--   ...
-- ]
