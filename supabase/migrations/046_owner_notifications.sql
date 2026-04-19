-- 046_owner_notifications.sql
--
-- Owner-facing in-app notifications. Pairs with email triggers in
-- lib/notifications/owner-notifications.ts so a single recordOwnerNotification()
-- call lights up the navbar bell AND fires an email (subject to the owner's
-- existing notification preferences in profiles.owner_notification_prefs).
--
-- Lifecycle:
--   1. Server code (or DB trigger for client-side reviews) inserts a row.
--   2. /api/manage/notifications reads + counts unread for the bell dropdown.
--   3. Owner clicks "Mark all read" or visits the linked entity → read_at set.
--   4. Cleanup is left to a future cron (rows are tiny; not urgent).

CREATE TABLE IF NOT EXISTS public.owner_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Optional: most notifications are about a specific gym, but payouts /
  -- platform-wide nudges may not be. Cascade so deleting a gym cleans them.
  gym_id      UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN (
                'booking_created',
                'booking_cancelled',
                'review_posted',
                'payout_paid'
              )),
  title       TEXT NOT NULL,
  body        TEXT,
  link_href   TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS owner_notifications_user_unread_idx
  ON public.owner_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS owner_notifications_user_recent_idx
  ON public.owner_notifications (user_id, created_at DESC);

ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

-- Owners read & update only their own rows. Service role bypasses RLS so the
-- server helper does not need to be the owner to insert.
DROP POLICY IF EXISTS "Owners read their own notifications" ON public.owner_notifications;
CREATE POLICY "Owners read their own notifications"
  ON public.owner_notifications
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners update their own notifications" ON public.owner_notifications;
CREATE POLICY "Owners update their own notifications"
  ON public.owner_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all notifications" ON public.owner_notifications;
CREATE POLICY "Admins read all notifications"
  ON public.owner_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ---------------------------------------------------------------------------
-- Reviews trigger: reviews are inserted client-side via RLS in some flows, so
-- the safest place to fan out an owner notification is a DB trigger. We still
-- fire the email separately from the server when the API path is used; this
-- trigger covers everything else and keeps the bell consistent.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_gym_owner_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_gym_id    UUID;
  v_owner_id  UUID;
  v_gym_name  TEXT;
  v_rating    INTEGER;
BEGIN
  -- Look up the gym + owner via the booking the review is attached to.
  SELECT b.gym_id, g.owner_id, g.name
    INTO v_gym_id, v_owner_id, v_gym_name
  FROM public.bookings b
  JOIN public.gyms g ON g.id = b.gym_id
  WHERE b.id = NEW.booking_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_rating := COALESCE(NEW.rating, 0);

  INSERT INTO public.owner_notifications
    (user_id, gym_id, type, title, body, link_href, metadata)
  VALUES (
    v_owner_id,
    v_gym_id,
    'review_posted',
    COALESCE('New ' || v_rating || '-star review for ' || v_gym_name, 'New review'),
    LEFT(COALESCE(NEW.comment, ''), 240),
    '/manage/reviews',
    jsonb_build_object('rating', v_rating, 'review_id', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_gym_owner_on_review ON public.reviews;
CREATE TRIGGER trg_notify_gym_owner_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_gym_owner_on_review();
