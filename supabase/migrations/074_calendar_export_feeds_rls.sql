-- Tighten calendar_export_feeds RLS so only gym owners can create feeds.
-- Public export route still needs SELECT by hashed token + UPDATE last_accessed_at.

ALTER TABLE public.calendar_export_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Calendar export feeds are readable for validation" ON public.calendar_export_feeds;
DROP POLICY IF EXISTS "Calendar export feeds can update access timestamp" ON public.calendar_export_feeds;
DROP POLICY IF EXISTS "System can create calendar export feeds" ON public.calendar_export_feeds;

-- Anyone can read (token is hashed; app layer validates).
CREATE POLICY "Calendar export feeds are readable for validation"
  ON public.calendar_export_feeds FOR SELECT
  USING (true);

-- Anyone can update last_accessed_at (non-sensitive); app layer only updates that field.
CREATE POLICY "Calendar export feeds can update access timestamp"
  ON public.calendar_export_feeds FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only gym owners (or service role) can create feeds.
CREATE POLICY "Gym owners can create calendar export feeds"
  ON public.calendar_export_feeds FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM public.gyms WHERE id = gym_id)
  );

