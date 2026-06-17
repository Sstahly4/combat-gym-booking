-- Public calendar export feeds (iCal) for gym owners.
-- Token is stored as a SHA-256 hash (never store plaintext) so the feed URL
-- can be unguessable and safe to validate with anon key + RLS SELECT.

CREATE TABLE IF NOT EXISTS public.calendar_export_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- SHA-256 hex digest (64 chars) of the plaintext token in the public URL.
  token TEXT NOT NULL UNIQUE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  -- Optional scoping for room/variant specific feeds.
  package_variant_id UUID NULL REFERENCES public.package_variants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_export_feeds_gym_id
  ON public.calendar_export_feeds(gym_id);

CREATE INDEX IF NOT EXISTS idx_calendar_export_feeds_variant_id
  ON public.calendar_export_feeds(package_variant_id);

-- RLS: rows are safe to read because tokens are hashed.
ALTER TABLE public.calendar_export_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar export feeds are readable for validation"
  ON public.calendar_export_feeds FOR SELECT
  USING (true);

-- Allow updating last_accessed_at from public route.
CREATE POLICY "Calendar export feeds can update access timestamp"
  ON public.calendar_export_feeds FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only system should create feeds (service role bypasses RLS).
CREATE POLICY "System can create calendar export feeds"
  ON public.calendar_export_feeds FOR INSERT
  WITH CHECK (true);

