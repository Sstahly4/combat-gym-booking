-- Owner calendar & availability: per-day price / capacity / closed overrides.
--
-- Model:
--   - gyms.default_daily_capacity is the owner's "standard" number of spots per day.
--   - gym_daily_availability stores per-date overrides ONLY (sparse). A row existing for
--     (gym_id, date) means the owner touched that date; missing rows fall back to gym defaults.
--   - is_closed short-circuits a date to "blocked / sold out" regardless of capacity.
--   - price_override is in the same currency as gyms.currency; NULL means use gyms.price_per_day.
--
-- Booked counts are NOT stored here; they are computed from `bookings` at read time to avoid
-- drift. The owner UI combines this table + live booking counts to render green/yellow/red.

BEGIN;

-- 1. Gym-wide default daily capacity (nullable = "not configured yet")
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS default_daily_capacity INTEGER;

COMMENT ON COLUMN public.gyms.default_daily_capacity IS
  'Owner-configured default number of bookable spots per day. NULL = unconfigured (treat as unlimited).';

-- 2. Per-day override table
CREATE TABLE IF NOT EXISTS public.gym_daily_availability (
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  capacity_override INTEGER,
  price_override NUMERIC(10, 2),
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  min_stay_override INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (gym_id, date),
  CONSTRAINT gym_daily_availability_capacity_nonneg
    CHECK (capacity_override IS NULL OR capacity_override >= 0),
  CONSTRAINT gym_daily_availability_price_nonneg
    CHECK (price_override IS NULL OR price_override >= 0),
  CONSTRAINT gym_daily_availability_min_stay_pos
    CHECK (min_stay_override IS NULL OR min_stay_override >= 1)
);

COMMENT ON TABLE public.gym_daily_availability IS
  'Sparse per-day overrides for owner calendar (price, capacity, closed, min stay).';

CREATE INDEX IF NOT EXISTS idx_gym_daily_availability_gym_date
  ON public.gym_daily_availability (gym_id, date);

-- 3. updated_at trigger (reuse standard helper if present, otherwise define)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gym_daily_availability_updated_at ON public.gym_daily_availability;
CREATE TRIGGER trg_gym_daily_availability_updated_at
  BEFORE UPDATE ON public.gym_daily_availability
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Row Level Security
ALTER TABLE public.gym_daily_availability ENABLE ROW LEVEL SECURITY;

-- Owners: full CRUD on their own gyms' availability
DROP POLICY IF EXISTS "Owners manage their gym availability" ON public.gym_daily_availability;
CREATE POLICY "Owners manage their gym availability"
  ON public.gym_daily_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_daily_availability.gym_id
        AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_daily_availability.gym_id
        AND g.owner_id = auth.uid()
    )
  );

-- Public: read closure / capacity for approved, live gyms (used by guest booking UI)
DROP POLICY IF EXISTS "Public reads availability of approved gyms" ON public.gym_daily_availability;
CREATE POLICY "Public reads availability of approved gyms"
  ON public.gym_daily_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = gym_daily_availability.gym_id
        AND g.status = 'approved'
    )
  );

-- Admins: full access
DROP POLICY IF EXISTS "Admins manage all gym availability" ON public.gym_daily_availability;
CREATE POLICY "Admins manage all gym availability"
  ON public.gym_daily_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

COMMIT;
