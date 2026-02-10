-- Add order column to gym_images if it doesn't exist
-- This column is used for image sequencing (drag-and-drop reordering)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'gym_images' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE gym_images 
        ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
        
        -- Create an index on order for better query performance
        CREATE INDEX IF NOT EXISTS idx_gym_images_order ON gym_images(gym_id, "order");
    END IF;
END $$;
