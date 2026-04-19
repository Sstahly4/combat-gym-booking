ALTER TABLE public.gyms
ADD COLUMN IF NOT EXISTS is_live BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.owner_onboarding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'in_progress' CHECK (state IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.owner_onboarding_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.owner_onboarding_sessions(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE (session_id, step_key)
);

CREATE TABLE IF NOT EXISTS public.owner_invite_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_owner_onboarding_sessions_owner_id
  ON public.owner_onboarding_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_onboarding_sessions_gym_id
  ON public.owner_onboarding_sessions(gym_id);
CREATE INDEX IF NOT EXISTS idx_owner_onboarding_steps_session_id
  ON public.owner_onboarding_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_owner_invite_tokens_email
  ON public.owner_invite_tokens(email);
CREATE INDEX IF NOT EXISTS idx_owner_invite_tokens_expires_at
  ON public.owner_invite_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id
  ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type
  ON public.security_events(event_type);

ALTER TABLE public.owner_onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their onboarding sessions" ON public.owner_onboarding_sessions;
CREATE POLICY "Owners can manage their onboarding sessions"
  ON public.owner_onboarding_sessions
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage their onboarding steps" ON public.owner_onboarding_steps;
CREATE POLICY "Owners can manage their onboarding steps"
  ON public.owner_onboarding_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.owner_onboarding_sessions sessions
      WHERE sessions.id = owner_onboarding_steps.session_id
        AND sessions.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.owner_onboarding_sessions sessions
      WHERE sessions.id = owner_onboarding_steps.session_id
        AND sessions.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage invite tokens" ON public.owner_invite_tokens;
CREATE POLICY "Admins can manage invite tokens"
  ON public.owner_invite_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Invite recipients can read active token" ON public.owner_invite_tokens;
CREATE POLICY "Invite recipients can read active token"
  ON public.owner_invite_tokens
  FOR SELECT
  USING (
    used_at IS NULL
    AND expires_at > NOW()
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Users can read their security events" ON public.security_events;
CREATE POLICY "Users can read their security events"
  ON public.security_events
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their security events" ON public.security_events;
CREATE POLICY "Users can create their security events"
  ON public.security_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all security events" ON public.security_events;
CREATE POLICY "Admins can read all security events"
  ON public.security_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS update_owner_onboarding_sessions_updated_at ON public.owner_onboarding_sessions;
CREATE TRIGGER update_owner_onboarding_sessions_updated_at
  BEFORE UPDATE ON public.owner_onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_owner_onboarding_steps_updated_at ON public.owner_onboarding_steps;
CREATE TRIGGER update_owner_onboarding_steps_updated_at
  BEFORE UPDATE ON public.owner_onboarding_steps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_owner_invite_tokens_updated_at ON public.owner_invite_tokens;
CREATE TRIGGER update_owner_invite_tokens_updated_at
  BEFORE UPDATE ON public.owner_invite_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
