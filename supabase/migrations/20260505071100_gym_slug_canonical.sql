-- Add SEO-friendly slug to gyms (canonical URL uses slug).
-- UUID remains the primary key / internal identifier.

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slug from name (kebab-case) for existing gyms.
-- If duplicates exist, append "-<row_number>" to keep slugs unique.
WITH base AS (
  SELECT
    id,
    trim(lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '[\\s-]+', '-', 'g'))) AS base_slug
  FROM public.gyms
),
ranked AS (
  SELECT
    id,
    base_slug,
    row_number() OVER (PARTITION BY base_slug ORDER BY id) AS rn
  FROM base
)
UPDATE public.gyms g
SET slug = CASE
  WHEN ranked.rn = 1 THEN ranked.base_slug
  ELSE ranked.base_slug || '-' || ranked.rn::text
END
FROM ranked
WHERE g.id = ranked.id
  AND (g.slug IS NULL OR g.slug = '');

-- Enforce uniqueness for slug URLs.
CREATE UNIQUE INDEX IF NOT EXISTS gyms_slug_unique_idx
  ON public.gyms (slug)
  WHERE slug IS NOT NULL;

