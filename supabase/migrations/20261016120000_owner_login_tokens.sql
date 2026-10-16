-- Owner login tokens: OTA-style deep links in partner notification emails.
--
-- Flow:
--   1. System mints a token when emailing an existing owner (e.g. new booking).
--   2. Owner opens /ol/<token> → server verifies, signs them into their account,
--      redirects to Partner Hub (usually /manage/bookings?ref=…).
--   3. Links remain valid until expiry (multi-use within the window) so owners
--      can reopen the same email — industry-standard for booking alerts.

CREATE TABLE IF NOT EXISTS public.owner_login_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- SHA-256 of the plaintext token (we never store plaintext).
  token_hash    TEXT NOT NULL UNIQUE,
  redirect_path TEXT NOT NULL,
  booking_id    UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  purpose       TEXT NOT NULL DEFAULT 'booking_alert',
  expires_at    TIMESTAMPTZ NOT NULL,
  first_used_at TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_owner_login_tokens_user_id
  ON public.owner_login_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_login_tokens_expires_at
  ON public.owner_login_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_owner_login_tokens_booking_id
  ON public.owner_login_tokens(booking_id)
  WHERE booking_id IS NOT NULL;

COMMENT ON TABLE public.owner_login_tokens IS
  'Hashed magic login links for existing gym owners (notification CTAs). Plaintext only in the emailed URL.';
COMMENT ON COLUMN public.owner_login_tokens.redirect_path IS
  'In-app path after sign-in, e.g. /manage/bookings?ref=CS-…. Must start with /manage.';
COMMENT ON COLUMN public.owner_login_tokens.first_used_at IS
  'Set on first successful redeem. Link stays usable until expires_at (multi-use).';
COMMENT ON COLUMN public.owner_login_tokens.purpose IS
  'Why the link was issued: booking_created, booking_cancelled, review_posted, etc.';

ALTER TABLE public.owner_login_tokens ENABLE ROW LEVEL SECURITY;

-- Service role / admin only. Redeem path uses the admin client.
DROP POLICY IF EXISTS "Admins manage owner login tokens" ON public.owner_login_tokens;
CREATE POLICY "Admins manage owner login tokens"
  ON public.owner_login_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
