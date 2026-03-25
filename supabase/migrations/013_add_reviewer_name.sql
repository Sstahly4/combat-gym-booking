-- MVP ONLY: Add reviewer name for manual reviews
-- TODO: REMOVE THIS BEFORE SHIPPING
ALTER TABLE reviews ADD COLUMN reviewer_name text;
