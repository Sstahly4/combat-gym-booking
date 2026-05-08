-- Add focal point metadata for better object-cover cropping.
-- focus_x / focus_y are normalized percentages (0..1), where 0.5/0.5 is center.

ALTER TABLE public.gym_images
  ADD COLUMN IF NOT EXISTS focus_x REAL,
  ADD COLUMN IF NOT EXISTS focus_y REAL;

-- Basic guardrails (nullable; only enforce range when set).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gym_images_focus_x_range'
  ) THEN
    ALTER TABLE public.gym_images
      ADD CONSTRAINT gym_images_focus_x_range
      CHECK (focus_x IS NULL OR (focus_x >= 0 AND focus_x <= 1));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'gym_images_focus_y_range'
  ) THEN
    ALTER TABLE public.gym_images
      ADD CONSTRAINT gym_images_focus_y_range
      CHECK (focus_y IS NULL OR (focus_y >= 0 AND focus_y <= 1));
  END IF;
END $$;

