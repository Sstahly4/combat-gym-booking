-- Add full address field to gyms table
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment for clarity
COMMENT ON COLUMN gyms.address IS 'Full street address including number, street name, and postcode';
