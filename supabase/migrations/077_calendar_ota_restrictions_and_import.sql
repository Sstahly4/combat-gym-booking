-- OTA-style calendar: arrival/departure restrictions, advance booking window, iCal import.

BEGIN;

-- Per-day OTA restrictions (sparse overrides)
ALTER TABLE public.gym_daily_availability
  ADD COLUMN IF NOT EXISTS closed_to_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS closed_to_departure BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_stay_override INTEGER;

ALTER TABLE public.gym_daily_availability
  DROP CONSTRAINT IF EXISTS gym_daily_availability_max_stay_pos;

ALTER TABLE public.gym_daily_availability
  ADD CONSTRAINT gym_daily_availability_max_stay_pos
    CHECK (max_stay_override IS NULL OR max_stay_override >= 1);

COMMENT ON COLUMN public.gym_daily_availability.closed_to_arrival IS
  'No new check-ins on this date (guests may still be mid-stay).';
COMMENT ON COLUMN public.gym_daily_availability.closed_to_departure IS
  'No check-outs on this date.';
COMMENT ON COLUMN public.gym_daily_availability.max_stay_override IS
  'Maximum stay length when checking in on this date (nights).';

-- Gym-wide booking window (days from today)
ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS booking_advance_min_days INTEGER,
  ADD COLUMN IF NOT EXISTS booking_advance_max_days INTEGER;

COMMENT ON COLUMN public.gyms.booking_advance_min_days IS
  'Minimum days before check-in guests can book (NULL = same day allowed).';
COMMENT ON COLUMN public.gyms.booking_advance_max_days IS
  'Maximum days ahead guests can book (NULL = no limit).';

-- External iCal import feeds (Airbnb, Google Calendar, etc.)
CREATE TABLE IF NOT EXISTS public.calendar_import_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  package_variant_id UUID NULL REFERENCES public.package_variants(id) ON DELETE SET NULL,
  label TEXT NOT NULL DEFAULT 'External calendar',
  feed_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ NULL,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_import_feeds_gym_id
  ON public.calendar_import_feeds(gym_id);

-- Busy dates parsed from import feeds (replaced on each sync)
CREATE TABLE IF NOT EXISTS public.calendar_import_blocks (
  feed_id UUID NOT NULL REFERENCES public.calendar_import_feeds(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  summary TEXT NULL,
  PRIMARY KEY (feed_id, block_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_import_blocks_gym_date
  ON public.calendar_import_blocks(feed_id, block_date);

DROP TRIGGER IF EXISTS trg_calendar_import_feeds_updated_at ON public.calendar_import_feeds;
CREATE TRIGGER trg_calendar_import_feeds_updated_at
  BEFORE UPDATE ON public.calendar_import_feeds
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.calendar_import_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_import_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners manage calendar import feeds" ON public.calendar_import_feeds;
CREATE POLICY "Owners manage calendar import feeds"
  ON public.calendar_import_feeds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = calendar_import_feeds.gym_id AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gyms g
      WHERE g.id = calendar_import_feeds.gym_id AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners read import blocks via feed" ON public.calendar_import_blocks;
CREATE POLICY "Owners manage import blocks via feed"
  ON public.calendar_import_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_import_feeds f
      JOIN public.gyms g ON g.id = f.gym_id
      WHERE f.id = calendar_import_blocks.feed_id AND g.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_import_feeds f
      JOIN public.gyms g ON g.id = f.gym_id
      WHERE f.id = calendar_import_blocks.feed_id AND g.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public reads import blocks for approved gyms" ON public.calendar_import_blocks;
CREATE POLICY "Public reads import blocks for approved gyms"
  ON public.calendar_import_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_import_feeds f
      JOIN public.gyms g ON g.id = f.gym_id
      WHERE f.id = calendar_import_blocks.feed_id
        AND g.status = 'approved'
        AND f.enabled = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins manage calendar import feeds" ON public.calendar_import_feeds;
CREATE POLICY "Admins manage calendar import feeds"
  ON public.calendar_import_feeds FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins manage import blocks" ON public.calendar_import_blocks;
CREATE POLICY "Admins manage import blocks"
  ON public.calendar_import_blocks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

COMMIT;
