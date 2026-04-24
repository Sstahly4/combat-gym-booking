-- Fuzzy gym name suggest (pg_trgm) + optional search_aliases for “aka” / common misspellings.
-- Used by public.gym_suggest() → GET /api/gyms/suggest (RLS still applies; invoker).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS search_aliases text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.gyms.search_aliases IS
  'Extra strings matched by /api/gyms/suggest (abbreviations, former names, Thai script, etc.). Empty by default.';

CREATE INDEX IF NOT EXISTS idx_gyms_name_trgm
  ON public.gyms USING gin (name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.gym_suggest(p_query text, p_limit integer DEFAULT 12)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  country text,
  match_kind text,
  match_score double precision
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  qn text;
  sim_min double precision;
  lim int;
BEGIN
  qn := nullif(
    lower(trim(both from regexp_replace(coalesce(p_query, ''), '[%_]', '', 'g'))),
    ''
  );

  IF qn IS NULL OR length(qn) < 2 THEN
    RETURN;
  END IF;

  IF length(qn) <= 2 THEN
    sim_min := 0.5;
  ELSIF length(qn) <= 3 THEN
    sim_min := 0.38;
  ELSE
    sim_min := 0.28;
  END IF;

  lim := least(coalesce(p_limit, 12), 24);

  RETURN QUERY
  SELECT
    x.id,
    x.name,
    x.city,
    x.country,
    x.match_kind,
    x.match_score
  FROM (
    SELECT
      g.id,
      g.name,
      g.city,
      g.country,
      (CASE
        WHEN lower(g.name) LIKE '%' || qn || '%' THEN 'exact_name'
        WHEN EXISTS (
          SELECT 1
          FROM unnest(coalesce(g.search_aliases, array[]::text[])) a(txt)
          WHERE lower(trim(txt)) LIKE '%' || qn || '%'
        ) THEN 'exact_alias'
        WHEN similarity(lower(g.name), qn) >= sim_min THEN 'fuzzy_name'
        WHEN EXISTS (
          SELECT 1
          FROM unnest(coalesce(g.search_aliases, array[]::text[])) a(txt)
          WHERE similarity(lower(trim(txt)), qn) >= sim_min
        ) THEN 'fuzzy_alias'
      END)::text AS match_kind,
      (
        greatest(
          similarity(lower(g.name), qn),
          coalesce(
            (
              SELECT max(similarity(lower(trim(txt)), qn))
              FROM unnest(coalesce(g.search_aliases, array[]::text[])) a(txt)
            ),
            0::real
          )
        )::double precision
        + CASE WHEN lower(g.name) LIKE '%' || qn || '%' THEN 0.15 ELSE 0::double precision END
      ) AS match_score
    FROM public.gyms g
    WHERE g.status = 'approved'
      AND g.verification_status = 'verified'
      AND (
        lower(g.name) LIKE '%' || qn || '%'
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(g.search_aliases, array[]::text[])) a(txt)
          WHERE lower(trim(txt)) LIKE '%' || qn || '%'
        )
        OR similarity(lower(g.name), qn) >= sim_min
        OR EXISTS (
          SELECT 1
          FROM unnest(coalesce(g.search_aliases, array[]::text[])) a(txt)
          WHERE similarity(lower(trim(txt)), qn) >= sim_min
        )
      )
  ) x
  WHERE x.match_kind IS NOT NULL
  ORDER BY
    CASE x.match_kind
      WHEN 'exact_name' THEN 1
      WHEN 'exact_alias' THEN 2
      WHEN 'fuzzy_name' THEN 3
      WHEN 'fuzzy_alias' THEN 4
      ELSE 5
    END,
    x.match_score DESC,
    x.name ASC
  LIMIT lim;
END;
$$;

COMMENT ON FUNCTION public.gym_suggest(text, integer) IS
  'Public typeahead: substring + pg_trgm fuzzy match on gyms.name and gyms.search_aliases; only approved + verified rows.';

GRANT EXECUTE ON FUNCTION public.gym_suggest(text, integer) TO anon, authenticated, service_role;
