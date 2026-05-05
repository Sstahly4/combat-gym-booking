-- Combat profile fields for retargeting + personalization
-- - Minimal: store a few stable attributes on profiles
-- - Normalize gym history into a separate table keyed by (user_id, gym_id)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS combat_primary_discipline TEXT,
  ADD COLUMN IF NOT EXISTS combat_disciplines TEXT[],
  ADD COLUMN IF NOT EXISTS combat_skill_level TEXT CHECK (combat_skill_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS home_country TEXT,
  ADD COLUMN IF NOT EXISTS home_location TEXT;

-- Track the gyms a user has booked, plus rollups for segmentation.
CREATE TABLE IF NOT EXISTS public.user_gym_engagement (
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  gym_id  UUID NOT NULL REFERENCES public.gyms (id) ON DELETE CASCADE,
  first_booked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  last_booked_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  booking_count   INTEGER NOT NULL DEFAULT 0 CHECK (booking_count >= 0),
  total_spend     DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_spend >= 0),
  currency        TEXT,
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  PRIMARY KEY (user_id, gym_id)
);

CREATE INDEX IF NOT EXISTS idx_user_gym_engagement_user_id ON public.user_gym_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_engagement_gym_id ON public.user_gym_engagement(gym_id);

ALTER TABLE public.user_gym_engagement ENABLE ROW LEVEL SECURITY;

-- Users can view their own engagement rows.
CREATE POLICY IF NOT EXISTS "Users can view their own gym engagement"
  ON public.user_gym_engagement FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert engagement for themselves (server uses user session).
CREATE POLICY IF NOT EXISTS "Users can insert their own gym engagement"
  ON public.user_gym_engagement FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update engagement for themselves (server uses user session).
CREATE POLICY IF NOT EXISTS "Users can update their own gym engagement"
  ON public.user_gym_engagement FOR UPDATE
  USING (auth.uid() = user_id);

