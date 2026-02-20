-- Update package_id foreign key to allow SET NULL on delete
-- This allows packages to be deleted even if there are bookings referencing them
-- The bookings will remain but their package_id will be set to NULL

-- Drop the existing foreign key constraint
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_package_id_fkey;

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_package_id_fkey
FOREIGN KEY (package_id)
REFERENCES public.packages(id)
ON DELETE SET NULL;
