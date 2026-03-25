-- Gym Verification System Migration
-- Adds verification fields and updates status system

-- Add verification fields to gyms table
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS instagram_link TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS facebook_link TEXT;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('draft', 'verified', 'trusted')) DEFAULT 'draft';
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS stripe_connect_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS trusted_at TIMESTAMP WITH TIME ZONE;

-- Update existing gyms: if status is 'approved', set verification_status to 'verified'
UPDATE gyms 
SET verification_status = 'verified', 
    admin_approved = TRUE,
    verified_at = updated_at
WHERE status = 'approved' AND verification_status IS NULL;

-- Update existing gyms: if status is 'pending', set verification_status to 'draft'
UPDATE gyms 
SET verification_status = 'draft'
WHERE status = 'pending' AND verification_status IS NULL;

-- Create index for faster verification queries
CREATE INDEX IF NOT EXISTS idx_gyms_verification_status ON gyms(verification_status);
CREATE INDEX IF NOT EXISTS idx_gyms_admin_approved ON gyms(admin_approved);

-- Add comment for documentation
COMMENT ON COLUMN gyms.verification_status IS 'draft: not visible, verified: live and bookable, trusted: proven track record';
COMMENT ON COLUMN gyms.stripe_connect_verified IS 'True when Stripe Connect account is fully onboarded with KYC and bank account';
COMMENT ON COLUMN gyms.admin_approved IS 'True when admin manually approves the gym';
