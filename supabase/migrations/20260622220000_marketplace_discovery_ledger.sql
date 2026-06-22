-- Marketplace discovery ledger: search intent, geographic substitution, immutable quotes.
-- Server-side inserts only (service role); admins read for analytics.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Search events (one row per /search execution or filter change)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_session_id     UUID NOT NULL,
  user_id               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  destination_input     VARCHAR(255),
  resolved_latitude       DOUBLE PRECISION,
  resolved_longitude      DOUBLE PRECISION,
  disciplines           TEXT[] NOT NULL DEFAULT '{}',
  start_date              DATE,
  end_date                DATE,
  results_count           INT NOT NULL DEFAULT 0,
  primary_results_count   INT NOT NULL DEFAULT 0,
  nearby_results_count    INT NOT NULL DEFAULT 0,
  clicked_gym_id          UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  clicked_from_nearby     BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_search_events_session
  ON public.search_events (search_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_destination
  ON public.search_events (destination_input, created_at DESC)
  WHERE destination_input IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_events_zero_results
  ON public.search_events (created_at DESC)
  WHERE results_count = 0;
CREATE INDEX IF NOT EXISTS idx_search_events_user
  ON public.search_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON TABLE public.search_events IS
  'Immutable search-intent ledger. One row per search/filter execution; clicked_gym_id updated on result click.';

-- ---------------------------------------------------------------------------
-- 2. Destination substitution matrix (city switches, nearby exploration)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.destination_substitutions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_session_id   UUID NOT NULL,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  kind                TEXT NOT NULL CHECK (kind IN ('city_switch', 'nearby_gym_click', 'search_gym_click')),
  from_destination    VARCHAR(255),
  to_destination      VARCHAR(255),
  from_gym_id         UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  to_gym_id           UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  search_event_id     UUID REFERENCES public.search_events(id) ON DELETE SET NULL,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_destination_substitutions_session
  ON public.destination_substitutions (search_session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_destination_substitutions_kind
  ON public.destination_substitutions (kind, created_at DESC);

COMMENT ON TABLE public.destination_substitutions IS
  'Geographic substitution graph: city switches in search bar and nearby vs in-city gym clicks.';

-- ---------------------------------------------------------------------------
-- 3. Immutable quote snapshot at booking creation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_price_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  search_session_id         UUID,
  search_event_id           UUID REFERENCES public.search_events(id) ON DELETE SET NULL,
  gym_id                    UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  package_id                UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  package_variant_id        UUID REFERENCES public.package_variants(id) ON DELETE SET NULL,
  training_tier             TEXT CHECK (training_tier IN ('once_daily', 'twice_daily')),
  currency                  VARCHAR(3),
  base_package_total        NUMERIC(12, 2) NOT NULL,
  seasonal_premium_applied  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tier_multiplier_delta     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quoted_total              NUMERIC(12, 2) NOT NULL,
  lead_time_days            INT NOT NULL,
  stay_nights               INT,
  snapshot                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_booking_price_snapshots_gym
  ON public.booking_price_snapshots (gym_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_price_snapshots_session
  ON public.booking_price_snapshots (search_session_id, created_at DESC)
  WHERE search_session_id IS NOT NULL;

COMMENT ON TABLE public.booking_price_snapshots IS
  'Point-in-time pricing state when checkout starts — base rate, seasonal delta, tier choice, lead time.';

-- ---------------------------------------------------------------------------
-- RLS: admin read-only; inserts via service role
-- ---------------------------------------------------------------------------
ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_price_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read search events" ON public.search_events;
CREATE POLICY "Admins read search events"
  ON public.search_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read destination substitutions" ON public.destination_substitutions;
CREATE POLICY "Admins read destination substitutions"
  ON public.destination_substitutions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read booking price snapshots" ON public.booking_price_snapshots;
CREATE POLICY "Admins read booking price snapshots"
  ON public.booking_price_snapshots FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

COMMIT;
