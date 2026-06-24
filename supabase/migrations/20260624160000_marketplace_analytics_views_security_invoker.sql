-- Fix Supabase advisor: marketplace analytics views must not bypass RLS.
-- Recreate as security invoker and restrict API access to service role only.

BEGIN;

CREATE OR REPLACE VIEW public.marketplace_search_demographics
WITH (security_invoker = true) AS
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

CREATE OR REPLACE VIEW public.marketplace_booking_response_times
WITH (security_invoker = true) AS
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

CREATE OR REPLACE VIEW public.marketplace_supply_gaps
WITH (security_invoker = true) AS
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

CREATE OR REPLACE VIEW public.marketplace_search_lead_time_curve
WITH (security_invoker = true) AS
SELECT
  se.destination_input,
  se.disciplines,
  se.lead_time_days,
  DATE_TRUNC('week', se.created_at AT TIME ZONE 'UTC') AS week_utc,
  COUNT(*)::INT AS search_count
FROM public.search_events se
WHERE se.lead_time_days IS NOT NULL
GROUP BY 1, 2, 3, 4;

REVOKE ALL ON public.marketplace_search_demographics FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketplace_booking_response_times FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketplace_supply_gaps FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.marketplace_search_lead_time_curve FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.marketplace_search_demographics TO service_role;
GRANT SELECT ON public.marketplace_booking_response_times TO service_role;
GRANT SELECT ON public.marketplace_supply_gaps TO service_role;
GRANT SELECT ON public.marketplace_search_lead_time_curve TO service_role;

COMMIT;
