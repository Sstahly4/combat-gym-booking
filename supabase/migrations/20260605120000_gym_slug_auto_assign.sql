-- Auto-assign SEO slugs for all gyms (backfill + trigger for new rows).
-- Slugs are set once from the gym name; existing slugs are never overwritten on rename.

CREATE OR REPLACE FUNCTION public.gym_slug_from_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(both '-' FROM trim(lower(
      regexp_replace(
        regexp_replace(coalesce(nullif(trim(p_name), ''), 'gym'), '[^a-zA-Z0-9\s-]', '', 'g'),
        '[\s-]+',
        '-',
        'g'
      )
    ))),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_gym_slug(p_base text, p_gym_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  candidate text;
  suffix int := 2;
  base text;
BEGIN
  base := coalesce(nullif(trim(p_base), ''), 'gym');
  candidate := base;

  WHILE EXISTS (
    SELECT 1
    FROM public.gyms g
    WHERE g.slug = candidate
      AND g.id <> p_gym_id
  ) LOOP
    candidate := base || '-' || suffix::text;
    suffix := suffix + 1;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.gyms_assign_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
BEGIN
  IF NEW.slug IS NOT NULL AND trim(NEW.slug) <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := public.gym_slug_from_name(NEW.name);
  NEW.slug := public.ensure_unique_gym_slug(base_slug, NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger only if missing (avoids DROP TRIGGER — safe to re-run in SQL editor).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'gyms_assign_slug_trigger'
      AND n.nspname = 'public'
      AND c.relname = 'gyms'
  ) THEN
    CREATE TRIGGER gyms_assign_slug_trigger
      BEFORE INSERT OR UPDATE OF name, slug ON public.gyms
      FOR EACH ROW
      EXECUTE FUNCTION public.gyms_assign_slug();
  END IF;
END;
$$;

-- Backfill any gyms still missing a slug (including rows created after the first migration).
DO $$
DECLARE
  rec record;
  base_slug text;
  final_slug text;
BEGIN
  FOR rec IN
    SELECT id, name
    FROM public.gyms
    WHERE slug IS NULL OR trim(slug) = ''
    ORDER BY created_at NULLS LAST, id
  LOOP
    base_slug := public.gym_slug_from_name(rec.name);
    final_slug := public.ensure_unique_gym_slug(base_slug, rec.id);
    UPDATE public.gyms
    SET slug = final_slug
    WHERE id = rec.id;
  END LOOP;
END;
$$;

COMMENT ON COLUMN public.gyms.slug IS
  'SEO-friendly canonical URL segment for /gyms/:slug. Auto-generated from name; stable after first assignment.';
