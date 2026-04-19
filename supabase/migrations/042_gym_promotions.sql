-- Owner promotions: per-gym deals and visibility campaigns (Booking.com “Opportunities” style).
--
-- These promotions are owned by a gym owner and managed inside /manage/promotions.
-- They are designed to be deploy-ready even before fully wiring into checkout pricing:
-- - Owners can create/edit/disable promotions with clear date windows and rules.
-- - The platform can later apply discounts at checkout and/or display badges on listings.

BEGIN;

CREATE TABLE IF NOT EXISTS public.gym_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('early_bird', 'last_minute', 'long_stay', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 90),
  starts_at DATE,
  ends_at DATE,
  min_nights INTEGER CHECK (min_nights IS NULL OR min_nights >= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_gym_promotions_gym_id ON public.gym_promotions (gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_promotions_active ON public.gym_promotions (is_active);
CREATE INDEX IF NOT EXISTS idx_gym_promotions_window ON public.gym_promotions (starts_at, ends_at);

ALTER TABLE public.gym_promotions ENABLE ROW LEVEL SECURITY;

-- Owners can manage promotions for their gyms
DROP POLICY IF EXISTS "Owners manage promotions for their gyms" ON public.gym_promotions;
CREATE POLICY "Owners manage promotions for their gyms"
  ON public.gym_promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.gyms g
      WHERE g.id = gym_promotions.gym_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.gyms g
      WHERE g.id = gym_promotions.gym_id
        AND g.owner_id = auth.uid()
    )
  );

-- Public can read active promotions for approved gyms (for displaying badges).
DROP POLICY IF EXISTS "Public can view active gym promotions" ON public.gym_promotions;
CREATE POLICY "Public can view active gym promotions"
  ON public.gym_promotions
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.gyms g
      WHERE g.id = gym_promotions.gym_id
        AND g.status = 'approved'
    )
  );

-- Admins: full access
DROP POLICY IF EXISTS "Admins manage all gym promotions" ON public.gym_promotions;
CREATE POLICY "Admins manage all gym promotions"
  ON public.gym_promotions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_gym_promotions_updated_at ON public.gym_promotions;
CREATE TRIGGER update_gym_promotions_updated_at
  BEFORE UPDATE ON public.gym_promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMIT;

