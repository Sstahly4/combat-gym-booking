-- Analytics foundation: response latency, search lead time, date exploration, insight views.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Booking owner response timestamp (accept OR decline)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS gym_responded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.gym_responded_at IS
  'When the gym accepted or declined a request-to-book (response latency metric).';

CREATE INDEX IF NOT EXISTS idx_bookings_gym_response_latency
  ON public.bookings (gym_id, gym_responded_at DESC)
  WHERE gym_responded_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Search lead time at intent (start_date minus search created_at)
-- ---------------------------------------------------------------------------
ALTER TABLE public.search_events
  ADD COLUMN IF NOT EXISTS lead_time_days INT;

COMMENT ON COLUMN public.search_events.lead_time_days IS
  'Days from search execution to intended check-in (booking window signal).';

-- ---------------------------------------------------------------------------
-- 2b. Combat profile columns (idempotent — prod may only have country_of_residence)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS combat_primary_discipline TEXT,
  ADD COLUMN IF NOT EXISTS combat_disciplines TEXT[],
  ADD COLUMN IF NOT EXISTS combat_skill_level TEXT,
  ADD COLUMN IF NOT EXISTS home_country TEXT,
  ADD COLUMN IF NOT EXISTS home_location TEXT;

-- ---------------------------------------------------------------------------
-- 3. Calendar exploration (date picker changes before final search)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.search_date_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_session_id   UUID NOT NULL,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source              TEXT NOT NULL CHECK (source IN ('search_bar', 'search_page')),
  start_date          DATE,
  end_date            DATE,
  lead_time_days      INT,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_search_date_events_session
  ON public.search_date_events (search_session_id, created_at DESC);

ALTER TABLE public.search_date_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read search date events" ON public.search_date_events;
CREATE POLICY "Admins read search date events"
  ON public.search_date_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 4. Insight views (admin / service-role analytics)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.marketplace_search_demographics AS
SELECT
  se.id,
  se.created_at,
  se.search_session_id,
  se.user_id,
  se.destination_input,
  se.disciplines,
  se.start_date,
  se.end_date,
  se.lead_time_days,
  se.results_count,
  se.primary_results_count,
  se.nearby_results_count,
  se.clicked_gym_id,
  se.clicked_from_nearby,
  COALESCE(
    se.metadata->'fighter_profile'->>'home_country',
    p.home_country,
    p.country_of_residence
  ) AS home_country,
  COALESCE(se.metadata->'fighter_profile'->>'combat_skill_level', p.combat_skill_level) AS combat_skill_level,
  COALESCE(se.metadata->'fighter_profile'->>'combat_primary_discipline', p.combat_primary_discipline) AS combat_primary_discipline,
  se.metadata->'fighter_profile' AS fighter_profile_snapshot
FROM public.search_events se
LEFT JOIN public.profiles p ON p.id = se.user_id;

COMMENT ON VIEW public.marketplace_search_demographics IS
  'Search intent joined to fighter profile (snapshot in metadata preferred over live profile).';

CREATE OR REPLACE VIEW public.marketplace_booking_response_times AS
SELECT
  b.id AS booking_id,
  b.gym_id,
  b.status,
  b.request_submitted_at,
  b.gym_responded_at,
  b.gym_confirmed_at,
  b.payment_captured_at,
  GREATEST(
    0,
    FLOOR(EXTRACT(EPOCH FROM (b.gym_responded_at - b.request_submitted_at)))::INT
  ) AS booking_response_time_seconds,
  CASE
    WHEN b.gym_confirmed_at IS NOT NULL THEN 'accepted'
    WHEN b.status IN ('cancelled_by_gym', 'declined') THEN 'declined'
    ELSE 'other'
  END AS response_outcome
FROM public.bookings b
WHERE b.request_submitted_at IS NOT NULL
  AND b.gym_responded_at IS NOT NULL;

COMMENT ON VIEW public.marketplace_booking_response_times IS
  'Owner response latency for request-to-book (accept or decline).';

CREATE OR REPLACE VIEW public.marketplace_supply_gaps AS
SELECT
  se.destination_input,
  se.disciplines,
  se.start_date,
  se.end_date,
  DATE_TRUNC('week', se.created_at AT TIME ZONE 'UTC') AS week_utc,
  COUNT(*)::INT AS zero_result_searches,
  COUNT(DISTINCT se.search_session_id)::INT AS unique_sessions
FROM public.search_events se
WHERE se.results_count = 0
  AND se.destination_input IS NOT NULL
GROUP BY 1, 2, 3, 4, 5;

COMMENT ON VIEW public.marketplace_supply_gaps IS
  'Aggregated zero-result searches — proof of unmet demand by destination/dates.';

CREATE OR REPLACE VIEW public.marketplace_search_lead_time_curve AS
SELECT
  se.destination_input,
  se.disciplines,
  se.lead_time_days,
  DATE_TRUNC('week', se.created_at AT TIME ZONE 'UTC') AS week_utc,
  COUNT(*)::INT AS search_count
FROM public.search_events se
WHERE se.lead_time_days IS NOT NULL
GROUP BY 1, 2, 3, 4;

COMMENT ON VIEW public.marketplace_search_lead_time_curve IS
  'Booking-window distribution: how far ahead travelers search by destination.';

COMMIT;
