-- Add type column to packages to distinguish offer types
ALTER TABLE packages ADD COLUMN type text DEFAULT 'training'; -- 'training', 'accommodation', 'all_inclusive'

-- Create variants table for accommodation options
CREATE TABLE public.package_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. "Standard Fan Room"
  description text,
  price_per_day numeric,
  price_per_week numeric,
  price_per_month numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT package_variants_pkey PRIMARY KEY (id)
);

-- Enable RLS on variants
ALTER TABLE public.package_variants ENABLE ROW LEVEL SECURITY;

-- Policies for variants (same as packages)
CREATE POLICY "Variants are viewable by everyone" 
ON public.package_variants FOR SELECT 
USING ( true );

CREATE POLICY "Users can manage variants for their own gyms" 
ON public.package_variants FOR ALL 
USING ( 
  auth.uid() in (
    select owner_id from public.gyms 
    join public.packages on packages.gym_id = gyms.id
    where packages.id = package_variants.package_id
  )
);

-- Add reference to bookings
ALTER TABLE public.bookings ADD COLUMN package_variant_id uuid REFERENCES public.package_variants(id);
