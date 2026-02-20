-- Standalone Accommodations Table
-- Accommodations are created independently and can be linked to multiple packages
-- This allows gym owners to manage room types separately from packages

CREATE TABLE IF NOT EXISTS public.accommodations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name text NOT NULL, -- e.g. "Standard Fan Room", "Private AC Room"
  description text,
  room_type text CHECK (room_type IN ('private', 'shared', 'dorm')),
  capacity integer, -- Number of people (for shared/dorm rooms)
  price_per_day numeric,
  price_per_week numeric,
  price_per_month numeric,
  currency text DEFAULT 'USD',
  images text[] DEFAULT ARRAY[]::text[],
  amenities jsonb DEFAULT '{}', -- e.g. {"ac": true, "fan": true, "wifi": true, "bathroom": "private"}
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accommodations_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Accommodations are viewable by everyone"
ON public.accommodations FOR SELECT
USING (true);

CREATE POLICY "Gym owners can manage their accommodations"
ON public.accommodations FOR ALL
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.gyms WHERE id = accommodations.gym_id
  )
);

-- Create index for gym lookups
CREATE INDEX idx_accommodations_gym_id ON public.accommodations(gym_id);
CREATE INDEX idx_accommodations_active ON public.accommodations(is_active) WHERE is_active = true;

-- Link table: Many-to-many relationship between packages and accommodations
-- This allows one accommodation to be used in multiple packages
CREATE TABLE IF NOT EXISTS public.package_accommodations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  accommodation_id uuid NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false, -- If true, this is the default accommodation for the package
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT package_accommodations_pkey PRIMARY KEY (id),
  CONSTRAINT package_accommodations_unique UNIQUE (package_id, accommodation_id)
);

-- Enable RLS
ALTER TABLE public.package_accommodations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Package accommodations are viewable by everyone"
ON public.package_accommodations FOR SELECT
USING (true);

CREATE POLICY "Gym owners can manage package accommodations"
ON public.package_accommodations FOR ALL
USING (
  auth.uid() IN (
    SELECT owner_id FROM public.gyms
    JOIN public.packages ON packages.gym_id = gyms.id
    WHERE packages.id = package_accommodations.package_id
  )
);

-- Create indexes
CREATE INDEX idx_package_accommodations_package_id ON public.package_accommodations(package_id);
CREATE INDEX idx_package_accommodations_accommodation_id ON public.package_accommodations(accommodation_id);
