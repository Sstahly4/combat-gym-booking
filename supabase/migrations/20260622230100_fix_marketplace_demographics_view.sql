-- Fix demographics view when profiles.home_country was never migrated.
-- Safe to run if 20260622230000 failed on marketplace_search_demographics.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS combat_primary_discipline TEXT,
  ADD COLUMN IF NOT EXISTS combat_disciplines TEXT[],
  ADD COLUMN IF NOT EXISTS combat_skill_level TEXT,
  ADD COLUMN IF NOT EXISTS home_country TEXT,
  ADD COLUMN IF NOT EXISTS home_location TEXT;

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

COMMIT;
