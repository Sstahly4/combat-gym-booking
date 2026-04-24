-- Allow package variants to reference a standalone accommodation (room option).
-- This lets Train & Stay / All-inclusive offers price per-room via package_variants.

ALTER TABLE public.package_variants
ADD COLUMN IF NOT EXISTS accommodation_id uuid REFERENCES public.accommodations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_package_variants_accommodation_id
  ON public.package_variants(accommodation_id);

