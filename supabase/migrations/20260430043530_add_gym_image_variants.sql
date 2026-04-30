-- Store pre-generated image derivatives so hot paths can use srcset directly
-- without spending Vercel Image Optimization transformations.
ALTER TABLE gym_images
ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '{}'::jsonb;
