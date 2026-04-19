-- Whether the gym lists accommodation as part of their offering (onboarding + discovery hint).
ALTER TABLE public.gyms
ADD COLUMN IF NOT EXISTS offers_accommodation boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.gyms.offers_accommodation IS 'Owner-indicated: gym offers bookable accommodation (rooms managed in accommodations table).';
