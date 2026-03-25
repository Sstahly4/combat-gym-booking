-- Add images array to package_variants
ALTER TABLE package_variants ADD COLUMN images text[] DEFAULT ARRAY[]::text[];

-- Update RLS to allow public to view images
-- (Existing "Variants are viewable by everyone" policy already covers this)
